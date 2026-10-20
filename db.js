/**
 * db.js — SQLite Database Module (using sql.js — pure JavaScript)
 * Manages simulation history, users, quiz content, quiz attempts and
 * leaderboard data with persistent file-backed SQLite.
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const questionBank = require('./data/questionBank');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'database.db');

let db = null;

/** Save database to disk */
function saveToDisk() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/** Initialize database — returns a Promise */
async function init() {
  const SQL = await initSqlJs();

  // Load existing database file or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign key enforcement (off by default in SQLite)
  db.run('PRAGMA foreign_keys = ON');

  // Create table if not exists
  db.run(`
    CREATE TABLE IF NOT EXISTS simulations (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      protocol TEXT NOT NULL DEFAULT '',
      protocol_key TEXT NOT NULL DEFAULT '',
      example_name TEXT DEFAULT 'Custom',
      transactions TEXT DEFAULT '',
      total_steps INTEGER DEFAULT 0,
      schedule TEXT DEFAULT '[]',
      steps TEXT DEFAULT '[]',
      result TEXT DEFAULT '',
      lock_table TEXT DEFAULT '{}',
      wait_for_graph TEXT DEFAULT '{}',
      is_deadlocked INTEGER DEFAULT 0,
      deadlocked_txns TEXT DEFAULT '[]'
    )
  `);

  createAuthTables();
  createQuizTables();
  seedContent();

  saveToDisk();

  console.log('   Database: ✅ SQLite initialized at', DB_PATH);
  return db;
}

/* ══════════════════════════════════════════════════════════════════
 * SCHEMA — authentication
 * ══════════════════════════════════════════════════════════════════ */

function createAuthTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      sess TEXT NOT NULL,
      expire INTEGER NOT NULL
    )
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)');
}

/* ══════════════════════════════════════════════════════════════════
 * SCHEMA — quizzes, questions, attempts
 * ══════════════════════════════════════════════════════════════════ */

function createQuizTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      level TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT '',
      points_per_question INTEGER NOT NULL DEFAULT 10,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exam_sections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      full_name TEXT NOT NULL DEFAULT '',
      official_url TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
      exam_id TEXT REFERENCES exam_sections(id) ON DELETE CASCADE,
      year INTEGER,
      session TEXT,
      question_type TEXT NOT NULL DEFAULT 'standard',
      verification TEXT NOT NULL DEFAULT 'unverified',
      difficulty TEXT NOT NULL DEFAULT 'easy',
      topic TEXT NOT NULL DEFAULT '',
      subtopic TEXT NOT NULL DEFAULT '',
      prompt TEXT NOT NULL,
      options TEXT NOT NULL DEFAULT '[]',
      correct TEXT NOT NULL DEFAULT '[]',
      multi INTEGER NOT NULL DEFAULT 0,
      explanation TEXT NOT NULL DEFAULT '',
      reference TEXT,
      points INTEGER NOT NULL DEFAULT 10,
      source_url TEXT,
      source_note TEXT,
      created_at TEXT NOT NULL
    )
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_questions_year ON questions(exam_id, year)');

  db.run(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      quiz_id TEXT REFERENCES quizzes(id) ON DELETE SET NULL,
      exam_id TEXT REFERENCES exam_sections(id) ON DELETE SET NULL,
      category TEXT NOT NULL,
      category_key TEXT NOT NULL,
      difficulty TEXT,
      exam_year INTEGER,
      status TEXT NOT NULL DEFAULT 'in_progress',
      question_ids TEXT NOT NULL DEFAULT '[]',
      total_questions INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      points_earned INTEGER NOT NULL DEFAULT 0,
      points_possible INTEGER NOT NULL DEFAULT 0,
      accuracy REAL NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      claimed_at TEXT
    )
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_attempts_user ON quiz_attempts(user_id, status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_attempts_cat ON quiz_attempts(category_key, status)');

  db.run(`
    CREATE TABLE IF NOT EXISTS quiz_answers (
      attempt_id TEXT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      selected TEXT NOT NULL DEFAULT '[]',
      is_correct INTEGER NOT NULL DEFAULT 0,
      points_awarded INTEGER NOT NULL DEFAULT 0,
      answered_at TEXT NOT NULL,
      PRIMARY KEY (attempt_id, question_id)
    )
  `);
}

