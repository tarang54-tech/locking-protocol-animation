const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Database will be initialized before server starts (see bottom of file)

// ═══════════════ HISTORY API (SQLite) ═══════════════

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
• Shared Locks (S-Locks) and Exclusive Locks (X-Locks)
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'AI service not configured. Please add GEMINI_API_KEY to .env file.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let prompt = SYSTEM_PROMPT + '\n\n';
    
    if (context && context !== 'No simulation is currently active.') {
      prompt += `CURRENT SIMULATION STATE:\n${context}\n\n`;
    }

    if (history && history.length > 0) {
      prompt += 'CONVERSATION HISTORY:\n';
      history.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }

    prompt += `Student's Question: ${message}\n\nProvide a helpful, educational response:`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error('AI API Error:', error.message);
    res.status(500).json({ error: 'Failed to get AI response. ' + error.message });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server after initializing database
(async () => {
  try {
    await db.init();
    app.listen(PORT, () => {
      console.log(`\n🔒 Locking Protocol Animation Server`);
      console.log(`   Running at: http://localhost:${PORT}`);
      console.log(`   AI Tutor: ${process.env.GEMINI_API_KEY ? '✅ Enabled' : '❌ No API key (fallback mode)'}`);
      console.log(`\n   Open http://localhost:${PORT} in your browser\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
