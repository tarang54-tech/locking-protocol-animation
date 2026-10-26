/**
 * quiz-api.js — REST endpoints for quizzes, competitive examinations,
 * quiz attempts (server-side scoring) and the leaderboard.
 *
 * Scoring rules (also shown to the user in the UI):
 *   • Every question carries a point value (10 / 15 / 20 depending on the
 *     difficulty of the question).
 *   • A question is correct only when the selected options are exactly the
 *     correct options (for multiple-correct questions every correct option
 *     must be picked and no incorrect one).
 *   • Total points  = sum of the points of the correctly answered questions.
 *   • Accuracy      = correct questions / total questions × 100.
 * The score is always computed on the server from the stored answer key —
 * the client never sends a score.
 */

const express = require('express');
const crypto = require('crypto');
const db = require('./db');
const { requireAuth, attachUser } = require('./auth');

const DEFAULT_QUESTION_COUNT = 10;
const MAX_QUESTION_COUNT = 30;      // difficulty quizzes (50 questions per level available)
const MAX_EXAM_QUESTION_COUNT = 30; // competitive examinations (87 questions available)

/* ───────────────────────── Helpers ───────────────────────── */

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Strip the answer key and the explanation from a question before sending it out. */
function toClientQuestion(question, { examName } = {}) {
  return {
    id: question.id,
    prompt: question.prompt,
    options: question.options,
    multi: question.multi,
    topic: question.topic,
    subtopic: question.subtopic,
    difficulty: question.difficulty,
    points: question.points,
    questionType: question.questionType,
    examId: question.examId,
    examName: examName || null,
    year: question.year,
    session: question.session,
    verification: question.verification,
    sourceUrl: question.sourceUrl,
    sourceNote: question.sourceNote
  };
}