/* ══════════════════════════════════════════════════════════════════
 * SEED — quizzes, exams and the question bank
 * ══════════════════════════════════════════════════════════════════ */

function seedContent() {
  const now = new Date().toISOString();

  questionBank.QUIZZES.forEach((quiz, index) => {
    db.run(
      `INSERT INTO quizzes (id, title, difficulty, description, level, color, icon, points_per_question, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         difficulty = excluded.difficulty,
         description = excluded.description,
         level = excluded.level,
         color = excluded.color,
         icon = excluded.icon,
         points_per_question = excluded.points_per_question,
         sort_order = excluded.sort_order`,
      [quiz.id, quiz.title, quiz.difficulty, quiz.description, quiz.level, quiz.color, quiz.icon, quiz.pointsPerQuestion, index]
    );
  });

  questionBank.EXAMS.forEach((exam, index) => {
    db.run(
      `INSERT INTO exam_sections (id, name, full_name, official_url, notes, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         full_name = excluded.full_name,
         official_url = excluded.official_url,
         notes = excluded.notes,
         sort_order = excluded.sort_order`,
      [exam.id, exam.name, exam.fullName, exam.officialUrl, exam.notes, index]
    );
  });

  const insertQuestion = (question, quizId) => {
    db.run(
      `INSERT INTO questions
        (id, quiz_id, exam_id, year, session, question_type, verification, difficulty,
         topic, subtopic, prompt, options, correct, multi, explanation, reference,
         points, source_url, source_note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         quiz_id = excluded.quiz_id,
         exam_id = excluded.exam_id,
         year = excluded.year,
         session = excluded.session,
         question_type = excluded.question_type,
         verification = excluded.verification,
         difficulty = excluded.difficulty,
         topic = excluded.topic,
         subtopic = excluded.subtopic,
         prompt = excluded.prompt,
         options = excluded.options,
         correct = excluded.correct,
         multi = excluded.multi,
         explanation = excluded.explanation,
         reference = excluded.reference,
         points = excluded.points,
         source_url = excluded.source_url,
         source_note = excluded.source_note`,
      [
        question.id,
        quizId || null,
        question.examId || null,
        question.year != null ? question.year : null,
        question.session || null,
        question.questionType || 'standard',
        question.verification || 'unverified',
        question.difficulty || 'easy',
        question.topic || '',
        question.subtopic || '',
        question.prompt,
        JSON.stringify(question.options),
        JSON.stringify(question.correct),
        question.multi ? 1 : 0,
        question.explanation || '',
        question.reference || null,
        question.points != null ? question.points : 10,
        question.sourceUrl || null,
        question.sourceNote || null,
        now
      ]
    );
  };

  questionBank.QUESTIONS.forEach(q => insertQuestion(q, q.quizId));
  questionBank.EXAM_QUESTIONS.forEach(q => insertQuestion(q, null));
}

/** Parse a row array into an object */
function parseRow(columns, values) {
  const obj = {};
  columns.forEach((col, i) => { obj[col] = values[i]; });
  return {
    id: obj.id,
    timestamp: obj.timestamp,
    protocol: obj.protocol,
    protocolKey: obj.protocol_key,
    exampleName: obj.example_name,
    transactions: obj.transactions,
    totalSteps: obj.total_steps,
    schedule: JSON.parse(obj.schedule || '[]'),
    steps: JSON.parse(obj.steps || '[]'),
    result: obj.result,
    lockTable: JSON.parse(obj.lock_table || '{}'),
    waitForGraph: JSON.parse(obj.wait_for_graph || '{}'),
    isDeadlocked: !!obj.is_deadlocked,
    deadlockedTxns: JSON.parse(obj.deadlocked_txns || '[]')
  };
}

