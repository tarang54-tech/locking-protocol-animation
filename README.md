# Locking Protocol Simulator - DBMS Virtual Lab

## Project Overview
Project 51 | DBMS Module 5 | Difficulty: Medium

Interactive web application that teaches and demonstrates Locking Protocols through
visualisation, simulation, AI-assisted explanations, step-by-step walkthroughs,
difficulty-based quizzes, competitive-examination practice and a persistent,
database-backed leaderboard.

---

## Features

### Simulator
- 3-panel dashboard (Configuration, Visualisation, Explanation)
- **Nine locking protocols** in three families, each with its real rules implemented
  in the engine (see *Locking protocols* below)
- **Transaction columns** — every transaction (T1, T2, T3 …) is displayed in its own
  labelled column with its operations stacked vertically and synchronised with the
  lock table, the wait-for graph and the execution timeline
- Live operation states: pending, completed, waiting, blocked (deadlock), committed,
  aborted, restarted, lock released, buffered and ignored
- Shared / exclusive / update / intention lock badges, `S → X` upgrade markers and
  live "locks held" summaries
- D3.js animated visualisations (Lock Table, Wait-For Graph, Timeline)
- Deadlock detection with cycle highlighting and deadlock resolution (abort a victim)
- 12 pre-built examples, custom schedules, Step / Back / Run All / Auto Play / Reset
- Protocol selector with grouped families and a live explanation of the selected
  protocol's rules
- Export to JSON and enhanced PDF reports
- Simulation history stored in SQLite
- Analytics dashboard with D3.js charts
- AI Tutor chatbot (Groq API with fallback mode)
- Speech explanation (Text-to-Speech)
- Dark / light mode, fully responsive, keyboard accessible

### Quiz (Easy / Medium / Hard)
- Three difficulty levels with **50 questions each** (150 in total)
- The level describes **how hard the question itself is — not which topic it
  covers**: every level mixes lock basics, two-phase locking, deadlocks,
  serializability, transactions and concurrency control
- One question per screen, randomised question order and randomised option order
- Immediate feedback with the correct answer, an explanation and a link to the
  matching Learn section
- Previous / Next navigation, answer review, percentage, accuracy and points
- **Server-side scoring** — the browser never sends or receives a score
- Every attempt is saved to the signed-in account, so scores and the leaderboard
  entry are always attributed to the right person

### Competitive Exams (separate section)
- GATE CSE and UGC NET Computer Science
- Filters for examination, year, topic and question type
- **Verified previous-year questions** carry the examination, year, session, the
  source link and the verification status
- Generated questions are always labelled **Exam-Style Practice Question**
- A browsable catalogue with provenance for every question

### Accounts, history and leaderboard
- **Signing in is compulsory** — a full-screen sign-in gate is shown before the
  application; until an account is created or an existing one is used, the whole
  lab stays hidden and every API endpoint answers `401`
- Registration, login, logout, persistent sessions, display name
- Personal quiz history with answer review
- Leaderboard with rank, points, quizzes completed, best score and average accuracy,
  filterable by difficulty and by examination, with the signed-in user's own position

---

## Technology Stack

### Frontend
- HTML5, CSS3, Vanilla JavaScript (ES6+)
- D3.js v7 (visualisations & analytics charts)
- jsPDF (PDF export)
- Font Awesome 6 (icons)
- Web Speech API (text-to-speech)

### Backend
- Node.js + Express.js (REST API server)
- express-session + bcryptjs (authentication)
- Groq API (AI Tutor)

### Database
- SQLite via `sql.js` (pure JavaScript / WASM — no native build step)
- Stores simulation history, users, sessions, quizzes, questions, attempts and answers
- File: `database.db` (created automatically, path overridable with `DB_PATH`)

---

## Getting Started

### Prerequisites
- Node.js v18 or higher (v22+ recommended)
- npm

### Installation

```bash
# 1. Install the dependencies
npm install

# 2. Create your environment file
cp .env.example .env      # Windows: copy .env.example .env

# 3. Edit .env and set SESSION_SECRET (and GROQ_API_KEY for the AI Tutor)

# 4. Start the server
npm start

# 5. Open http://localhost:3000 in your browser
```

