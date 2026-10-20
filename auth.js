/**
 * auth.js — Server-side authentication for Locking Protocol Animation.
 *
 * Design notes
 * ------------
 * The project already runs on Express + CommonJS and stores its data in SQLite
 * through sql.js, so the authentication layer was chosen to fit that stack
 * without a rewrite:
 *
 *   • express-session  — battle-tested session handling (signed, HTTP-only
 *                        cookies, expiry, rolling). No home-made session logic.
 *   • bcryptjs         — the reference bcrypt implementation in pure
 *                        JavaScript, so no native build step is required on
 *                        the deployment host. Passwords are never stored or
 *                        logged in plain text.
 *
 * The session store is backed by the same SQLite database that already powers
 * simulation history, so sessions survive a server restart.
 *
 * Better Auth was evaluated first (it is the preferred option in the project
 * brief) but it requires a Kysely-compatible SQL dialect. sql.js is not
 * supported by it, which would have meant adding the native `better-sqlite3`
 * driver and a second, parallel database for the very same project — a much
 * larger change than adding authentication actually needs. See README.md.
 */

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || '30', 10) * 24 * 60 * 60 * 1000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/* ───────────────────────── Password helpers ───────────────────────── */

function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/* ───────────────────────── Input validation ───────────────────────── */

const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_-]{2,23}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateRegistration({ username, email, password }) {
  const errors = {};

  if (!username || !USERNAME_RE.test(username)) {
    errors.username = 'Username must be 3–24 characters, start with a letter and use only letters, digits, "_" or "-".';
  }
  if (!email || !EMAIL_RE.test(email)) {
    errors.email = 'Please enter a valid e-mail address.';
  }
  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Password must contain at least one letter and one number.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/* ───────────────────────── Session store ───────────────────────── */

class SqliteSessionStore extends session.Store {
  constructor() {
    super();
    // Periodically drop expired sessions so the table cannot grow forever.
    this.pruneTimer = setInterval(() => {
      try { db.pruneSessions(); } catch (err) { /* keep the server alive */ }
    }, 15 * 60 * 1000);
    if (this.pruneTimer.unref) this.pruneTimer.unref();
  }

  get(sid, callback) {
    try {
      const sess = db.getSession(sid);
      callback(null, sess || null);
    } catch (err) {
      callback(err);
    }
  }

  set(sid, sess, callback) {
    try {
      db.setSession(sid, sess, sess && sess.userId ? sess.userId : null);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      db.deleteSession(sid);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}

/* ───────────────────────── Session middleware ───────────────────────── */

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;

  if (IS_PRODUCTION) {
    throw new Error('SESSION_SECRET must be set (minimum 16 characters) when NODE_ENV=production.');
  }
  // Development fallback — sessions will not survive a restart of the dev server.
  console.warn('   Auth: ⚠️  SESSION_SECRET not set — using an ephemeral development secret.');
  return 'dev-only-insecure-secret-change-me';
}

function sessionMiddleware() {
  return session({
    name: 'lpa.sid',
    secret: sessionSecret(),
    store: new SqliteSessionStore(),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PRODUCTION,
      maxAge: SESSION_MAX_AGE
    }
  });
}

/* ───────────────────────── Route guards ───────────────────────── */

/** Rejects the request unless a logged-in user is present. */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    const user = db.getUserById(req.session.userId);
    if (user) {
      req.user = user;
      return next();
    }
    // The account was removed while the session was alive.
    req.session.destroy(() => {});
  }
  return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
}

/** Attaches req.user when a session exists, but never blocks the request. */
function attachUser(req, res, next) {
  if (req.session && req.session.userId) {
    req.user = db.getUserById(req.session.userId) || null;
  }
  next();
}

/* ───────────────────────── Auth routes ───────────────────────── */

function createAuthRouter() {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    try {
      const username = String(req.body.username || '').trim();
      const email = String(req.body.email || '').trim();
      const password = String(req.body.password || '');
      const displayName = String(req.body.displayName || '').trim() || username;

      const validation = validateRegistration({ username, email, password });
      if (!validation.valid) {
        return res.status(400).json({ error: 'Please correct the highlighted fields.', fields: validation.errors });
      }

      if (db.getUserByUsername(username)) {
        return res.status(409).json({ error: 'That username is already taken.', fields: { username: 'Username already in use.' } });
      }
      if (db.getUserByEmail(email)) {
        return res.status(409).json({ error: 'An account with that e-mail already exists.', fields: { email: 'E-mail already registered.' } });
      }

      const passwordHash = await hashPassword(password);
      const user = db.createUser({ username, email, displayName, passwordHash });

      req.session.userId = user.id;
      req.session.save(() => {
        res.status(201).json({ user: db.toPublicUser(user) });
      });
    } catch (error) {
      console.error('Auth register error:', error.message);
      res.status(500).json({ error: 'Could not create the account. Please try again.' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const identifier = String(req.body.identifier || req.body.username || req.body.email || '').trim();
      const password = String(req.body.password || '');

      if (!identifier || !password) {
        return res.status(400).json({ error: 'Enter your username (or e-mail) and password.' });
      }

      const user = db.getUserByLogin(identifier);
      // Always run a hash comparison so that a missing account and a wrong
      // password take a similar amount of time.
      const hash = user ? user.passwordHash : '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
      const ok = await verifyPassword(password, hash);

      if (!user || !ok) {
        return res.status(401).json({ error: 'Incorrect username or password.' });
      }

      req.session.userId = user.id;
      req.session.save(() => {
        res.json({ user: db.toPublicUser(user) });
      });
    } catch (error) {
      console.error('Auth login error:', error.message);
      res.status(500).json({ error: 'Could not sign you in. Please try again.' });
    }
  });

  router.post('/logout', (req, res) => {
    if (!req.session) return res.json({ success: true });
    req.session.destroy(() => {
      res.clearCookie('lpa.sid');
      res.json({ success: true });
    });
  });

  router.get('/me', attachUser, (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not signed in', code: 'AUTH_REQUIRED' });
    res.json({ user: db.toPublicUser(req.user) });
  });

  return router;
}

module.exports = {
  sessionMiddleware,
  createAuthRouter,
  requireAuth,
  attachUser,
  hashPassword,
  verifyPassword,
  validateRegistration,
  SESSION_MAX_AGE,
  IS_PRODUCTION
};
