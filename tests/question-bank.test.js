/**
 * tests/question-bank.test.js — Integrity checks for the curated question bank.
 *
 * These make sure the dataset stays valid when questions are added:
 * every question must be answerable, uniquely identified and — for competitive
 * examinations — properly attributed.
 */
const test = require('node:test');
const assert = require('node:assert');

const { QUIZZES, EXAMS, QUESTIONS, EXAM_QUESTIONS } = require('../data/questionBank');
function assertValidQuestion(question) {
  assert.ok(question.id, 'a question needs an id');
  assert.ok(question.prompt && question.prompt.length > 10, `${question.id} needs a prompt`);
  assert.ok(Array.isArray(question.options) && question.options.length === 4,
    `${question.id} must offer exactly four options`);
  assert.ok(Array.isArray(question.correct) && question.correct.length > 0,
    `${question.id} must declare at least one correct option`);

  const ids = question.options.map(option => option.id);
  assert.strictEqual(new Set(ids).size, ids.length, `${question.id} has duplicate option ids`);

  question.options.forEach(option => {
    assert.ok(option.text && option.text.length > 0, `${question.id} has an empty option`);
  });

  question.correct.forEach(correctId => {
    assert.ok(ids.includes(correctId), `${question.id} references an unknown correct option`);
  });

  assert.strictEqual(new Set(question.correct).size, question.correct.length,
    `${question.id} repeats a correct option`);

  if (question.correct.length > 1) {
    assert.strictEqual(question.multi, true, `${question.id} has several correct options but is not marked multi`);
  }

  assert.ok(question.explanation && question.explanation.length > 20,
    `${question.id} needs a meaningful explanation`);
  assert.ok(question.topic, `${question.id} needs a topic`);
  assert.ok(question.subtopic, `${question.id} needs a subtopic`);
  assert.ok(question.points > 0, `${question.id} needs a positive point value`);
}

test('every difficulty quiz is described and has a full question bank', () => {
  assert.deepStrictEqual(QUIZZES.map(q => q.id), ['easy', 'medium', 'hard']);
  QUIZZES.forEach(quiz => {
    assert.ok(quiz.title && quiz.description && quiz.level);
    assert.ok(quiz.pointsPerQuestion > 0);
  });
});

test('every difficulty level meets or exceeds the target distribution (75 easy, 100 medium, 75 hard)', () => {
  const targets = { easy: 75, medium: 100, hard: 75 };
  QUIZZES.forEach(quiz => {
    const count = QUESTIONS.filter(q => q.quizId === quiz.id).length;
    assert.ok(count >= targets[quiz.id], `${quiz.id} has ${count} questions (expected at least ${targets[quiz.id]})`);
  });
});

test('total distinct questions in the bank exceeds 300', () => {
  const allIds = new Set([...QUESTIONS, ...EXAM_QUESTIONS].map(q => q.id));
  assert.ok(allIds.size >= 300, `total unique questions is ${allIds.size} (expected at least 300)`);
});

test('the difficulty level is a property of the question, not of its topic', () => {
  // Every level must mix several topics …
  QUIZZES.forEach(quiz => {
    const topics = new Set(QUESTIONS.filter(q => q.quizId === quiz.id).map(q => q.topic));
    assert.ok(topics.size >= 5, `${quiz.id} only covers ${topics.size} topics — levels must not map onto topics`);
  });

  // … and every topic must appear in more than one level.
  const levelsByTopic = new Map();
  QUESTIONS.forEach(q => {
    if (!levelsByTopic.has(q.topic)) levelsByTopic.set(q.topic, new Set());
    levelsByTopic.get(q.topic).add(q.quizId);
  });
  levelsByTopic.forEach((levels, topic) => {
    assert.ok(levels.size >= 2, `topic "${topic}" only appears in the ${[...levels].join(', ')} level`);
  });
});

test('a question\'s difficulty always matches the level it belongs to', () => {
  QUESTIONS.forEach(question => {
    assert.strictEqual(question.difficulty, question.quizId,
      `${question.id} declares difficulty "${question.difficulty}" but sits in "${question.quizId}"`);
  });
});

test('the point value grows with the difficulty level', () => {
  const points = {};
  QUIZZES.forEach(quiz => {
    const values = new Set(QUESTIONS.filter(q => q.quizId === quiz.id).map(q => q.points));
    assert.strictEqual(values.size, 1, `${quiz.id} mixes different point values`);
    points[quiz.id] = [...values][0];
  });
  assert.ok(points.easy < points.medium && points.medium < points.hard,
    `each level must be worth more than the level below it (${JSON.stringify(points)})`);
});

test('all difficulty questions are structurally valid', () => {
  QUESTIONS.forEach(assertValidQuestion);
});