### Without the backend (static mode)
Opening `index.html` directly still gives you the simulator, the Learn section, the
help pages, the exports and the AI tutor's fallback answers. The quiz, the
examinations, the accounts and the leaderboard need the server because they rely on
server-side scoring and a database — and because signing in is compulsory, the
static mode stops at the sign-in gate.

---

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | no | `3000` | Port the HTTP server listens on |
| `SESSION_SECRET` | **in production** | development-only fallback | Secret used to sign the session cookie. Must be at least 16 characters. The server refuses to start in production without it. |
| `SESSION_MAX_AGE` | no | `30` | Session lifetime in days |
| `BCRYPT_ROUNDS` | no | `12` | bcrypt cost factor (higher = slower and stronger) |
| `DB_PATH` | no | `<project>/database.db` | Location of the SQLite file. Point this at a persistent volume in production. |
| `GROQ_API_KEY` | no | – | Enables the AI Tutor. Without it the tutor answers with a built-in rule-based fallback. |
| `ALLOWED_ORIGINS` | no | – | Comma-separated list of extra origins allowed to call the API with credentials. Only needed if the front end is served from another host. |
| `NODE_ENV` | no | – | Set to `production` to enable secure cookies and to require `SESSION_SECRET` |

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`.env` is already listed in `.gitignore` — never commit it.

---

## Authentication

### Which provider was used and why

The brief asked to prefer **Better Auth**. Better Auth was evaluated first and
rejected for this project for three concrete reasons:

1. **It needs a different database engine.** Better Auth requires a
   Kysely-compatible SQL dialect. The project stores everything in SQLite through
   `sql.js` (a WebAssembly build), which Better Auth does not support. Supporting it
   would have meant adding the native `better-sqlite3` driver and a *second*,
   parallel database for the same application.
2. **It adds a native build step to a zero-native-dependency deployment.** The
   current project installs and runs anywhere Node runs. `better-sqlite3` has to be
   compiled or matched to a platform-specific prebuilt binary.
3. **The current stack is CommonJS + vanilla JS.** Better Auth is TypeScript/ESM
   first; adopting it here would have meant a partial migration of the backend for
   a feature that only needs sessions, passwords and a user table.

The chosen alternative is the established, widely deployed combination:

| Concern | Solution |
|---|---|
| Sessions | `express-session` — signed, HTTP-only cookies, expiry, rolling sessions, stored server side |
| Session storage | A `session.Store` implementation backed by the existing SQLite database (survives a server restart) |
| Password hashing | `bcryptjs` — the reference bcrypt implementation in pure JavaScript (no native build) |
| Cookie security | `httpOnly`, `sameSite=lax`, `secure` in production, 30-day expiry, `trust proxy` enabled for HTTPS terminators |
| CSRF | Every state-changing request is checked against the `Origin` header; cross-origin requests are rejected with 403 |

Nothing about the session token or the password hash is ever sent to the browser.
The `/api/auth/me` endpoint returns only `id`, `username`, `email`, `displayName`
and `createdAt`.

### The sign-in gate

Signing in is **compulsory**:

- `index.html` wraps the whole application in `#app-shell` and puts a full-screen
  `#app-gate` in front of it. The gate shows the branding, a short explanation and
  a *Sign in* / *Create account* form.
- On load the client calls `GET /api/auth/me`. If there is no session the gate
  stays visible and `#app-shell` stays hidden, so the simulator, the Learn section,
  the quizzes, the examinations and the leaderboard cannot be reached at all.
- After a successful sign-in the gate is removed, the application becomes
  visible and the history is reloaded from the database.
- Signing out (account button in the navigation → *Sign out*) returns the visitor
  to the gate.
- On the server, `app.use('/api', requireAuth)` sits in front of every
  application endpoint, so an unauthenticated request receives `401` with the
  code `AUTH_REQUIRED`. Only `/api/auth/register`, `/api/auth/login` and
  `/api/auth/me` are reachable without a session.

The HTML shell itself is still served to an anonymous visitor — that is what
allows the sign-in form to render — but no application data is readable and
nothing in the application can be used before signing in.

### Manual steps for a new deployment

