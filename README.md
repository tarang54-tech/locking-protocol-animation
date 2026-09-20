# Locking Protocol Animation — DBMS Virtual Lab

## Project Overview
Project 51 | DBMS Module 5 | Difficulty: Medium

Interactive web application that teaches and demonstrates Locking Protocols through visualization, simulation, AI-assisted explanations, and step-by-step walkthroughs.

## Features
- 3-panel dashboard (Input, Visualization, Explanation)
- Two-Phase Locking simulation (Basic, Strict, Rigorous)
- D3.js animated visualizations (Lock Table, Wait-For Graph, Timeline)
- Deadlock detection with cycle highlighting
- Deadlock resolution (abort a transaction to resolve)
- 6 pre-built examples
- Dark/Light mode
- Export to JSON and enhanced PDF reports
- Session history stored in SQLite database
- Analytics Dashboard with D3.js charts
- AI Tutor chatbot (Gemini API with fallback mode)
- Speech Explanation (Text-to-Speech)
- SPA Navigation (Simulator, Learn, Help, Download, Analytics, Developed By)
- Fully responsive design
- Keyboard accessible

## Technology Stack

### Frontend
- HTML5, CSS3, Vanilla JavaScript (ES6+)
- D3.js v7 (Visualizations & Analytics charts)
- jsPDF (PDF Export)
- Font Awesome 6 (Icons)
- Web Speech API (Text-to-Speech)

### Backend
- Node.js + Express.js (REST API server)
- Google Generative AI SDK (Gemini API for AI Tutor)

### Database
- SQLite (via sql.js — pure JavaScript)
- Stores simulation history, analytics data
- File: `database.db` (auto-created on first run)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# 1. Navigate to the project folder
cd locking-protocol-animation

# 2. Install dependencies
npm install

# 3. (Optional) Add your Gemini API key for AI Tutor
#    Edit .env file and set: GEMINI_API_KEY=your_key_here

# 4. Start the server
node server.js

# 5. Open in browser
#    http://localhost:3000
```

### Without Backend (Static Mode)
You can also open `index.html` directly in a browser. The simulator works fully offline. History will use localStorage as fallback, and the AI chatbot uses built-in rule-based responses.

## Usage
1. Select a locking protocol (Basic/Strict/Rigorous 2PL)
2. Choose a pre-built example or write custom transactions
3. Click "Run All" for automatic execution or "Step" for step-by-step
4. View the animated Lock Table, Wait-For Graph, and Timeline
5. Read step-by-step explanations in the right panel
6. Click "Read Aloud" to hear explanations via Text-to-Speech
7. Export results as JSON or PDF from the Download section
8. View simulation statistics in the Analytics Dashboard

## Transaction Input Format
```
T1: R(A), W(B), C
T2: R(A), R(B), W(A), C
```
- R(X) = Read data item X
- W(X) = Write data item X  
- C = Commit
- A = Abort

## Sample Scenarios
1. Basic 2PL — No Conflict
2. Shared Lock Compatibility
3. Lock Conflict & Waiting
4. Lock Upgrade Conflict
5. Deadlock Detection
6. Rigorous 2PL Demo

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history` | Get all simulation history |
| POST | `/api/history` | Save a simulation |
| GET | `/api/history/:id` | Get simulation by ID |
| DELETE | `/api/history/:id` | Delete a simulation |
| DELETE | `/api/history` | Clear all history |
| GET | `/api/analytics` | Get aggregated analytics |
| POST | `/api/chat` | AI Tutor chat (Gemini API) |

## Background Theory
The application includes built-in theory covering:
- Shared (S) and Exclusive (X) locks
- Lock compatibility matrix
- Two-Phase Locking protocol and its variants (Basic, Strict, Rigorous, Conservative)
- Deadlock detection using Wait-For Graphs (DFS cycle detection)
- Algorithm complexity analysis

## Project Structure
```
locking-protocol-animation/
├── index.html          (SPA — 6 sections)
├── server.js           (Express backend)
├── db.js               (SQLite database module)
├── package.json
├── database.db         (auto-created SQLite file)
├── .env                (Gemini API key)
├── css/styles.css
└── js/
    ├── simulator.js    (Core 2PL engine)
    ├── examples.js     (6 pre-built scenarios)
    ├── visualizer.js   (D3.js visualizations)
    ├── explainer.js    (Step explanation cards)
    ├── history.js      (API-based history manager)
    ├── export.js       (JSON + PDF export)
    ├── app.js          (Main controller)
    ├── navigation.js   (SPA routing)
    ├── learn.js        (Educational content)
    ├── help.js         (User manual)
    ├── chatbot.js      (AI Tutor)
    ├── speech.js       (Text-to-Speech)
    └── analytics.js    (Statistics dashboard)
```

## Guided By
Dr. Swaminathan A, Assistant Professor

## License
This project is created for educational purposes as part of the DBMS Virtual Lab.