/** Run a SELECT and return parsed rows */
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  const columns = stmt.getColumnNames();
  while (stmt.step()) {
    results.push(parseRow(columns, stmt.get()));
  }
  stmt.free();
  return results;
}

/** Save a simulation run */
function saveSimulation(data) {
  const id = data.id || crypto.randomUUID();
  db.run(
    `INSERT OR REPLACE INTO simulations 
     (id, timestamp, protocol, protocol_key, example_name, transactions,
      total_steps, schedule, steps, result, lock_table, wait_for_graph,
      is_deadlocked, deadlocked_txns)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.timestamp || new Date().toISOString(),
      data.protocol || '',
      data.protocolKey || data.protocol_key || '',
      data.exampleName || data.example_name || 'Custom',
      data.transactions || '',
      data.totalSteps || data.total_steps || 0,
      JSON.stringify(data.schedule || []),
      JSON.stringify(data.steps || []),
      data.result || '',
      JSON.stringify(data.lockTable || data.lock_table || {}),
      JSON.stringify(data.waitForGraph || data.wait_for_graph || {}),
      data.isDeadlocked || data.is_deadlocked ? 1 : 0,
      JSON.stringify(data.deadlockedTxns || data.deadlocked_txns || [])
    ]
  );

  // Keep only latest 50 entries
  db.run(`DELETE FROM simulations WHERE id NOT IN (
    SELECT id FROM simulations ORDER BY timestamp DESC LIMIT 50
  )`);

  saveToDisk();
  return id;
}

/** Get all simulations sorted by timestamp descending */
function getAllSimulations() {
  return query('SELECT * FROM simulations ORDER BY timestamp DESC');
}

/** Get simulation by ID */
function getSimulationById(id) {
  const results = query('SELECT * FROM simulations WHERE id = ?', [id]);
  return results.length > 0 ? results[0] : null;
}

/** Delete a simulation by ID */
function deleteSimulation(id) {
  db.run('DELETE FROM simulations WHERE id = ?', [id]);
  saveToDisk();
}

/** Clear all simulations */
function clearAllSimulations() {
  db.run('DELETE FROM simulations');
  saveToDisk();
}

/** Get total count */
function getCount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM simulations');
  stmt.step();
  const count = stmt.get()[0];
  stmt.free();
  return count;
}

/** Get aggregated analytics */
function getAnalytics() {
  const total = getCount();

  const stmtDead = db.prepare('SELECT COUNT(*) FROM simulations WHERE is_deadlocked = 1');
  stmtDead.step();
  const deadlocks = stmtDead.get()[0];
  stmtDead.free();

  const successes = total - deadlocks;

  const stmtAvg = db.prepare('SELECT AVG(total_steps) FROM simulations');
  stmtAvg.step();
  const avgRaw = stmtAvg.get()[0];
  stmtAvg.free();
  const avgSteps = avgRaw ? parseFloat(avgRaw).toFixed(1) : '0';

  const protocolCounts = {};
  const stmtProto = db.prepare('SELECT protocol, COUNT(*) as cnt FROM simulations GROUP BY protocol');
  while (stmtProto.step()) {
    const row = stmtProto.get();
    protocolCounts[row[0]] = row[1];
  }
  stmtProto.free();

  const recent = query('SELECT * FROM simulations ORDER BY timestamp DESC LIMIT 10');

  return {
    total,
    deadlocks,
    successes,
    avgSteps,
    deadlockRate: total > 0 ? ((deadlocks / total) * 100).toFixed(0) : '0',
    protocolCounts,
    recent
  };
}

/** Run a SELECT and return raw rows as plain objects. */
function rawQuery(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/* ══════════════════════════════════════════════════════════════════
 * USERS
 * ══════════════════════════════════════════════════════════════════ */

function createUser({ username, email, displayName, passwordHash }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO users (id, username, email, display_name, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, username, email.toLowerCase(), displayName || username, passwordHash, now, now]
  );
  saveToDisk();
  return getUserById(id);
}

function getUserById(id) {
  const rows = rawQuery('SELECT * FROM users WHERE id = ?', [id]);
  return rows.length ? mapUser(rows[0]) : null;
}

function getUserByUsername(username) {
  const rows = rawQuery('SELECT * FROM users WHERE username = ? COLLATE NOCASE', [username]);
  return rows.length ? mapUser(rows[0]) : null;
}

function getUserByEmail(email) {
  const rows = rawQuery('SELECT * FROM users WHERE email = ? COLLATE NOCASE', [email]);
  return rows.length ? mapUser(rows[0]) : null;
}

/** Look a user up by username OR e-mail (login identifier). */
function getUserByLogin(identifier) {
  return getUserByUsername(identifier) || getUserByEmail(identifier);
}

function mapUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    createdAt: row.created_at
  };
}

/** Public (safe) representation of a user — never exposes the password hash. */
function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt
  };
}

/* ══════════════════════════════════════════════════════════════════
 * SESSIONS (backing store for express-session)
 * ══════════════════════════════════════════════════════════════════ */

function getSession(sid) {
  const rows = rawQuery('SELECT sid, sess, expire FROM sessions WHERE sid = ?', [sid]);
  if (!rows.length) return null;
  const row = rows[0];
  if (row.expire && row.expire < Date.now()) {
    deleteSession(sid);
    return null;
  }
  try {
    return JSON.parse(row.sess);
  } catch (e) {
    return null;
  }
}

function setSession(sid, session, userId) {
  const expire = session && session.cookie && session.cookie.expires
    ? new Date(session.cookie.expires).getTime()
    : Date.now() + 30 * 24 * 60 * 60 * 1000;

  db.run(
    `INSERT INTO sessions (sid, user_id, sess, expire) VALUES (?, ?, ?, ?)
     ON CONFLICT(sid) DO UPDATE SET
       user_id = excluded.user_id,
       sess = excluded.sess,
       expire = excluded.expire`,
    [sid, userId || null, JSON.stringify(session), expire]
  );
  saveToDisk();
}

function deleteSession(sid) {
  db.run('DELETE FROM sessions WHERE sid = ?', [sid]);
  saveToDisk();
}

function pruneSessions() {
  db.run('DELETE FROM sessions WHERE expire < ?', [Date.now()]);
  saveToDisk();
}

/* ══════════════════════════════════════════════════════════════════
 * QUIZ CONTENT
 * ══════════════════════════════════════════════════════════════════ */

function listQuizzes() {
  return rawQuery('SELECT * FROM quizzes ORDER BY sort_order ASC').map(row => ({
    id: row.id,
    title: row.title,
    difficulty: row.difficulty,
    description: row.description,
    level: row.level,
    color: row.color,
    icon: row.icon,
    pointsPerQuestion: row.points_per_question,
    questionCount: rawQuery('SELECT COUNT(*) AS c FROM questions WHERE quiz_id = ?', [row.id])[0].c
  }));
}

function getQuiz(id) {
  return listQuizzes().find(q => q.id === id) || null;
}

function listExams() {
  return rawQuery('SELECT * FROM exam_sections ORDER BY sort_order ASC').map(row => {
    const years = rawQuery(
      'SELECT DISTINCT year FROM questions WHERE exam_id = ? AND year IS NOT NULL ORDER BY year DESC',
      [row.id]
    ).map(y => y.year);
    const counts = rawQuery(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN question_type = 'previous_year' THEN 1 ELSE 0 END) AS previousYear,
         SUM(CASE WHEN question_type = 'practice' THEN 1 ELSE 0 END) AS practice,
         COUNT(DISTINCT topic) AS topics
       FROM questions WHERE exam_id = ?`,
      [row.id]
    )[0];

    return {
      id: row.id,
      name: row.name,
      fullName: row.full_name,
      officialUrl: row.official_url,
      notes: row.notes,
      years,
      questionCount: counts.total || 0,
      previousYearCount: counts.previousYear || 0,
      practiceCount: counts.practice || 0,
      topicCount: counts.topics || 0
    };
  });
}