1. Set `SESSION_SECRET` to a long random string.
2. Set `NODE_ENV=production` so the session cookie is marked `secure` (requires HTTPS).
3. If the front end is served from another host, add that origin to `ALLOWED_ORIGINS`.
4. Make sure the server is behind HTTPS (a reverse proxy such as nginx, Caddy,
   Cloudflare or the platform's own TLS terminator is enough).

---

## Locking protocols

The protocol selector is grouped into three families. Every protocol implements
its own rules in the engine (`js/simulator.js`) — the rules shown in the panel
under the selector are the rules the engine actually applies.

### Two-Phase Locking Variants

| Protocol | What the engine does |
|---|---|
| **Basic 2PL** | A lock may be taken until the first release, never afterwards. Acquiring a lock in the shrinking phase aborts the transaction. |
| **Strict 2PL** | Basic 2PL, plus: an exclusive lock is held until commit/abort. Releasing an X-lock early aborts the transaction. |
| **Rigorous 2PL** | Basic 2PL, plus: *every* lock (S and X) is held until commit/abort. The commit order is a valid serial order. |
| **Conservative / Static 2PL** | The complete lock set is computed from the schedule and taken **all at once** before the transaction starts. If one lock cannot be granted the transaction waits **holding nothing at all**, so the hold-and-wait condition is removed and deadlocks cannot occur. |

### Locking Modes & Granularity

| Protocol | What the engine does |
|---|---|
| **Shared & Exclusive (S/X) with conversions** | The two fundamental lock modes without the two-phase rule. A write on an item the transaction has read performs an **S → X upgrade** (it waits if a conflict exists); a read on an item it has written performs an **X → S downgrade** (always granted). Because there is no two-phase rule, a lock may be released early and new locks may still be taken — the schedule is then *not* guaranteed to be serializable, which is exactly the point of the comparison with Basic 2PL. |
| **Update locking (U-lock)** | A read takes an **update lock**, which is compatible with a shared lock only. The write converts the U-lock into an X-lock. Two transactions can therefore no longer both read an item and then deadlock while upgrading. |
| **Multiple granularity locking (IS / IX / SIX)** | Items are hierarchical paths such as `db.accounts.p2.r7`. A lock on a node is taken together with **intention locks on its ancestors** (IS for shared access, IX for exclusive access, SIX when the transaction holds both below the node). A lock on a node conflicts with every lock on that node, with the locks below it and with the strong locks above it. |

### Deadlock Prevention Policies

These are **prevention policies used together with locking**, not separate
two-phase locking protocols — the two-phase rules of Basic 2PL still apply.

| Policy | Rule | Engine behaviour |
|---|---|---|
| **Wait-Die** | Older waits, younger dies. | The requester is older than the holder → it waits. The requester is younger → it is **aborted and restarted** at the end of the schedule with a new timestamp. |
| **Wound-Wait** | Older wounds, younger waits. | The requester is older → it **wounds** the holder, which is aborted and restarted, and the requester proceeds. The requester is younger → it waits. |

A transaction that keeps losing is given up after three restarts, which is the
starvation problem the prevention policies are known for.

### Examples

Twelve ready-made scenarios are included (examples 7 – 12 demonstrate the new
protocols):

1. Basic 2PL — No Conflict
2. Shared Lock Compatibility
3. Lock Conflict & Waiting
4. Lock Upgrade Conflict
5. Deadlock Scenario
6. Rigorous 2PL Demo
7. **Conservative 2PL — Deadlock Prevented** (the classic circular wait simply runs)
8. **Multiple Granularity Locking** (database → table → record)
9. **Update Locks — Read-then-Write** (the upgrade deadlock disappears)
10. **Lock Conversion — S → X Upgrade** (the conversion has to wait)
11. **Wait-Die — the Younger Transaction Dies**
12. **Wound-Wait — the Older Transaction Wounds**

### Not implemented: tree protocol locking

The tree protocol is deliberately **not** offered as a selector entry. It needs
a different interaction model: the user must lock every ancestor explicitly in
IS or IX mode *before* a child can be locked, and a transaction that holds an
X-lock on a node may never lock a descendant. The current operation set
(`R(item)`, `W(item)`, `U(item)`, `C`, `A`) has no way to express an explicit
`IX(parent)` request, so the protocol could only have been faked with
multiple-granularity behaviour — which would have been misleading. The
multiple granularity protocol above implements the intention-lock rules
correctly instead.

---

## The quiz system

### Difficulty levels

The level of a question is decided by **the question itself** — how many steps of
reasoning it needs — and never by the chapter it comes from. The three levels
therefore mix the same topics, and a question's `difficulty` field always matches
the level it sits in (a test enforces this).

| Level | Questions | Points per question | What it takes to answer |
|---|---|---|---|
| Easy | 50 | 10 | One rule or one definition — lock types, lock compatibility, the two phases of 2PL, wait queues, commit and abort |
| Medium | 50 | 15 | One rule **plus** one step of reasoning — 2PL variants, upgrades and downgrades, deadlock handling, schedules, practical scenarios |
| Hard | 50 | 20 | Several steps of reasoning — protocol violations, precedence-graph construction, multi-transaction deadlocks, recoverability, conflicting requirements |

Topic spread of the bank (each level covers all six areas):

| Topic | Easy | Medium | Hard |
|---|---|---|---|
| Lock Basics | 11 | 8 | 1 |
| Two-Phase Locking | 12 | 13 | 11 |
| Deadlock | 8 | 10 | 14 |
| Serializability | 6 | 6 | 10 |
| Transactions | 5 | 5 | 8 |
| Concurrency Control | 8 | 8 | 6 |

An attempt draws 5–30 questions at random from the chosen level.

### Scoring rules (shown to the user in the quiz screen)

- A question is worth its point value; there is **no negative marking**.
- A question counts as correct only when the selected options are **exactly** the
  correct options. For multiple-correct questions every correct option must be
  selected and no incorrect one.
- **Points** = sum of the point values of the correctly answered questions.
- **Accuracy** = correct questions ÷ total questions × 100.
- The score is calculated **on the server** from the stored answer key. The client
  never sends a score and the answer key is never sent to the browser before a
  question has been answered.
- A question can only be answered **once per attempt**, so the answer key cannot be
  brute-forced by submitting every option.
- Submitting an attempt twice does not score it twice — the stored result is returned.

### Adding questions

Questions live in `data/questions/easy.js`, `data/questions/medium.js` and
`data/questions/hard.js` and are seeded into the database on start-up (an upsert,
so editing a question updates it in place). Add an object with the same shape and
it appears immediately — no engine changes are needed. The file a question lives
in decides its level, so put it in the file that matches its intrinsic
difficulty, and set `difficulty` accordingly.

```js
{
  id: 'easy-51',                       // unique, stable
  prompt: 'Question text',
  options: [{ id: 'a', text: '…' }, { id: 'b', text: '…' },
            { id: 'c', text: '…' }, { id: 'd', text: '…' }],
  correct: ['b'],                      // array of option ids
  multi: false,                        // true when several options are correct
  explanation: 'Why the answer is right.',
  topic: 'Lock Basics',                // what it is about — may be any topic
  subtopic: 'Shared vs exclusive locks',
  points: 10,                          // defaults to 10 / 15 / 20 by level
  reference: 'Learn § 2.4 Shared Lock (S-Lock)'   // optional
}
```

`data/examQuestions.js` holds the competitive-examination metadata and its
questions; `data/questionBank.js` only combines the files.

---

## Competitive examinations

### Question sourcing and verification policy

The section mixes two clearly separated kinds of questions:

1. **Verified previous-year questions** — the original question, the examination
   year, the session (where applicable), the answer key and a traceable public
   source are recorded in `data/questionBank.js`. A question is only labelled this
   way after the year *and* the key could be checked against a published archive.
   The card shows `GATE CSE — 2024 (Set 2)` and a **Source** link.
2. **Exam-Style Practice Questions** — written for this platform in the style of the
   examination. They carry **no year** and **no source link** and are always
   labelled `Exam-Style Practice Question`, so they can never be mistaken for
   authentic paper questions.

Currently verified previous-year questions (7 in total):

| Examination | Year | Topic |
|---|---|---|
| GATE CSE | 2010 | 2PL vs timestamp ordering (conflict-serializability and deadlock freedom) |
| GATE CSE | 2016 Set 1 | Conservative 2PL (locking in increasing address order) |
| GATE CSE | 2007 | Strict 2PL locking schemes for two transactions |
| GATE CSE | 2007 | Conflict serializability of two schedules |
| GATE CSE | 2024 Set 2 | Statements about the 2PL protocol (multiple correct) |
| UGC NET CS | June 2023 Paper II | 2PL vs timestamp ordering |
| UGC NET CS | December 2014 Paper III | Pessimistic vs optimistic concurrency control |

**No previous-year question, year, answer key or source URL in this project has been
invented.** If a source cannot be traced, the question stays in the practice
collection. The dataset is curated and stored locally — the application never
scrapes a third-party site at runtime.

### Adding an examination question

```js
{
  id: 'gate-cse-2019-serializable',
  examId: 'gate-cse',             // must exist in EXAMS
  year: 2019,                     // required for a previous-year question
  session: 'Set 1',               // optional
  questionType: 'previous_year',  // or 'practice'
  verification: 'verified',       // or 'unverified'
  prompt: '…',
  options: [...], correct: ['b'], multi: false,
  explanation: '…',
  topic: 'Serializability', subtopic: 'Conflict serializability',
  difficulty: 'hard', points: 20,
  sourceUrl: 'https://…',         // required for a previous-year question
  sourceNote: 'Where the question and the key were verified.'
}
```
The `tests/question-bank.test.js` suite fails the build if a previous-year question
is missing its year, source or verification status, or if a practice question claims
a year or a source.

---

## Leaderboard

### Ranking rules

- Only the **best attempt of each user in each category** is counted. Replaying the
  same quiz can therefore never inflate a score or the number of completed quizzes.
- **Total points** = the sum of those best attempts.
- **Quizzes completed** = the number of categories in which the user has an attempt.
- **Best score** = the highest accuracy percentage in any counted attempt.
- **Average accuracy** = the mean accuracy of the counted attempts.
- Tie-breakers, in order: total points → average accuracy → quizzes completed →
  username (alphabetical, for a deterministic order).

Scopes: `overall`, `easy`, `medium`, `hard`, `competitive` and one scope per
examination (`gate-cse`, `ugc-net-cs`). Every scope is computed from the
`quiz_attempts` table — there is no hard-coded or client-side ranking.

---

## API endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create an account and sign in | – |
| POST | `/api/auth/login` | Sign in with a username or e-mail | – |
| POST | `/api/auth/logout` | End the session | – |
| GET | `/api/auth/me` | The signed-in user (401 when signed out) | optional |

### Quizzes, exams and attempts

Every endpoint below requires a session — signing in is compulsory.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/quizzes` | Quiz catalogue with scoring rules |
| GET | `/api/quizzes/:id` | One quiz with its topics |
| GET | `/api/exams` | Examinations with years, topics and question counts |
| GET | `/api/exam-questions` | Question catalogue (`exam`, `year`, `topic`, `type`) |
| POST | `/api/quiz-attempts/start` | Start an attempt (server picks and shuffles) |
| POST | `/api/quiz-attempts/:id/answer` | Answer one question (returns the feedback) |
| POST | `/api/quiz-attempts/:id/submit` | Submit and score the attempt |
| POST | `/api/quiz-attempts/:id/claim` | Attach an attempt to the signed-in account |
| GET | `/api/quiz-attempts/me` | Personal quiz history |
| GET | `/api/quiz-attempts/:id` | One attempt with the answer review (owner only) |
| GET | `/api/leaderboard` | Rankings (`scope`, `limit`, `offset`) |

### Existing endpoints (unchanged, now session-protected)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/history` | All simulation history |
| POST | `/api/history` | Save a simulation |
| GET | `/api/history/:id` | One simulation |
| DELETE | `/api/history/:id` | Delete a simulation |
| DELETE | `/api/history` | Clear the history |
| GET | `/api/analytics` | Aggregated analytics |
| POST | `/api/chat` | AI Tutor (Groq) |

---

## Database

The schema is created and migrated automatically on start-up (`db.init()`); the
tables are created with `IF NOT EXISTS` and the question bank is upserted, so
upgrading the application never destroys data.

| Table | Purpose |
|---|---|
| `simulations` | Simulation history (unchanged) |
| `users` | Accounts — id, username, email, display name, bcrypt password hash, timestamps |
| `sessions` | Server-side sessions — sid, user id, session payload, expiry |
| `quizzes` | The three difficulty quizzes |
| `exam_sections` | The examinations (name, official site, notes) |
| `questions` | Every question with its options, answer key, explanation, points, topic and source metadata |
| `quiz_attempts` | One row per attempt — user, category, status, question ids, score, points, accuracy, timestamps |
| `quiz_answers` | One row per answered question — selected options, correctness, points awarded |

Indexes are created for the session expiry, the questions per quiz and per
examination, and the attempts per user and per category. Foreign keys are enabled
(`PRAGMA foreign_keys = ON`).

### Persistence and deployment

`sql.js` keeps the database in memory and writes the whole file to disk after every
change. The file lives at `database.db` in the project folder by default.

> **Important:** the file is in `.gitignore`, so it is **not** part of the repository.
> On a platform with an ephemeral file system (most free Heroku/Render-style
> deployments) the database is lost on every redeploy, which would also delete the
> accounts, the quiz history and the leaderboard.

Production options, from smallest to largest change:

1. **Persistent volume (recommended, smallest change).** Set `DB_PATH` to a path on a
   mounted volume, e.g. `DB_PATH=/data/database.db`, and mount that volume in the
   platform's service settings. Nothing else changes.
2. **External database.** The SQLite layer is isolated in `db.js`; replacing it with
   PostgreSQL means re-implementing that module's ~20 exported functions. This is the
   right choice for a multi-instance deployment, but it is a much larger change.
3. **Do nothing** — fine for local use and demos, but every redeploy resets the
   leaderboard and all accounts.

The `sql.js` file is written on every mutation, so make sure the volume is writable
and that a backup strategy exists for it.

---

## Testing

```bash
npm test
```

Three suites run with the Node.js built-in test runner:

| Suite | What it covers |
|---|---|
| `tests/simulator-tx-columns.test.js` | Operation identity, per-transaction tracking, waiting / unblocked / deadlock / upgrade states, step-back restoration, protocol violations |
| `tests/protocols.test.js` | The protocol catalogue and every protocol's rules: conservative 2PL (all-or-nothing locks, no deadlock, locks held until the end), S/X conversions (upgrade waits, downgrade granted), update locks (U-lock, U → X, no upgrade deadlock), multiple granularity (intention locks on the ancestors, descendant and ancestor conflicts, SIX locks), Wait-Die and Wound-Wait (who waits, who dies, who is restarted) and the unchanged behaviour of the original three protocols |
| `tests/question-bank.test.js` | Dataset integrity: option counts, unique ids, answer keys, at least 50 questions per level, difficulty matches the level (never the topic), every topic present in several levels, provenance of previous-year vs practice questions |
| `tests/api.test.js` | End-to-end HTTP tests: registration, validation, login/logout, session persistence, every endpoint rejecting an unauthenticated request, server-side scoring, client-supplied scores ignored, one answer per question, duplicate submission rejected, cross-user access rejected, attempt ownership, leaderboard ranking rules and tie-breakers, no private data leaked |

The API tests start the real Express app on an ephemeral port against a throw-away
SQLite file, so they never touch `database.db`.

---

## Project structure

```
locking-protocol-animation/
├── index.html                 (SPA — 10 sections)
├── server.js                  (Express backend, all REST endpoints)
├── db.js                      (SQLite module: schema, queries, leaderboard)
├── auth.js                    (express-session + bcryptjs, session store, auth routes)
├── quiz-api.js                (quiz / exam / attempt / leaderboard endpoints)
├── package.json
├── database.db                (auto-created SQLite file, git-ignored)
├── .env / .env.example        (configuration)
├── data/
│   ├── questionBank.js        (aggregator: quizzes + questions + exams)
│   ├── examQuestions.js       (examination metadata + competitive-exam questions)
│   └── questions/
│       ├── easy.js            (50 easy questions)
│       ├── medium.js          (50 medium questions)
│       └── hard.js            (50 hard questions)
├── css/
│   └── styles.css
├── js/
│   ├── utils.js               (shared helpers)
│   ├── protocols.js           (protocol catalogue + engine rules)
│   ├── simulator.js           (core 2PL engine + protocol behaviour)
│   ├── examples.js            (6 pre-built scenarios)
│   ├── visualizer.js          (D3.js visualisations + transaction columns)
│   ├── explainer.js           (step explanation cards)
│   ├── history.js             (API-based simulation history manager)
│   ├── export.js              (JSON + PDF export)
│   ├── app.js                 (main controller)
│   ├── navigation.js          (SPA routing)
│   ├── learn.js               (educational content)
│   ├── help.js                (user manual)
│   ├── chatbot.js             (AI Tutor)
│   ├── speech.js              (text-to-speech)
│   ├── analytics.js           (statistics dashboard)
│   ├── auth.js                (client-side account handling)
│   ├── quiz.js                (difficulty quiz engine + shared quiz runner)
│   ├── exam.js                (competitive examinations)
│   ├── leaderboard.js         (leaderboard)
│   └── history-section.js     (simulation + quiz history)
└── tests/
    ├── simulator-tx-columns.test.js
    ├── protocols.test.js
    ├── question-bank.test.js
    └── api.test.js
```

---

## Transaction input format

```
T1: R(A), W(B), C
T2: R(A), R(B), W(A), C
```

- `R(X)` = Read data item X
- `W(X)` = Write data item X
- `U(X)` = Unlock data item X (release the lock early)
- `C` = Commit
- `A` = Abort

For the **multiple granularity** protocol the item name is a hierarchical path
separated by dots, e.g. `R(db.accounts.p2.r7)`. The dots define the levels of
the tree and the engine derives the ancestors, the intention locks and the
descendant conflicts from them.

---

## The transaction columns (T1 | T2 | …)

The original application had **no** per-transaction column view: the only
transaction-oriented visualisation was a horizontal bar chart in the *Timeline* tab,
where the transactions were rows and their operations were bars, so T1 and T2 were
never shown side by side.

The new **Transactions** tab (the default view of the visualisation panel) renders
one clearly labelled column per transaction, with that transaction's operations
stacked vertically:

```
┌──────────────┐  ┌──────────────┐
│ T1  ●Active  │  │ T2  ●Waiting │
│ 🔒 X(A)      │  │ (no locks)   │
│ 1  R(A)  S   │  │ 1  R(A)  S   │
│ 2  W(A)  S→X │  │ 2  Commit    │
│ 3  Commit    │  │              │
└──────────────┘  └──────────────┘
```

It is driven by the live simulator state, not by a static table:

- every scheduled operation gets a stable id when the schedule is loaded, and the
  per-transaction operation order is kept even when the transactions are interleaved;
- the simulator records a status for every operation (`pending`, `granted`, `waiting`,
  `unblocked`, `deadlock`, `released`, `committed`, `aborted`, `buffered`, `ignored`);
- the operation that is currently executing is highlighted with a marker and an outline;
- lock badges show the S or X lock, `S → X` for an upgrade and a strike-through when
  the lock has since been released (derived from the live lock table);
- the column header shows the transaction state and the locks it currently holds;
- the view is re-rendered on every step, on *Run All*, on *Back*, on deadlock
  resolution and on *Reset* (where it shows an empty state);
- transactions with a different number of operations are handled, and the panel
  scrolls horizontally when there are many transactions or little space.

---

## Known limitations

- The verified previous-year collection is small (7 questions). It is deliberately
  conservative: a question is only added when the year and the answer key can be
  traced to a public source.- The question bank is public by nature — the API serves the questions to the
  browser, so the answer key can be read by someone who inspects the network
  traffic. The leaderboard itself cannot be manipulated this way, because the score
  is recomputed on the server from the stored key.
- The leaderboard aggregates the attempts in JavaScript after reading the completed
  attempts from SQLite. This is comfortably fast for an educational deployment; a
  very large number of attempts would be better handled with a SQL window function.
- Every attempt is stored in the database with a `NULL` user id and is never
  linked to a leaderboard entry.
- The AI Tutor needs `GROQ_API_KEY`; without it a built-in rule-based fallback
  answers instead.

---

## Guided By
Dr. Swaminathan A, Assistant Professor

## License
This project is created for educational purposes as part of the DBMS Virtual Lab.
Verified previous-year examination questions are reproduced for educational use with
attribution and a link to their public source.
