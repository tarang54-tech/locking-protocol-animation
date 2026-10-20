/**
 * tests/api.test.js — End-to-end tests for the authentication, quiz, exam and
 * leaderboard APIs.
 *
 * The tests run against a real HTTP server backed by a throw-away SQLite
 * database, so they exercise the same code path as the application.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Use a throw-away database BEFORE the modules are loaded.
const TEST_DB = path.join(os.tmpdir(), `lpa-test-${process.pid}-${Date.now()}.db`);
process.env.DB_PATH = TEST_DB;
process.env.SESSION_SECRET = 'test-secret-value-for-automated-tests-1234';
process.env.NODE_ENV = 'test';

const { app } = require('../server');
const db = require('../db');

let server;
let baseUrl;

/* ───────────────────────── HTTP helpers ───────────────────────── */

/** Minimal cookie jar so a client keeps its session between requests. */
class Client {
  constructor() {
    this.cookies = new Map();
  }

  storeCookies(response) {
    const raw = response.headers.getSetCookie
      ? response.headers.getSetCookie()
      : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : []);
    raw.forEach(cookie => {
      const [pair] = cookie.split(';');
      const index = pair.indexOf('=');
      if (index === -1) return;
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      if (value === '' || /expires=Thu, 01 Jan 1970/i.test(cookie)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    });
  }