function getExam(id) {
  return listExams().find(e => e.id === id) || null;
}

function mapQuestion(row, { includeAnswer = false } = {}) {
  const question = {
    id: row.id,
    quizId: row.quiz_id,
    examId: row.exam_id,
    year: row.year,
    session: row.session,
    questionType: row.question_type,
    verification: row.verification,
    difficulty: row.difficulty,
    topic: row.topic,
    subtopic: row.subtopic,
    prompt: row.prompt,
    options: JSON.parse(row.options || '[]'),
    multi: !!row.multi,
    explanation: row.explanation,
    reference: row.reference,
    points: row.points,
    sourceUrl: row.source_url,
    sourceNote: row.source_note
  };
  if (includeAnswer) question.correct = JSON.parse(row.correct || '[]');
  return question;
}

function getQuestionsForQuiz(quizId) {
  return rawQuery('SELECT * FROM questions WHERE quiz_id = ? ORDER BY id', [quizId])
    .map(row => mapQuestion(row, { includeAnswer: true }));
}

/** Exam questions with optional filters (examId, year, topic, questionType). */
function getExamQuestions({ examId, year, topic, questionType } = {}) {
  const where = [];
  const params = [];

  if (examId) { where.push('exam_id = ?'); params.push(examId); }
  if (year) { where.push('year = ?'); params.push(Number(year)); }
  if (topic) { where.push('topic = ?'); params.push(topic); }
  if (questionType) { where.push('question_type = ?'); params.push(questionType); }

  const sql = `SELECT * FROM questions WHERE exam_id IS NOT NULL${where.length ? ' AND ' + where.join(' AND ') : ''} ORDER BY question_type, year DESC, id`;
  return rawQuery(sql, params).map(row => mapQuestion(row, { includeAnswer: true }));
}

