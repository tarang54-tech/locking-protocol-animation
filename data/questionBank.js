/**
 * data/questionBank.js — The curated question bank of the Locking Protocol
 * Animation application.
 *
 * The dataset is split into focused files so that new questions can be added
 * without touching the quiz engine:
 *
 *   data/questions/easy.js    — 50 questions whose intrinsic difficulty is easy
 *   data/questions/medium.js  — 50 questions whose intrinsic difficulty is medium
 *   data/questions/hard.js    — 50 questions whose intrinsic difficulty is hard
 *   data/examQuestions.js     — competitive-examination metadata and questions
 *
 * IMPORTANT — how difficulty is decided:
 *   The Easy / Medium / Hard levels describe the intrinsic difficulty of the
 *   QUESTION, never the difficulty of its topic. The topics are deliberately
 *   mixed inside every level, so a level is not simply a set of chapters:
 *   an easy question may be about deadlocks, and a hard question may be about
 *   the lock table. The `difficulty` field of a question always matches the
 *   level it belongs to, and `topic` / `subtopic` only say what it is about.
 *
 * Question shape:
 * {
 *   id, prompt, options:[{id,text}], correct:[optionId], multi, explanation,
 *   topic, subtopic, difficulty, points, reference
 * }
 *
 * Competitive-examination questions additionally carry:
 *   examId, year, session, questionType ('previous_year' | 'practice'),
 *   verification ('verified' | 'unverified'), sourceUrl, sourceNote
 */

const easyQuestions = require('./questions/easy');
const mediumQuestions = require('./questions/medium');
const hardQuestions = require('./questions/hard');
const { EXAMS, EXAM_QUESTIONS } = require('./examQuestions');

const QUIZZES = [
  {
    id: 'easy',
    title: 'Easy — Locking Fundamentals',
    difficulty: 'easy',
    description: 'Straightforward questions that need one rule or one definition: lock types, lock compatibility, the two phases of 2PL, wait queues, commit and abort.',
    level: 'Foundational',
    color: '#2e7d32',
    icon: 'fa-seedling',
    pointsPerQuestion: 10
  },
  {
    id: 'medium',
    title: 'Medium — Applying the Rules',
    difficulty: 'medium',
    description: 'One rule plus one step of reasoning: 2PL variants, lock upgrades and downgrades, wait queues, deadlock handling, schedules and practical scenarios.',
    level: 'Intermediate',
    color: '#ed6c02',
    icon: 'fa-chart-line',
    pointsPerQuestion: 15
  },
  {
    id: 'hard',
    title: 'Hard — Reasoning & Edge Cases',
    difficulty: 'hard',
    description: 'Several steps of reasoning: protocol violations, precedence-graph construction, multi-transaction deadlocks, recoverability and conflicting requirements.',
    level: 'Advanced',
    color: '#d32f2f',
    icon: 'fa-fire',
    pointsPerQuestion: 20
  }
];

/* Point value per difficulty level. */
const QUIZ_POINTS = { easy: 10, medium: 15, hard: 20 };

/* Attach the owning quiz and the default point value to every standard question. */
const QUESTIONS = [
  ...easyQuestions.map(q => ({ ...q, quizId: 'easy', difficulty: 'easy', points: q.points || QUIZ_POINTS.easy })),
  ...mediumQuestions.map(q => ({ ...q, quizId: 'medium', difficulty: 'medium', points: q.points || QUIZ_POINTS.medium })),
  ...hardQuestions.map(q => ({ ...q, quizId: 'hard', difficulty: 'hard', points: q.points || QUIZ_POINTS.hard }))
];

module.exports = {
  QUIZZES,
  EXAMS,
  QUESTIONS,
  EXAM_QUESTIONS,
  QUIZ_POINTS
};