function sameSet(a, b) {
  const left = [...(a || [])].sort();
  const right = [...(b || [])].sort();
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

/** Label shown on a question card, e.g. "GATE CSE — 2024 (Set 2)". */
function questionLabel(question) {
  if (question.questionType === 'previous_year') {
    const exam = question.examId ? db.getExam(question.examId) : null;
    const name = exam ? exam.name : (question.examId || 'Examination');
    const year = question.year ? ` — ${question.year}` : '';
    const session = question.session ? ` (${question.session})` : '';
    return `${name}${year}${session}`;
  }
  return 'Exam-Style Practice Question';
}

function parseCount(value, max = MAX_QUESTION_COUNT) {
  const count = parseInt(value, 10);
  if (!Number.isFinite(count) || count <= 0) return DEFAULT_QUESTION_COUNT;
  return Math.min(count, max);
}

/* ───────────────────────── Router ───────────────────────── */

function createQuizRouter() {
  const router = express.Router();

  /* ── Quiz catalogue ────────────────────────────────────────────── */

  router.get('/quizzes', (req, res) => {
    try {
      const quizzes = db.listQuizzes().map(quiz => {
        const questions = db.getQuestionsForQuiz(quiz.id);
        const topics = [...new Set(questions.map(q => q.topic))];
        return {
          ...quiz,
          topics,
          scoring: {
            pointsPerQuestion: quiz.pointsPerQuestion,
            totalPoints: quiz.pointsPerQuestion * quiz.questionCount,
            rule: '1 point per 1 point-value; no negative marking. Multi-answer questions must match exactly.'
          }
        };
      });
      res.json({ quizzes, defaultQuestionCount: DEFAULT_QUESTION_COUNT, maxQuestionCount: MAX_QUESTION_COUNT });    } catch (error) {
      console.error('Quiz list error:', error.message);
      res.status(500).json({ error: 'Could not load the quiz catalogue.' });
    }
  });

  router.get('/quizzes/:id', (req, res) => {
    try {
      const quiz = db.getQuiz(req.params.id);
      if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
      const questions = db.getQuestionsForQuiz(quiz.id);
      res.json({
        quiz: {
          ...quiz,
          topics: [...new Set(questions.map(q => q.topic))],
          subtopics: [...new Set(questions.map(q => q.subtopic))]
        }
      });
    } catch (error) {
      console.error('Quiz detail error:', error.message);
      res.status(500).json({ error: 'Could not load the quiz.' });
    }
  });

  /* ── Competitive examinations ──────────────────────────────────── */

  router.get('/exams', (req, res) => {
    try {
      const exams = db.listExams();
      const topics = {};
      db.getExamQuestions().forEach(q => {
        if (!q.examId) return;
        if (!topics[q.examId]) topics[q.examId] = new Set();
        topics[q.examId].add(q.topic);
      });
      res.json({
        exams: exams.map(exam => ({ ...exam, topics: [...(topics[exam.id] || [])] })),
        questionTypes: [
          { id: 'previous_year', label: 'Verified previous-year question' },
          { id: 'practice', label: 'Exam-Style Practice Question' }
        ]
      });
    } catch (error) {
      console.error('Exam list error:', error.message);
      res.status(500).json({ error: 'Could not load the examinations.' });
    }
  });

  router.get('/exam-questions', (req, res) => {
    try {
      const { exam, year, topic, type } = req.query;
      const questions = db.getExamQuestions({
        examId: exam || undefined,
        year: year ? Number(year) : undefined,
        topic: topic || undefined,
        questionType: type || undefined
      });
      res.json({
        questions: questions.map(q => ({
          id: q.id,
          topic: q.topic,
          subtopic: q.subtopic,
          difficulty: q.difficulty,
          points: q.points,
          questionType: q.questionType,
          year: q.year,
          session: q.session,
          examId: q.examId,
          verification: q.verification,
          label: questionLabel(q),
          sourceUrl: q.sourceUrl
        }))
      });
    } catch (error) {
      console.error('Exam questions error:', error.message);
      res.status(500).json({ error: 'Could not load the examination questions.' });
    }
  });

  /* ── Starting an attempt ───────────────────────────────────────── */

  router.post('/quiz-attempts/start', attachUser, (req, res) => {
    try {
      const { quizId, examId, year, topic, questionType } = req.body || {};

      let questions = [];
      let meta = {};
      let count = parseCount((req.body || {}).count);

      if (quizId) {
        const quiz = db.getQuiz(quizId);
        if (!quiz) return res.status(404).json({ error: 'Unknown quiz.' });
        questions = db.getQuestionsForQuiz(quiz.id);
        meta = {
          category: quiz.id,
          categoryKey: quiz.id,
          difficulty: quiz.difficulty,
          quizId: quiz.id,
          examId: null,
          examYear: null,
          title: quiz.title
        };
      } else if (examId) {
        const exam = db.getExam(examId);
        if (!exam) return res.status(404).json({ error: 'Unknown examination.' });
        count = Math.min(count, MAX_EXAM_QUESTION_COUNT);
        questions = db.getExamQuestions({
          examId,
          year: year ? Number(year) : undefined,
          topic: topic || undefined,
          questionType: questionType || undefined
        });
        meta = {
          category: 'competitive',
          categoryKey: `exam:${exam.id}`,
          difficulty: null,
          quizId: null,
          examId: exam.id,
          examYear: year ? Number(year) : null,
          title: exam.name
        };
      } else {
        return res.status(400).json({ error: 'Specify either a quiz or an examination.' });
      }

      if (!questions.length) {
        return res.status(404).json({
          error: 'No questions match the selected filters.',
          code: 'NO_QUESTIONS'
        });
      }

      // Randomise the question order and the option order (server side).
      const selected = shuffle(questions).slice(0, Math.min(count, questions.length));
      const prepared = selected.map(question => ({
        ...toClientQuestion(question, { examName: meta.examId ? (db.getExam(meta.examId) || {}).name : null }),
        options: shuffle(question.options),
        label: questionLabel(question)
      }));

      const attempt = db.createAttempt({
        userId: req.user ? req.user.id : null,
        quizId: meta.quizId,
        examId: meta.examId,
        category: meta.category,
        categoryKey: meta.categoryKey,
        difficulty: meta.difficulty,
        examYear: meta.examYear,
        questionIds: prepared.map(q => q.id)
      });

      res.status(201).json({
        attemptId: attempt.id,
        saved: !!req.user,
        requiresLogin: !req.user,
        meta: {
          title: meta.title,
          category: meta.category,
          difficulty: meta.difficulty,
          examId: meta.examId,
          examYear: meta.examYear,
          totalQuestions: prepared.length,
          pointsPossible: prepared.reduce((sum, q) => sum + q.points, 0)
        },
        questions: prepared
      });
    } catch (error) {
      console.error('Start attempt error:', error.message);
      res.status(500).json({ error: 'Could not start the quiz.' });
    }
  });

  /* ── Answering a single question ───────────────────────────────── */

  router.post('/quiz-attempts/:id/answer', attachUser, (req, res) => {
    try {
      const attempt = db.getAttempt(req.params.id);
      if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });

      if (attempt.userId && req.user && attempt.userId !== req.user.id) {
        return res.status(403).json({ error: 'This attempt belongs to another user.' });
      }

      if (attempt.status === 'completed') {
        return res.status(409).json({ error: 'This attempt has already been submitted.' });
      }

      const { questionId, selected } = req.body || {};
      if (!questionId || !Array.isArray(selected)) {
        return res.status(400).json({ error: 'A question id and the selected options are required.' });
      }
      if (!attempt.questionIds.includes(questionId)) {
        return res.status(400).json({ error: 'That question does not belong to this attempt.' });
      }

      const question = db.getQuestionById(questionId);
      if (!question) return res.status(404).json({ error: 'Question not found.' });

      // A question may only be answered once per attempt. Otherwise a client
      // could submit every option in turn until the correct one is accepted.
      const existing = db.getAttemptAnswers(attempt.id).find(a => a.questionId === questionId);
      if (existing) {
        return res.json({
          questionId,
          alreadyAnswered: true,
          isCorrect: existing.isCorrect,
          correctOptionIds: question.correct,
          selectedOptionIds: existing.selected,
          explanation: question.explanation,
          reference: question.reference,
          pointsAwarded: existing.pointsAwarded,
          pointsPossible: question.points
        });
      }

      const validOptionIds = question.options.map(o => o.id);
      const cleanSelected = [...new Set(selected)].filter(id => validOptionIds.includes(id));
      const isCorrect = sameSet(cleanSelected, question.correct);
      const pointsAwarded = isCorrect ? question.points : 0;

      db.recordAnswer({
        attemptId: attempt.id,
        questionId,
        selected: cleanSelected,
        isCorrect,
        pointsAwarded
      });

      res.json({
        questionId,
        isCorrect,
        correctOptionIds: question.correct,
        selectedOptionIds: cleanSelected,
        explanation: question.explanation,
        reference: question.reference,
        pointsAwarded,
        pointsPossible: question.points
      });
    } catch (error) {
      console.error('Answer error:', error.message);
      res.status(500).json({ error: 'Could not record the answer.' });
    }
  });

  /* ── Submitting an attempt (server-side scoring) ───────────────── */

  router.post('/quiz-attempts/:id/submit', attachUser, (req, res) => {
    try {
      const attempt = db.getAttempt(req.params.id);
      if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });

      if (attempt.userId && req.user && attempt.userId !== req.user.id) {
        return res.status(403).json({ error: 'This attempt belongs to another user.' });
      }

      // A completed attempt is never scored twice — the stored result is returned.
      if (attempt.status === 'completed') {
        return res.json(buildResult(attempt, { alreadyCompleted: true }));
      }

      const questions = db.getQuestionsByIds(attempt.questionIds);
      const answers = db.getAttemptAnswers(attempt.id);
      const answerByQuestion = new Map(answers.map(a => [a.questionId, a]));

      let correctCount = 0;
      let pointsEarned = 0;
      let pointsPossible = 0;

      questions.forEach(question => {
        pointsPossible += question.points;
        const answer = answerByQuestion.get(question.id);
        if (!answer) return;
        // Re-verify against the stored answer key — the client is never trusted.
        const isCorrect = sameSet(answer.selected, question.correct);
        if (isCorrect) {
          correctCount += 1;
          pointsEarned += question.points;
        }
      });

      const completed = db.completeAttempt({
        attemptId: attempt.id,
        correctCount,
        pointsEarned,
        pointsPossible
      });

      res.json(buildResult(completed, { alreadyCompleted: false }));
    } catch (error) {
      console.error('Submit error:', error.message);
      res.status(500).json({ error: 'Could not submit the quiz.' });
    }
  });

  /* ── Saving a guest attempt to an account ──────────────────────── */

  router.post('/quiz-attempts/:id/claim', requireAuth, (req, res) => {
    try {
      const attempt = db.getAttempt(req.params.id);
      if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });
      if (attempt.userId && attempt.userId !== req.user.id) {
        return res.status(403).json({ error: 'This attempt belongs to another user.' });
      }
      if (attempt.status !== 'completed') {
        return res.status(400).json({ error: 'Only a finished attempt can be saved.' });
      }

      const claimed = db.claimAttempt(attempt.id, req.user.id);
      res.json({ attempt: claimed, user: db.toPublicUser(req.user) });
    } catch (error) {
      console.error('Claim attempt error:', error.message);
      res.status(500).json({ error: 'Could not save the attempt.' });
    }
  });

  /* ── Personal history ──────────────────────────────────────────── */

  router.get('/quiz-attempts/me', requireAuth, (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
      const offset = Math.max(parseInt(req.query.offset || '0', 10) || 0, 0);
      const attempts = db.getUserAttempts(req.user.id, limit, offset);
      const total = db.countUserAttempts(req.user.id);

      res.json({
        total,
        limit,
        offset,
        attempts: attempts.map(attempt => ({
          id: attempt.id,
          category: attempt.category,
          categoryKey: attempt.categoryKey,
          difficulty: attempt.difficulty,
          examId: attempt.examId,
          examYear: attempt.examYear,
          quizId: attempt.quizId,
          title: describeAttempt(attempt),
          correctCount: attempt.correctCount,
          totalQuestions: attempt.totalQuestions,
          pointsEarned: attempt.pointsEarned,
          pointsPossible: attempt.pointsPossible,
          accuracy: Math.round(attempt.accuracy * 10) / 10,
          status: attempt.status,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt
        }))
      });
    } catch (error) {
      console.error('Attempt history error:', error.message);
      res.status(500).json({ error: 'Could not load your quiz history.' });
    }
  });

  router.get('/quiz-attempts/:id', requireAuth, (req, res) => {
    try {
      const attempt = db.getAttempt(req.params.id);
      if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });
      if (attempt.userId !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own attempts.' });
      }

      const questions = db.getQuestionsByIds(attempt.questionIds);
      const answers = db.getAttemptAnswers(attempt.id);
      const answerByQuestion = new Map(answers.map(a => [a.questionId, a]));

      res.json({
        attempt: {
          id: attempt.id,
          title: describeAttempt(attempt),
          category: attempt.category,
          difficulty: attempt.difficulty,
          examId: attempt.examId,
          examYear: attempt.examYear,
          correctCount: attempt.correctCount,
          totalQuestions: attempt.totalQuestions,
          pointsEarned: attempt.pointsEarned,
          pointsPossible: attempt.pointsPossible,
          accuracy: Math.round(attempt.accuracy * 10) / 10,
          status: attempt.status,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt
        },
        review: questions.map(question => {
          const answer = answerByQuestion.get(question.id);
          return {
            questionId: question.id,
            prompt: question.prompt,
            options: question.options,
            correctOptionIds: question.correct,
            selectedOptionIds: answer ? answer.selected : [],
            isCorrect: answer ? answer.isCorrect : false,
            explanation: question.explanation,
            topic: question.topic,
            subtopic: question.subtopic,
            points: question.points,
            pointsAwarded: answer ? answer.pointsAwarded : 0,
            questionType: question.questionType,
            year: question.year,
            session: question.session,
            sourceUrl: question.sourceUrl,
            sourceNote: question.sourceNote,
            label: questionLabel(question)
          };
        })
      });
    } catch (error) {
      console.error('Attempt detail error:', error.message);
      res.status(500).json({ error: 'Could not load the attempt.' });
    }
  });

  /* ── Leaderboard ──────────────────────────────────────────────── */

  router.get('/leaderboard', attachUser, (req, res) => {
    try {
      const scope = String(req.query.scope || 'overall');
      const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10) || 25, 1), 100);
      const offset = Math.max(parseInt(req.query.offset || '0', 10) || 0, 0);

      const board = db.getLeaderboard({ scope, limit, offset });
      const me = req.user ? db.getUserLeaderboardPosition(req.user.id, { scope }) : null;

      res.json({
        ...board,
        scoringRule: 'Only the best attempt of each user in each category counts towards the ranking, so replaying a quiz can never inflate a score. Ties are broken by average accuracy, then by the number of quizzes completed.',
        me
      });
    } catch (error) {
      console.error('Leaderboard error:', error.message);
      res.status(500).json({ error: 'Could not load the leaderboard.' });
    }
  });

  return router;
}

