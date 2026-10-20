const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./db');
const { sessionMiddleware, createAuthRouter, requireAuth } = require('./auth');
const { createQuizRouter } = require('./quiz-api');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/* Behind a reverse proxy (Render/Railway/Heroku) trust the proxy so that
   `secure` cookies and the client IP are handled correctly. */
app.set('trust proxy', 1);

/* ─────────────── CORS ───────────────
 * The single-page app is served by this very server, so cross-origin access
 * is not required. CORS is therefore only enabled when an explicit allow-list
 * is configured through ALLOWED_ORIGINS (comma separated). */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

if (ALLOWED_ORIGINS.length) {
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin.replace(/\/$/, ''))) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true
  }));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(sessionMiddleware());

/* ─────────────── CSRF / origin guard ───────────────
 * Cookie based authentication is protected against cross-site requests by
 * checking the Origin header of every state-changing request. */
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const origin = req.get('origin');
  if (!origin) return next(); // non-browser client (curl, tests, mobile app)

  const ownOrigin = `${req.protocol}://${req.get('host')}`;
  const allowed = [ownOrigin, ...ALLOWED_ORIGINS];
  if (allowed.includes(origin.replace(/\/$/, ''))) return next();

  return res.status(403).json({ error: 'Cross-origin request rejected.' });
});

app.use(express.static(path.join(__dirname)));

/* ═══════════════ AUTH API ═══════════════
 * The only endpoints that are reachable without a session. */
app.use('/api/auth', createAuthRouter());

/* ═══════════════ EVERYTHING ELSE REQUIRES A SESSION ═══════════════
 * Signing in is compulsory, so all application data is protected. */
app.use('/api', requireAuth);

/* ═══════════════ QUIZ / EXAM / LEADERBOARD API ═══════════════ */
app.use('/api', createQuizRouter());

/* ═══════════════ HISTORY API (SQLite) ═══════════════ */

// GET all simulation history
app.get('/api/history', (req, res) => {
  try {
    const entries = db.getAllSimulations();
    res.json(entries);
  } catch (error) {
    console.error('DB Error (getAll):', error.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET simulation by ID
app.get('/api/history/:id', (req, res) => {
  try {
    const entry = db.getSimulationById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Not found' });
    res.json(entry);
  } catch (error) {
    console.error('DB Error (getById):', error.message);
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

// POST save a simulation
app.post('/api/history', (req, res) => {
  try {
    const id = db.saveSimulation(req.body);
    res.json({ id, success: true });
  } catch (error) {
    console.error('DB Error (save):', error.message);
    res.status(500).json({ error: 'Failed to save simulation' });
  }
});

// DELETE a simulation by ID
app.delete('/api/history/:id', (req, res) => {
  try {
    db.deleteSimulation(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('DB Error (delete):', error.message);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// DELETE all history
app.delete('/api/history', (req, res) => {
  try {
    db.clearAllSimulations();
    res.json({ success: true });
  } catch (error) {
    console.error('DB Error (clearAll):', error.message);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// ═══════════════ ANALYTICS API ═══════════════

app.get('/api/analytics', (req, res) => {
  try {
    const analytics = db.getAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('DB Error (analytics):', error.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ═══════════════ AI CHATBOT API ═══════════════

const SYSTEM_PROMPT = `You are an educational AI tutor for a Locking Protocol Animation application.

Your role is to help students understand database locking and concurrency control.

Topics include:
• Transactions (Read, Write, Commit, Abort)
• Shared Locks (S-Locks) and Exclusive (X-Locks)
• Lock compatibility matrix
• Two-Phase Locking (Basic, Strict, Rigorous)
• Conservative Two-Phase Locking (theory)
• Wait queues
• Wait-For Graphs
• Deadlocks and deadlock detection
• Deadlock resolution

Guidelines:
- Always explain concepts clearly and simply, suitable for undergraduate students.
- When simulation context is provided, use it to answer questions about the current state.
- Do not invent simulation events that are not in the provided context.
- Use bullet points and structured formatting.
- Explain technical terms when they first appear.
- If a deadlock exists, explain the cycle using the Wait-For Graph.
- Keep answers educational and concise unless the user asks for detailed explanation.
- Use emojis sparingly to make explanations friendlier.
- Format text using markdown: **bold**, *italic*, \`code\`.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, context, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'AI service not configured. Please add GROQ_API_KEY to .env file.' });
    }

    // Build messages array for Groq (OpenAI-compatible format)
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

    if (context && context !== 'No simulation is currently active.') {
      messages.push({ role: 'system', content: `CURRENT SIMULATION STATE:\n${context}` });
    }

    if (history && history.length > 0) {
      history.forEach(msg => {
        messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
      });
    }

    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Groq API returned ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.json({ reply });
  } catch (error) {
    console.error('AI API Error:', error.message);
    res.status(500).json({ error: 'Failed to get AI response. ' + error.message });
  }
});

// Unknown API routes must return JSON, not the SPA shell.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.originalUrl });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ═══════════════ BOOTSTRAP ═══════════════ */

async function start() {
  await db.init();
  return app.listen(PORT, () => {
    console.log(`\n🔒 Locking Protocol Animation Server`);
    console.log(`   Running at: http://localhost:${PORT}`);
    console.log(`   AI Tutor: ${process.env.GROQ_API_KEY ? '✅ Enabled (Groq)' : '❌ No API key (fallback mode)'}`);
    console.log(`   Auth: ${process.env.SESSION_SECRET ? '✅ Session secret configured' : '⚠️  No SESSION_SECRET (development only)'}`);
    console.log(`   Database file: ${process.env.DB_PATH || path.join(__dirname, 'database.db')}`);
    console.log(`\n   Open http://localhost:${PORT} in your browser\n`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { app, start, db };