function getQuestionById(id) {
  const rows = rawQuery('SELECT * FROM questions WHERE id = ?', [id]);
  return rows.length ? mapQuestion(rows[0], { includeAnswer: true }) : null;
}

function getQuestionsByIds(ids) {
  if (!ids || !ids.length) return [];
  const placeholders = ids.map(() => '?').join(',');
  return rawQuery(`SELECT * FROM questions WHERE id IN (${placeholders})`, ids)
    .map(row => mapQuestion(row, { includeAnswer: true }));
}

/* ══════════════════════════════════════════════════════════════════
 * QUIZ ATTEMPTS
 * ══════════════════════════════════════════════════════════════════ */

function mapAttempt(row) {
  return {
    id: row.id,
    userId: row.user_id,
    quizId: row.quiz_id,
    examId: row.exam_id,
    category: row.category,
    categoryKey: row.category_key,
    difficulty: row.difficulty,
    examYear: row.exam_year,
    status: row.status,
    questionIds: JSON.parse(row.question_ids || '[]'),
    totalQuestions: row.total_questions,
    correctCount: row.correct_count,
    pointsEarned: row.points_earned,
    pointsPossible: row.points_possible,
    accuracy: row.accuracy,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    claimedAt: row.claimed_at
  };
}

function createAttempt({
  id, userId = null, quizId = null, examId = null, category, categoryKey,
  difficulty = null, examYear = null, questionIds
}) {
  const attemptId = id || crypto.randomUUID();
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO quiz_attempts
      (id, user_id, quiz_id, exam_id, category, category_key, difficulty, exam_year,
       status, question_ids, total_questions, correct_count, points_earned, points_possible,
       accuracy, started_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, ?, 0, 0, 0, 0, ?)`,
    [
      attemptId, userId, quizId, examId, category, categoryKey, difficulty, examYear,
      JSON.stringify(questionIds), questionIds.length, now
    ]
  );
  saveToDisk();
  return getAttempt(attemptId);
}

function getAttempt(id) {
  const rows = rawQuery('SELECT * FROM quiz_attempts WHERE id = ?', [id]);
  return rows.length ? mapAttempt(rows[0]) : null;
}

function getAttemptAnswers(attemptId) {
  return rawQuery('SELECT * FROM quiz_answers WHERE attempt_id = ? ORDER BY answered_at ASC', [attemptId])
    .map(row => ({
      attemptId: row.attempt_id,
      questionId: row.question_id,
      selected: JSON.parse(row.selected || '[]'),
      isCorrect: !!row.is_correct,
      pointsAwarded: row.points_awarded,
      answeredAt: row.answered_at
    }));
}

function recordAnswer({ attemptId, questionId, selected, isCorrect, pointsAwarded }) {
  db.run(
    `INSERT INTO quiz_answers (attempt_id, question_id, selected, is_correct, points_awarded, answered_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(attempt_id, question_id) DO UPDATE SET
       selected = excluded.selected,
       is_correct = excluded.is_correct,
       points_awarded = excluded.points_awarded,
       answered_at = excluded.answered_at`,
    [attemptId, questionId, JSON.stringify(selected), isCorrect ? 1 : 0, pointsAwarded, new Date().toISOString()]
  );
  saveToDisk();
}

function completeAttempt({ attemptId, correctCount, pointsEarned, pointsPossible }) {
  // Accuracy is a percentage of the questions answered correctly — the
  // point total is a separate value and must not be used here.
  const total = getAttempt(attemptId);
  const totalQuestions = total ? total.totalQuestions : 0;
  const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  db.run(
    `UPDATE quiz_attempts
     SET status = 'completed', correct_count = ?, points_earned = ?, points_possible = ?,
         accuracy = ?, completed_at = ?
     WHERE id = ?`,
    [correctCount, pointsEarned, pointsPossible, accuracy, new Date().toISOString(), attemptId]
  );
  saveToDisk();
  return getAttempt(attemptId);
}

/** Attach a guest attempt to a user account (used after logging in). */
function claimAttempt(attemptId, userId) {
  db.run(
    `UPDATE quiz_attempts
     SET user_id = ?, claimed_at = ?
     WHERE id = ? AND (user_id IS NULL OR user_id = ?)`,
    [userId, new Date().toISOString(), attemptId, userId]
  );
  saveToDisk();
  return getAttempt(attemptId);
}

function getUserAttempts(userId, limit = 100, offset = 0) {
  const rows = rawQuery(
    `SELECT * FROM quiz_attempts
     WHERE user_id = ? AND status = 'completed'
     ORDER BY completed_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return rows.map(mapAttempt);
}

function countUserAttempts(userId) {
  return rawQuery(
    `SELECT COUNT(*) AS c FROM quiz_attempts WHERE user_id = ? AND status = 'completed'`,
    [userId]
  )[0].c;
}

/* ══════════════════════════════════════════════════════════════════
 * LEADERBOARD
 *
 * Ranking rule (documented in the README):
 *   • Only the BEST attempt of every user in every category is counted, so
 *     repeatedly replaying the same quiz can never inflate a score.
 *   • Total points = sum of the best attempt of each category in scope.
 *   • Tie-breakers: average accuracy, then number of quizzes, then username.
 * ══════════════════════════════════════════════════════════════════ */

function leaderboardScopeKeys(scope) {
  if (!scope || scope === 'overall') return null; // null = every category
  if (scope === 'competitive') return { prefix: 'exam:' };
  if (scope.startsWith('exam:')) return { exact: scope };
  return { exact: scope };
}

function getLeaderboard({ scope = 'overall', limit = 25, offset = 0 } = {}) {
  const filter = leaderboardScopeKeys(scope);

  const rows = rawQuery(
    `SELECT a.user_id AS userId, a.category_key AS categoryKey, a.points_earned AS pointsEarned,
            a.points_possible AS pointsPossible, a.correct_count AS correctCount,
            a.total_questions AS totalQuestions, a.accuracy AS accuracy,
            a.completed_at AS completedAt, a.quiz_id AS quizId, a.exam_id AS examId,
            a.exam_year AS examYear, a.difficulty AS difficulty,
            u.username AS username, u.display_name AS displayName
     FROM quiz_attempts a
     JOIN users u ON u.id = a.user_id
     WHERE a.status = 'completed' AND a.user_id IS NOT NULL
     ORDER BY a.completed_at ASC`
  );

  // Keep the best attempt per (user, category)
  const best = new Map();
  rows.forEach(row => {
    if (filter) {
      if (filter.exact && row.categoryKey !== filter.exact) return;
      if (filter.prefix && !String(row.categoryKey).startsWith(filter.prefix)) return;
    }
    const key = `${row.userId}||${row.categoryKey}`;
    const current = best.get(key);
    if (!current || row.pointsEarned > current.pointsEarned ||
      (row.pointsEarned === current.pointsEarned && row.accuracy > current.accuracy) ||
      (row.pointsEarned === current.pointsEarned && row.accuracy === current.accuracy &&
        String(row.completedAt) < String(current.completedAt))) {
      best.set(key, row);
    }
  });

  // Aggregate per user
  const byUser = new Map();
  best.forEach(row => {
    if (!byUser.has(row.userId)) {
      byUser.set(row.userId, {
        userId: row.userId,
        username: row.username,
        displayName: row.displayName,
        totalPoints: 0,
        quizzesCompleted: 0,
        bestScore: 0,
        accuracySum: 0,
        categories: []
      });
    }
    const user = byUser.get(row.userId);
    user.totalPoints += row.pointsEarned;
    user.quizzesCompleted += 1;
    user.accuracySum += row.accuracy;
    if (row.accuracy > user.bestScore) user.bestScore = row.accuracy;
    user.categories.push({
      categoryKey: row.categoryKey,
      quizId: row.quizId,
      examId: row.examId,
      examYear: row.examYear,
      difficulty: row.difficulty,
      points: row.pointsEarned,
      accuracy: row.accuracy,
      completedAt: row.completedAt
    });
  });

  const leaderboard = Array.from(byUser.values()).map(user => ({
    ...user,
    averageAccuracy: user.quizzesCompleted > 0 ? user.accuracySum / user.quizzesCompleted : 0
  }));

  leaderboard.sort((a, b) =>
    (b.totalPoints - a.totalPoints) ||
    (b.averageAccuracy - a.averageAccuracy) ||
    (b.quizzesCompleted - a.quizzesCompleted) ||
    a.username.localeCompare(b.username)
  );

  const total = leaderboard.length;
  const page = leaderboard.slice(offset, offset + limit).map((entry, index) => ({
    rank: offset + index + 1,
    userId: entry.userId,
    username: entry.username,
    displayName: entry.displayName,
    totalPoints: entry.totalPoints,
    quizzesCompleted: entry.quizzesCompleted,
    bestScore: Math.round(entry.bestScore * 10) / 10,
    averageAccuracy: Math.round(entry.averageAccuracy * 10) / 10,
    categories: entry.categories
  }));

  return { scope, total, limit, offset, entries: page };
}

/** Where does the given user stand in the current scope? */
function getUserLeaderboardPosition(userId, { scope = 'overall' } = {}) {
  const board = getLeaderboard({ scope, limit: 100000, offset: 0 });
  const index = board.entries.findIndex(e => e.userId === userId);
  if (index === -1) return null;
  const entry = board.entries[index];
  return {
    rank: index + 1,
    total: board.total,
    totalPoints: entry.totalPoints,
    quizzesCompleted: entry.quizzesCompleted,
    bestScore: entry.bestScore,
    averageAccuracy: entry.averageAccuracy
  };
}

module.exports = {
  init,
  saveSimulation,
  getAllSimulations,
  getSimulationById,
  deleteSimulation,
  clearAllSimulations,
  getCount,
  getAnalytics,
  // users & sessions
  createUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  getUserByLogin,
  toPublicUser,
  getSession,
  setSession,
  deleteSession,
  pruneSessions,
  // quiz content
  listQuizzes,
  getQuiz,
  listExams,
  getExam,
  getQuestionsForQuiz,
  getExamQuestions,
  getQuestionById,
  getQuestionsByIds,
  // attempts
  createAttempt,
  getAttempt,
  getAttemptAnswers,
  recordAnswer,
  completeAttempt,
  claimAttempt,
  getUserAttempts,
  countUserAttempts,
  // leaderboard
  getLeaderboard,
  getUserLeaderboardPosition
};