test('question ids are unique across the whole dataset', () => {
  const all = [...QUESTIONS, ...EXAM_QUESTIONS].map(q => q.id);
  assert.strictEqual(new Set(all).size, all.length, 'duplicate question ids found');
});

test('the difficulty coverage includes the required topics', () => {
  const topics = new Set(QUESTIONS.map(q => q.topic));
  ['Lock Basics', 'Two-Phase Locking', 'Deadlock', 'Serializability', 'Transactions']
    .forEach(topic => assert.ok(topics.has(topic), `missing topic: ${topic}`));
});

test('every examination has metadata', () => {
  assert.ok(EXAMS.length >= 2);
  EXAMS.forEach(exam => {
    assert.ok(exam.id && exam.name && exam.fullName);
    assert.ok(exam.officialUrl.startsWith('https://'), 'an exam must link to its official site');
    assert.ok(exam.notes && exam.notes.length > 20);
  });
});

test('every examination question is structurally valid', () => {
  EXAM_QUESTIONS.forEach(assertValidQuestion);
});

test('previous-year questions are fully attributed', () => {
  const previousYear = EXAM_QUESTIONS.filter(q => q.questionType === 'previous_year');
  assert.ok(previousYear.length >= 5, 'the verified collection should not be empty');

  previousYear.forEach(question => {
    assert.strictEqual(question.verification, 'verified');
    assert.ok(question.examId, `${question.id} must name its examination`);
    assert.ok(EXAMS.some(exam => exam.id === question.examId), `${question.id} names an unknown exam`);
    assert.ok(Number.isInteger(question.year) && question.year > 1990,
      `${question.id} must carry the examination year`);
    assert.ok(question.sourceUrl && question.sourceUrl.startsWith('https://'),
      `${question.id} must link to a source`);
    assert.ok(question.sourceNote && question.sourceNote.length > 20,
      `${question.id} must explain where the question comes from`);
  });
});

test('generated examination questions are labelled as practice', () => {
  const practice = EXAM_QUESTIONS.filter(q => q.questionType === 'practice');
  assert.ok(practice.length >= 5, 'the practice collection should not be empty');

  practice.forEach(question => {
    assert.strictEqual(question.verification, 'unverified');
    assert.equal(question.sourceUrl, undefined, 'a practice question must not claim a source');
    assert.equal(question.year, null, 'a practice question must not claim an examination year');
  });
});

test('practice questions never claim to be previous-year questions', () => {
  EXAM_QUESTIONS.forEach(question => {
    if (question.questionType === 'practice') {
      assert.notStrictEqual(question.verification, 'verified');
      assert.ok(!question.label || !/Previous Year/i.test(question.label));
    }
  });
});

test('the examination bank is large enough and names only real examinations', () => {
  assert.ok(EXAM_QUESTIONS.length >= 80,
    `the examination bank has ${EXAM_QUESTIONS.length} questions (expected at least 80)`);

  EXAM_QUESTIONS.forEach(question => {
    assert.ok(EXAMS.some(exam => exam.id === question.examId),
      `${question.id} names an unknown examination`);
    assert.ok(['easy', 'medium', 'hard'].includes(question.difficulty),
      `${question.id} has an unknown difficulty`);
  });
});

test('the examination bank covers the whole concurrency syllabus', () => {
  const topics = new Set(EXAM_QUESTIONS.map(question => question.topic));
  ['Lock Basics', 'Two-Phase Locking', 'Serializability', 'Deadlock',
    'Multiple Granularity Locking', 'Concurrency Anomalies', 'Recoverability',
    'Isolation Levels', 'Timestamp Ordering']
    .forEach(topic => assert.ok(topics.has(topic), `missing examination topic: ${topic}`));
});

test('the point value of an examination question follows its difficulty', () => {
  const points = { easy: 10, medium: 15, hard: 20 };
  EXAM_QUESTIONS.forEach(question => {
    assert.strictEqual(question.points, points[question.difficulty],
      `${question.id} is ${question.difficulty} but is worth ${question.points} points`);
  });
});

test('practice questions carry no session', () => {
  EXAM_QUESTIONS
    .filter(question => question.questionType === 'practice')
    .forEach(question => assert.strictEqual(question.session, null,
      `${question.id} must not claim an examination session`));
});

test('every examination offers both verified and practice questions', () => {
  EXAMS.forEach(exam => {
    const questions = EXAM_QUESTIONS.filter(question => question.examId === exam.id);
    assert.ok(questions.some(question => question.questionType === 'previous_year'),
      `${exam.id} has no verified previous-year question`);
    assert.ok(questions.some(question => question.questionType === 'practice'),
      `${exam.id} has no practice question`);
  });
});