/* ───────────────────────── Result helpers ───────────────────────── */

function describeAttempt(attempt) {
  if (attempt.quizId) {
    const quiz = db.getQuiz(attempt.quizId);
    return quiz ? quiz.title : attempt.quizId;
  }
  if (attempt.examId) {
    const exam = db.getExam(attempt.examId);
    const name = exam ? exam.name : attempt.examId;
    return attempt.examYear ? `${name} — ${attempt.examYear}` : name;
  }
  return attempt.category;
}

function buildResult(attempt, { alreadyCompleted }) {
  return {
    attemptId: attempt.id,
    alreadyCompleted,
    saved: !!attempt.userId,
    requiresLogin: !attempt.userId,
    title: describeAttempt(attempt),
    category: attempt.category,
    difficulty: attempt.difficulty,
    examId: attempt.examId,
    examYear: attempt.examYear,
    correctCount: attempt.correctCount,
    totalQuestions: attempt.totalQuestions,
    pointsEarned: attempt.pointsEarned,
    pointsPossible: attempt.pointsPossible,
    accuracy: Math.round(attempt.accuracy * 10) / 10,
    completedAt: attempt.completedAt
  };
}

module.exports = { createQuizRouter, questionLabel, DEFAULT_QUESTION_COUNT, MAX_QUESTION_COUNT };