  async request(method, url, body) {
    const headers = { Origin: baseUrl };
    if (this.cookies.size) {
      headers.Cookie = Array.from(this.cookies.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
    }
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const response = await fetch(`${baseUrl}${url}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    this.storeCookies(response);

    let data = null;
    const text = await response.text();
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    return { status: response.status, data };
  }

  get(url) { return this.request('GET', url); }
  post(url, body) { return this.request('POST', url, body === undefined ? {} : body); }
  del(url) { return this.request('DELETE', url); }
}

/* ───────────────────────── Setup / teardown ───────────────────────── */

test.before(async () => {
  await db.init();
  await new Promise(resolve => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
  if (server) server.close();
  try { fs.unlinkSync(TEST_DB); } catch (e) { /* ignore */ }
});

/* ───────────────────────── Helpers ───────────────────────── */

async function registerClient(username) {
  const client = new Client();
  const response = await client.post('/api/auth/register', {
    username,
    email: `${username}@example.com`,
    password: 'locking123'
  });
  return { client, response };
}

/** Start an attempt and return the attempt plus its questions. */
async function startAttempt(client, payload) {
  const response = await client.post('/api/quiz-attempts/start', payload);
  assert.strictEqual(response.status, 201, `unexpected status: ${JSON.stringify(response.data)}`);
  return response.data;
}

/* ══════════════════════════════════════════════════════════════════
 * Authentication
 * ══════════════════════════════════════════════════════════════════ */

test('registration creates an account and never returns the password hash', async () => {
  const { response } = await registerClient('alice');
  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.data.user.username, 'alice');
  assert.ok(response.data.user.id);
  assert.equal(response.data.user.passwordHash, undefined);
  assert.equal(response.data.user.password, undefined);
  assert.equal(JSON.stringify(response.data).includes('locking123'), false);
});

test('registration rejects weak passwords and invalid usernames', async () => {
  const client = new Client();
  const weak = await client.post('/api/auth/register', {
    username: 'bob', email: 'bob@example.com', password: 'short'
  });
  assert.strictEqual(weak.status, 400);
  assert.ok(weak.data.fields.password);

  const badUser = await client.post('/api/auth/register', {
    username: '1', email: 'bob@example.com', password: 'locking123'
  });
  assert.strictEqual(badUser.status, 400);
  assert.ok(badUser.data.fields.username);
});

test('a username cannot be registered twice', async () => {
  await registerClient('carol');
  const client = new Client();
  const response = await client.post('/api/auth/register', {
    username: 'carol', email: 'carol2@example.com', password: 'locking123'
  });
  assert.strictEqual(response.status, 409);
});

test('login rejects a wrong password and accepts the right one', async () => {
  const { client } = await registerClient('dave');

  const wrong = await client.post('/api/auth/login', { identifier: 'dave', password: 'wrongpass1' });
  assert.strictEqual(wrong.status, 401);

  const right = await client.post('/api/auth/login', { identifier: 'dave', password: 'locking123' });
  assert.strictEqual(right.status, 200);
  assert.strictEqual(right.data.user.username, 'dave');
});

test('the session survives a reload and can be ended with logout', async () => {
  const { client } = await registerClient('erin');

  const me = await client.get('/api/auth/me');
  assert.strictEqual(me.status, 200);
  assert.strictEqual(me.data.user.username, 'erin');

  const out = await client.post('/api/auth/logout');
  assert.strictEqual(out.status, 200);

  const after = await client.get('/api/auth/me');
  assert.strictEqual(after.status, 401);
});

test('guests cannot read the personal quiz history', async () => {
  const guest = new Client();
  const response = await guest.get('/api/quiz-attempts/me');
  assert.strictEqual(response.status, 401);
});

test('every application endpoint rejects an unauthenticated request', async () => {
  const guest = new Client();

  const protectedRequests = [
    ['GET', '/api/history'],
    ['POST', '/api/history'],
    ['GET', '/api/analytics'],
    ['GET', '/api/quizzes'],
    ['GET', '/api/quizzes/easy'],
    ['GET', '/api/exams'],
    ['GET', '/api/exam-questions'],
    ['GET', '/api/leaderboard'],
    ['GET', '/api/quiz-attempts/me'],
    ['POST', '/api/quiz-attempts/start'],
    ['POST', '/api/chat']
  ];

  for (const [method, url] of protectedRequests) {
    const response = await guest.request(method, url, method === 'GET' ? undefined : {});
    assert.strictEqual(response.status, 401, `${method} ${url} must require a session`);
  }
});

test('the sign-in endpoints stay reachable without a session', async () => {
  const guest = new Client();

  const me = await guest.get('/api/auth/me');
  assert.strictEqual(me.status, 401);
  assert.strictEqual(me.data.code, 'AUTH_REQUIRED');

  const login = await guest.post('/api/auth/login', { identifier: 'nobody', password: 'whatever1' });
  assert.strictEqual(login.status, 401);
});

/* ══════════════════════════════════════════════════════════════════
 * Quiz attempts and server-side scoring
 * ══════════════════════════════════════════════════════════════════ */

test('a guest cannot start a quiz — signing in is compulsory', async () => {
  const guest = new Client();
  const response = await guest.post('/api/quiz-attempts/start', { quizId: 'easy', count: 5 });

  assert.strictEqual(response.status, 401);
  assert.strictEqual(response.data.code, 'AUTH_REQUIRED');
});

test('a signed-in user gets an attempt that is linked to their account', async () => {
  const { client, response: reg } = await registerClient('kate');
  assert.strictEqual(reg.status, 201);

  const attempt = await startAttempt(client, { quizId: 'easy', count: 5 });

  assert.ok(attempt.attemptId);
  assert.strictEqual(attempt.saved, true);
  assert.strictEqual(attempt.requiresLogin, false);
  assert.strictEqual(attempt.questions.length, 5);
  // The answer key must never be sent to the browser.
  attempt.questions.forEach(question => {
    assert.equal(question.correct, undefined);
    assert.equal(question.explanation, undefined);
  });
});

test('the server scores the attempt and the client cannot dictate the score', async () => {
  const { client } = await registerClient('frank');
  const attempt = await startAttempt(client, { quizId: 'easy', count: 3 });

  // Answer every question with the first option offered.
  for (const question of attempt.questions) {
    await client.post(`/api/quiz-attempts/${attempt.attemptId}/answer`, {
      questionId: question.id,
      selected: [question.options[0].id]
    });
  }

  // The client tries to force a perfect score.
  const submit = await client.post(`/api/quiz-attempts/${attempt.attemptId}/submit`, {
    score: 100, pointsEarned: 9999, correctCount: 99
  });

  assert.strictEqual(submit.status, 200);
  assert.ok(submit.data.correctCount <= 3, 'the server must ignore a client supplied score');
  assert.ok(submit.data.pointsEarned <= submit.data.pointsPossible);
  assert.strictEqual(submit.data.accuracy, Math.round((submit.data.correctCount / 3) * 100 * 10) / 10);
  assert.strictEqual(submit.data.saved, true);
});

test('a question can only be answered once per attempt', async () => {
  const { client } = await registerClient('grace');
  const attempt = await startAttempt(client, { quizId: 'easy', count: 3 });
  const question = attempt.questions[0];

  const first = await client.post(`/api/quiz-attempts/${attempt.attemptId}/answer`, {
    questionId: question.id,
    selected: [question.options[0].id]
  });
  assert.strictEqual(first.status, 200);
  assert.strictEqual(first.data.alreadyAnswered, undefined);

  // Trying every other option must not change the recorded answer.
  const second = await client.post(`/api/quiz-attempts/${attempt.attemptId}/answer`, {
    questionId: question.id,
    selected: [question.options[1].id]
  });
  assert.strictEqual(second.status, 200);
  assert.strictEqual(second.data.alreadyAnswered, true);
  assert.deepStrictEqual(second.data.selectedOptionIds, first.data.selectedOptionIds);
  assert.strictEqual(second.data.isCorrect, first.data.isCorrect);
});

test('a question that does not belong to the attempt is rejected', async () => {
  const { client } = await registerClient('heidi');
  const attempt = await startAttempt(client, { quizId: 'easy', count: 2 });
  const other = await startAttempt(client, { quizId: 'medium', count: 2 });

  const response = await client.post(`/api/quiz-attempts/${attempt.attemptId}/answer`, {
    questionId: other.questions[0].id,
    selected: [other.questions[0].options[0].id]
  });
  assert.strictEqual(response.status, 400);
});

test('an attempt cannot be submitted twice', async () => {
  const { client } = await registerClient('ivan');
  const attempt = await startAttempt(client, { quizId: 'easy', count: 2 });

  for (const question of attempt.questions) {
    await client.post(`/api/quiz-attempts/${attempt.attemptId}/answer`, {
      questionId: question.id,
      selected: [question.options[0].id]
    });
  }

  const first = await client.post(`/api/quiz-attempts/${attempt.attemptId}/submit`);
  const second = await client.post(`/api/quiz-attempts/${attempt.attemptId}/submit`);

  assert.strictEqual(first.status, 200);
  assert.strictEqual(first.data.alreadyCompleted, false);
  assert.strictEqual(second.status, 200);
  assert.strictEqual(second.data.alreadyCompleted, true);
  assert.strictEqual(second.data.pointsEarned, first.data.pointsEarned);
  assert.strictEqual(second.data.correctCount, first.data.correctCount);
});

test('one user cannot answer or read an attempt that belongs to another user', async () => {
  const alice = (await registerClient('judy')).client;
  const mallory = (await registerClient('mallory')).client;

  const attempt = await startAttempt(alice, { quizId: 'easy', count: 2 });
  const question = attempt.questions[0];

  const answer = await mallory.post(`/api/quiz-attempts/${attempt.attemptId}/answer`, {
    questionId: question.id,
    selected: [question.options[0].id]
  });
  assert.strictEqual(answer.status, 403);

  const submit = await mallory.post(`/api/quiz-attempts/${attempt.attemptId}/submit`);
  assert.strictEqual(submit.status, 403);

  const view = await mallory.get(`/api/quiz-attempts/${attempt.attemptId}`);
  assert.strictEqual(view.status, 403);
});

test('an attempt can only be claimed by the user who owns it', async () => {
  const owner = (await registerClient('kate2')).client;
  const other = (await registerClient('mallory2')).client;

  const attempt = await startAttempt(owner, { quizId: 'easy', count: 2 });
  for (const question of attempt.questions) {
    await owner.post(`/api/quiz-attempts/${attempt.attemptId}/answer`, {
      questionId: question.id,
      selected: [question.options[0].id]
    });
  }
  await owner.post(`/api/quiz-attempts/${attempt.attemptId}/submit`);

  // A different user must not be able to attach the attempt to their account.
  const claim = await other.post(`/api/quiz-attempts/${attempt.attemptId}/claim`);
  assert.strictEqual(claim.status, 403);

  // The owner may re-claim their own attempt.
  const own = await owner.post(`/api/quiz-attempts/${attempt.attemptId}/claim`);
  assert.strictEqual(own.status, 200);
  assert.strictEqual(own.data.attempt.userId, own.data.user.id);
});

/* ══════════════════════════════════════════════════════════════════
 * Question bank / catalogue
 * ══════════════════════════════════════════════════════════════════ */

test('the quiz catalogue exposes the three difficulty levels', async () => {
  const client = (await registerClient('catalogue')).client;
  const response = await client.get('/api/quizzes');
  assert.strictEqual(response.status, 200);

  const ids = response.data.quizzes.map(q => q.id).sort();
  assert.deepStrictEqual(ids, ['easy', 'hard', 'medium']);
  response.data.quizzes.forEach(quiz => {
    assert.ok(quiz.questionCount >= 50, `${quiz.id} should have a full question bank`);
    assert.ok(quiz.pointsPerQuestion > 0);
    assert.ok(quiz.topics.length >= 5, `${quiz.id} must mix several topics`);
  });
  assert.ok(response.data.maxQuestionCount >= 20);
});

test('the examination catalogue separates verified previous-year questions from practice', async () => {
  const client = (await registerClient('exams')).client;
  const response = await client.get('/api/exams');
  assert.strictEqual(response.status, 200);

  response.data.exams.forEach(exam => {
    assert.ok(exam.previousYearCount > 0, `${exam.id} should have verified previous-year questions`);
    assert.ok(exam.practiceCount > 0, `${exam.id} should have practice questions`);
    assert.ok(exam.years.length > 0);
  });

  const questions = await client.get('/api/exam-questions?exam=gate-cse&type=previous_year');
  questions.data.questions.forEach(question => {
    assert.strictEqual(question.questionType, 'previous_year');
    assert.strictEqual(question.verification, 'verified');
    assert.ok(question.year, 'a previous-year question must carry its year');
    assert.ok(question.sourceUrl, 'a previous-year question must link to its source');
  });
});

test('an exam attempt keeps the question provenance visible', async () => {
  const { client } = await registerClient('leo');
  const attempt = await startAttempt(client, { examId: 'gate-cse', count: 3, questionType: 'previous_year' });

  assert.strictEqual(attempt.questions.length, 3);
  attempt.questions.forEach(question => {
    assert.strictEqual(question.questionType, 'previous_year');
    assert.ok(question.year);
    assert.ok(question.sourceUrl);
    assert.ok(question.label.includes('GATE CSE'));
  });
});

/* ══════════════════════════════════════════════════════════════════
 * Leaderboard
 * ══════════════════════════════════════════════════════════════════ */

test('the leaderboard ranks users by their best attempt in each category', async () => {
  const client = (await registerClient('mona')).client;

  // A first attempt in the easy quiz.
  const first = await startAttempt(client, { quizId: 'easy', count: 2 });
  for (const question of first.questions) {
    await client.post(`/api/quiz-attempts/${first.attemptId}/answer`, {
      questionId: question.id,
      selected: [question.options[0].id]
    });
  }
  const firstResult = await client.post(`/api/quiz-attempts/${first.attemptId}/submit`);

  // A second attempt in the same category must not add to the total.
  const second = await startAttempt(client, { quizId: 'easy', count: 2 });
  for (const question of second.questions) {
    await client.post(`/api/quiz-attempts/${second.attemptId}/answer`, {
      questionId: question.id,
      selected: [question.options[0].id]
    });
  }
  const secondResult = await client.post(`/api/quiz-attempts/${second.attemptId}/submit`);

  const board = await client.get('/api/leaderboard?scope=easy');
  assert.strictEqual(board.status, 200);

  const entry = board.data.entries.find(e => e.username === 'mona');
  assert.ok(entry, 'the user must appear on the leaderboard');

  // Only the BEST attempt of the category counts — never the sum of them.
  const best = Math.max(firstResult.data.pointsEarned, secondResult.data.pointsEarned);
  assert.strictEqual(entry.totalPoints, best,
    'the leaderboard must use the best attempt of the category');
  assert.ok(entry.totalPoints <= firstResult.data.pointsEarned + secondResult.data.pointsEarned);
  assert.strictEqual(entry.quizzesCompleted, 1, 'replaying a quiz must not add quizzes completed');
  assert.ok(board.data.me, 'the signed-in user must see their own position');
  assert.strictEqual(board.data.me.rank, entry.rank);
});

test('a different category adds to the total and the ranking is ordered', async () => {
  const client = (await registerClient('nina')).client;

  for (const quizId of ['easy', 'medium']) {
    const attempt = await startAttempt(client, { quizId, count: 2 });
    for (const question of attempt.questions) {
      await client.post(`/api/quiz-attempts/${attempt.attemptId}/answer`, {
        questionId: question.id,
        selected: [question.options[0].id]
      });
    }
    await client.post(`/api/quiz-attempts/${attempt.attemptId}/submit`);
  }

  const board = await client.get('/api/leaderboard?scope=overall');
  const entry = board.data.entries.find(e => e.username === 'nina');
  assert.ok(entry);
  assert.strictEqual(entry.quizzesCompleted, 2);

  // The board must be sorted by points, then accuracy.
  for (let i = 1; i < board.data.entries.length; i++) {
    const previous = board.data.entries[i - 1];
    const current = board.data.entries[i];
    assert.ok(
      previous.totalPoints > current.totalPoints ||
      (previous.totalPoints === current.totalPoints && previous.averageAccuracy >= current.averageAccuracy),
      'the leaderboard must be ordered by points and then accuracy'
    );
  }
});

test('the exam question catalogue respects every filter', async () => {
  const client = (await registerClient('filters')).client;

  const all = await client.get('/api/exam-questions?exam=gate-cse');
  assert.strictEqual(all.status, 200);
  const allCount = all.data.questions.length;
  assert.ok(allCount > 0);

  // Year filter
  const year2024 = await client.get('/api/exam-questions?exam=gate-cse&year=2024');
  assert.strictEqual(year2024.status, 200);
  assert.ok(year2024.data.questions.length < allCount, 'the year filter must narrow the list');
  year2024.data.questions.forEach(question => {
    assert.strictEqual(question.year, 2024);
    assert.strictEqual(question.examId, 'gate-cse');
  });

  // Question type filter
  const previousYear = await client.get('/api/exam-questions?exam=gate-cse&type=previous_year');
  previousYear.data.questions.forEach(question => {
    assert.strictEqual(question.questionType, 'previous_year');
    assert.ok(question.year, 'a previous-year question must carry its year');
  });
  assert.ok(previousYear.data.questions.length < allCount, 'the type filter must narrow the list');

  // Topic filter
  const topics = [...new Set(all.data.questions.map(q => q.topic))];
  const topic = topics[0];
  const byTopic = await client.get(`/api/exam-questions?exam=gate-cse&topic=${encodeURIComponent(topic)}`);
  byTopic.data.questions.forEach(question => assert.strictEqual(question.topic, topic));
  assert.ok(byTopic.data.questions.length <= allCount);

  // A combination that matches nothing
  const none = await client.get('/api/exam-questions?exam=gate-cse&year=1999');
  assert.strictEqual(none.status, 200);
  assert.strictEqual(none.data.questions.length, 0);
});

test('an exam attempt honours the year and type filters', async () => {
  const client = (await registerClient('examfilter')).client;
  const attempt = await startAttempt(client, {
    examId: 'gate-cse',
    count: 5,
    year: 2024,
    questionType: 'previous_year'
  });

  assert.ok(attempt.questions.length >= 1);
  attempt.questions.forEach(question => {
    assert.strictEqual(question.year, 2024);
    assert.strictEqual(question.questionType, 'previous_year');
  });
});

test('an exam attempt with an impossible filter is rejected', async () => {
  const client = (await registerClient('nofilter')).client;
  const response = await client.post('/api/quiz-attempts/start', {
    examId: 'gate-cse',
    year: 1999
  });
  assert.strictEqual(response.status, 404);
  assert.strictEqual(response.data.code, 'NO_QUESTIONS');
});

test('the leaderboard does not expose private user information', async () => {
  const client = (await registerClient('private')).client;
  const board = await client.get('/api/leaderboard');
  assert.strictEqual(board.status, 200);

  board.data.entries.forEach(entry => {
    assert.equal(entry.email, undefined);
    assert.equal(entry.passwordHash, undefined);
    assert.ok(entry.username);
  });
});

test('a competitive-exam attempt lands in the competitive category', async () => {
  const client = (await registerClient('omar')).client;
  const attempt = await startAttempt(client, { examId: 'ugc-net-cs', count: 2 });
  for (const question of attempt.questions) {
    await client.post(`/api/quiz-attempts/${attempt.attemptId}/answer`, {
      questionId: question.id,
      selected: [question.options[0].id]
    });
  }
  const result = await client.post(`/api/quiz-attempts/${attempt.attemptId}/submit`);
  assert.strictEqual(result.data.category, 'competitive');

  const board = await client.get('/api/leaderboard?scope=competitive');
  const entry = board.data.entries.find(e => e.username === 'omar');
  assert.ok(entry, 'the user must appear in the competitive leaderboard');
  assert.strictEqual(entry.totalPoints, result.data.pointsEarned);
});
