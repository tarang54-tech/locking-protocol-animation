/**
 * data/examQuestions.js — Competitive-examination metadata and question bank.
 *
 *data/questionBank.js — Curated question bank for the Locking Protocol Animation app.
 *
 *The dataset is structured so new questions can be added without touching the
 *quiz engine:
 *  • Difficulty quizzes (easy / medium / hard)  → `QUIZZES`
 *  • Competitive-examination questions          → `EXAM_QUESTIONS`
 *
 *Every question uses the same shape:
 *{
 *  id, prompt, options:[{id,text}], correct:[optionId], multi, explanation,
 *  topic, subtopic, difficulty, points, reference
 *}
 *
 *Competitive-examination questions additionally carry:
 *  examId, year, session, questionType ('previous_year' | 'practice'),
 *  verification ('verified' | 'unverified'), sourceUrl, sourceNote
 *
 *IMPORTANT — provenance rules:
 *  • A question is only marked questionType:'previous_year' when the original
 *    question, the examination year and the answer key could be verified
 *    against a traceable public source (see sourceUrl).
 *  • Every other examination question is explicitly marked
 *    questionType:'practice' and is displayed as "Exam-Style Practice
 *    Question" so it is never mistaken for an authentic paper question.
 */
const EXAMS = [
  {
    id: 'gate-cse',
    name: 'GATE CSE',
    fullName: 'Graduate Aptitude Test in Engineering — Computer Science & IT',
    officialUrl: 'https://gate.nta.nic.in/',
    notes: 'Questions are taken from the public GATE CSE archive. Only the years that can be traced to a published paper and answer key are labelled as previous-year questions; everything else is labelled "Exam-Style Practice Question".'
  },
  {
    id: 'ugc-net-cs',
    name: 'UGC NET Computer Science',
    fullName: 'UGC NET — Computer Science and Applications',
    officialUrl: 'https://ugcnet.nta.nic.in/',
    notes: 'Questions are taken from the public UGC NET Computer Science and Applications papers. Only the years that can be traced to a published paper and answer key are labelled as previous-year questions.'
  }
];

/* ── Verified previous-year questions ─────────────────────────────── */

const EXAM_QUESTIONS = [
  {
    id: 'gate-cse-2010-2pl-deadlock',
    examId: 'gate-cse',
    year: 2010,
    session: null,
    questionType: 'previous_year',
    verification: 'verified',
    prompt: 'Which of the following concurrency control protocols ensure both conflict serializability and freedom from deadlock?\nI. 2-phase locking\nII. Time-stamp ordering',
    options: [
      { id: 'a', text: 'I only' },
      { id: 'b', text: 'II only' },
      { id: 'c', text: 'Both I and II' },
      { id: 'd', text: 'Neither I nor II' }
    ],
    correct: ['b'],
    explanation: 'Two-phase locking guarantees conflict-serializability but not freedom from deadlock — transactions can wait for one another in a cycle. Timestamp ordering is conflict-serializable and, because no transaction ever waits for a lock, deadlock-free as well. Hence only statement II is correct.',
    topic: 'Concurrency Control',
    subtopic: 'Deadlock freedom',
    difficulty: 'hard',
    points: 20,
    sourceUrl: 'https://gateoverflow.in/2196/gate-cse-2010-question-20',
    sourceNote: 'GATE CSE 2010 — Database Management System. Question text and answer key cross-checked against the GATE Overflow and ExamSIDE archives of the GATE CSE 2010 paper.'
  },
  {
    id: 'gate-cse-2016-conservative-2pl',
    examId: 'gate-cse',
    year: 2016,
    session: 'Set 1',
    questionType: 'previous_year',
    verification: 'verified',
    prompt: 'Consider the following two phase locking protocol. Suppose a transaction T accesses (for read or write operations), a certain set of objects {O1,…,Ok}. This is done in the following manner:\nStep 1. T acquires exclusive locks to O1,…,Ok in increasing order of their addresses.\nStep 2. The required operations are performed.\nStep 3. All locks are released.\nThis protocol will',
    options: [
      { id: 'a', text: 'guarantee serializability and deadlock-freedom' },
      { id: 'b', text: 'guarantee neither serializability nor deadlock-freedom' },
      { id: 'c', text: 'guarantee serializability but not deadlock-freedom' },
      { id: 'd', text: 'guarantee deadlock-freedom but not serializability' }
    ],
    correct: ['a'],
    explanation: 'This is conservative (static) two-phase locking. All locks are taken in a single fixed order before any operation is performed, so a circular wait can never arise and the protocol is deadlock-free; the resulting schedule is also conflict-serializable.',
    topic: 'Two-Phase Locking',
    subtopic: 'Conservative 2PL',
    difficulty: 'hard',
    points: 20,
    sourceUrl: 'https://questions.examside.com/past-years/gate/gate-cse/database-management-system/transactions-and-concurrency',
    sourceNote: 'GATE CSE 2016 Set 1 (also repeated in Set 2) — Database Management System, Transactions and Concurrency. Answer key cross-checked against the ExamSIDE topic archive and the Testbook reproduction of the 2016 Shift 1 paper.'
  },
  {
    id: 'gate-cse-2007-strict-2pl-schemes',
    examId: 'gate-cse',
    year: 2007,
    session: null,
    questionType: 'previous_year',
    verification: 'verified',
    prompt: 'Consider the following two transactions:\nT1: read (A); read (B); if A = 0 then B ← B + 1; write (B);\nT2: read (B); read (A); if B ≠ 0 then A ← A − 1; write (A);\nWhich of the following schemes, using shared and exclusive locks, satisfy the requirements for strict two phase locking for the above transactions?\n(S2 mirrors S1 with A and B interchanged.)',
    options: [
      { id: 'a', text: 'S1: lockS(A); read(A); lockS(B); read(B); write(B); commit; unlock(A); unlock(B) — the write is performed while only shared locks are held' },
      { id: 'b', text: 'S1: lockX(A); read(A); lockX(B); read(B); write(B); unlock(A); commit; unlock(B) — an exclusive lock is released before the commit' },
      { id: 'c', text: 'S1: lockS(A); read(A); lockX(B); read(B); write(B); unlock(A); commit; unlock(B) — only the shared lock is released before the commit' },
      { id: 'd', text: 'S1: lockS(A); read(A); lockX(B); read(B); write(B); unlock(A); unlock(B); commit — both locks are released before the commit' }
    ],
    correct: ['c'],
    explanation: 'Strict 2PL requires that all exclusive locks be held until the transaction commits or aborts, and (as with 2PL) no new lock may be acquired after the first release. Scheme C satisfies both: the X-lock taken for the write is held until commit, while the shared lock may be released earlier. Scheme A writes without an X-lock, and schemes B and D release an X-lock before committing.',
    topic: 'Two-Phase Locking',
    subtopic: 'Strict 2PL',
    difficulty: 'hard',
    points: 20,
    sourceUrl: 'https://questions.examside.com/past-years/year-wise/gate/gate-cse/gate-cse-2007/p75IIGrIbB2d5bsX',
    sourceNote: 'GATE CSE 2007 — Database Management System, Transactions and Concurrency. Question text and answer key cross-checked against the ExamSIDE archive of the GATE CSE 2007 paper.'
  },
  {
    id: 'gate-cse-2007-conflict-serializable-schedules',
    examId: 'gate-cse',
    year: 2007,
    session: null,
    questionType: 'previous_year',
    verification: 'verified',
    prompt: 'Consider the following schedules involving two transactions. Which one of the following statements is TRUE?\nS1: r1(X); r1(Y); r2(Y); r2(X); w2(Y); w1(X);\nS2: r1(X); r2(X); r2(Y); w2(Y); r1(Y); w1(X);',
    options: [
      { id: 'a', text: 'Both S1 and S2 are conflict serializable' },
      { id: 'b', text: 'S1 is conflict serializable and S2 is not conflict serializable' },
      { id: 'c', text: 'S1 is not conflict serializable and S2 is conflict serializable' },
      { id: 'd', text: 'Both S1 and S2 are not conflict serializable' }
    ],
    correct: ['c'],
    explanation: 'In S1, r1(Y) before w2(Y) gives the edge T1 → T2 and r2(X) before w1(X) gives T2 → T1, so the precedence graph has a cycle and S1 is not conflict-serializable. In S2 every conflict edge points from T2 to T1 only, the graph is acyclic, and S2 is conflict-serializable.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    difficulty: 'hard',
    points: 20,
    sourceUrl: 'https://questions.examside.com/past-years/year-wise/gate/gate-cse/gate-cse-2007/zeLLaoxiEjmTzaPr',
    sourceNote: 'GATE CSE 2007 — Database Management System, Transactions and Concurrency. Question text and answer key cross-checked against the ExamSIDE archive of the GATE CSE 2007 paper.'
  },
  {
    id: 'gate-cse-2024-2pl-true-statements',
    examId: 'gate-cse',
    year: 2024,
    session: 'Set 2',
    questionType: 'previous_year',
    verification: 'verified',
    prompt: 'Which of the following statements about the Two Phase Locking (2PL) protocol is/are TRUE?',
    options: [
      { id: 'a', text: '2PL permits only serializable schedules' },
      { id: 'b', text: 'With 2PL, a transaction always locks the data item being read or written just before every operation and always releases the lock just after the operation' },
      { id: 'c', text: 'With 2PL, once a lock is released on any data item inside a transaction, no more locks on any data item can be obtained inside that transaction' },
      { id: 'd', text: 'A deadlock is possible with 2PL' }
    ],
    correct: ['a', 'c', 'd'],
    multi: true,
    explanation: 'A is true: 2PL guarantees conflict-serializability. B is false: locking and unlocking immediately around each operation is "immediate locking", which violates the two-phase rule. C is true: it is the shrinking-phase rule. D is true: 2PL does not prevent deadlocks.',
    topic: 'Two-Phase Locking',
    subtopic: 'Guarantees of 2PL',
    difficulty: 'hard',
    points: 20,
    sourceUrl: 'https://gateoverflow.in/422880/gate-cse-2024-set-2-question-17',
    sourceNote: 'GATE CSE 2024 Set 2 — Database Management System, Transactions and Concurrency (multiple-correct). Answer key cross-checked against the GATE Overflow question archive and the ExamSIDE topic archive.'
  },
  {
    id: 'ugc-net-cs-2023-2pl-vs-timestamping',
    examId: 'ugc-net-cs',
    year: 2023,
    session: 'June 2023 — Paper II',
    questionType: 'previous_year',
    verification: 'verified',
    prompt: 'Which of the following concurrency control protocols ensure both conflict serializability and freedom from deadlock?\nStatement I: Two phase locking\nStatement II: Timestamp ordering\nIn the light of the above statements, choose the most appropriate answer from the options given below:',
    options: [
      { id: 'a', text: 'Both statement I and statement II are correct' },
      { id: 'b', text: 'Both statement I and statement II are incorrect' },
      { id: 'c', text: 'Statement I is correct but Statement II is incorrect' },
      { id: 'd', text: 'Statement I is incorrect but Statement II is correct' }
    ],
    correct: ['d'],
    explanation: 'Two-phase locking (statement I) guarantees conflict-serializability but does not guarantee freedom from deadlock, so it is incorrect here. Timestamp ordering (statement II) guarantees both conflict-serializability and deadlock-freedom, so it is correct.',
    topic: 'Concurrency Control',
    subtopic: 'Deadlock freedom',
    difficulty: 'hard',
    points: 20,
    sourceUrl: 'https://solutionsadda.in/2023/11/05/question-17080-nta-ugc-net-june-2023-paper-2/',
    sourceNote: 'NTA UGC NET June 2023 cycle, Computer Science and Applications, Paper II — Transactions and Concurrency. Question text and answer key cross-checked against the published solution key.'
  },
  {
    id: 'ugc-net-cs-2014-pessimistic-vs-optimistic',
    examId: 'ugc-net-cs',
    year: 2014,
    session: 'December 2014 — Paper III',
    questionType: 'previous_year',
    verification: 'verified',
    prompt: 'Which of the following is correct?\nI. Two phase locking is an optimistic protocol.\nII. Two phase locking is pessimistic protocol\nIII. Time stamping is an optimistic protocol.\nIV. Time stamping is pessimistic protocol.',
    options: [
      { id: 'a', text: 'I and III' },
      { id: 'b', text: 'II and IV' },
      { id: 'c', text: 'I and IV' },
      { id: 'd', text: 'II and III' }
    ],
    correct: ['d'],
    explanation: 'Two-phase locking is a pessimistic protocol: transactions lock data before using it, so conflicts are prevented rather than detected afterwards. Timestamp ordering is optimistic: it lets transactions run and validates them at commit time. Hence statements II and III are correct.',
    topic: 'Concurrency Control',
    subtopic: 'Pessimistic vs optimistic concurrency control',
    difficulty: 'medium',
    points: 15,
    sourceUrl: 'https://solutionsadda.in/2023/12/15/question-11887-ugc-net-cs-2014-dec-paper-3/',
    sourceNote: 'UGC NET Computer Science and Applications, December 2014 cycle, Paper III — Transactions. Question text and answer key cross-checked against the published solution key.'
  },

  /* ── Exam-style practice questions (generated, clearly labelled) ── */
  {
    id: 'gate-cse-practice-2pl-properties',
    examId: 'gate-cse',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'Consider the following statements about two-phase locking.\nI. Basic 2PL ensures that no transaction acquires a lock after releasing one.\nII. Strict 2PL ensures that no transaction holds an exclusive lock after it commits.\nIII. Rigorous 2PL ensures that no transaction holds a shared lock after it commits.\nWhich of the above statements are TRUE?',
    options: [
      { id: 'a', text: 'Only I' },
      { id: 'b', text: 'Only I and II' },
      { id: 'c', text: 'Only I and III' },
      { id: 'd', text: 'All three' }
    ],
    correct: ['c'],
    explanation: 'Statement I is the definition of 2PL and is true. Statement II is false: Strict 2PL requires X-locks to be held UNTIL commit — they are released at commit, not afterwards. Statement III is true: Rigorous 2PL keeps every lock, shared ones included, until commit or abort, so no shared lock survives the commit.',
    topic: 'Two-Phase Locking',
    subtopic: '2PL variants',
    difficulty: 'medium',
    points: 15
  },
  {
    id: 'gate-cse-practice-wait-for-graph-cycle',
    examId: 'gate-cse',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'Transactions T1, T2 and T3 are involved in a wait-for graph with the edges T1 → T2, T2 → T3 and T3 → T1. Which statement is correct?',
    options: [
      { id: 'a', text: 'The graph contains a cycle, so a deadlock exists' },
      { id: 'b', text: 'The graph is acyclic, so the transactions can all proceed' },
      { id: 'c', text: 'At least one of the transactions must be using timestamps' },
      { id: 'd', text: 'The transactions are following strict 2PL' }
    ],
    correct: ['a'],
    explanation: 'A cycle in the wait-for graph means each transaction waits for another in a loop, so none of them can proceed: a deadlock exists and one of them must be aborted to release the cycle.',
    topic: 'Deadlock',
    subtopic: 'Wait-for graphs',
    difficulty: 'easy',
    points: 10
  },
  {
    id: 'gate-cse-practice-lock-serializability',
    examId: 'gate-cse',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'Which of the following schedules is conflict-serializable?\nS1: r1(X); r2(X); w1(X); r2(Y); w2(Y);\nS2: r1(X); w2(X); r2(Y); w1(Y);',
    options: [
      { id: 'a', text: 'S1 only' },
      { id: 'b', text: 'S2 only' },
      { id: 'c', text: 'Both S1 and S2' },
      { id: 'd', text: 'Neither S1 nor S2' }
    ],
    correct: ['a'],
    explanation: 'In S1 the only conflicting pair on X is r2(X) before w1(X), which gives the single edge T2 → T1; the reads and writes on Y belong to the same transaction. The precedence graph is therefore acyclic and S1 is conflict-serializable. In S2, r1(X) before w2(X) gives T1 → T2 while r2(Y) before w1(Y) gives T2 → T1, so the graph contains a cycle and S2 is not conflict-serializable.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    difficulty: 'hard',
    points: 20
  },
  {
    id: 'gate-cse-practice-strict-2pl-violation',
    examId: 'gate-cse',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'Under strict 2PL, transaction T1 holds an exclusive lock on A. T1 then executes unlock(A) before committing. What is the correct consequence?',
    options: [
      { id: 'a', text: 'T1 continues normally because only the shrinking phase is affected' },
      { id: 'b', text: 'T1 violates strict 2PL; in this simulator the transaction is aborted and its locks released' },
      { id: 'c', text: 'The lock on A is downgraded to a shared lock' },
      { id: 'd', text: 'T1 must wait until A becomes free again' }
    ],
    correct: ['b'],
    explanation: 'Strict 2PL holds every X-lock until commit or abort, so releasing it early is a protocol violation. The simulator aborts the transaction and releases all the locks it holds.',
    topic: 'Two-Phase Locking',
    subtopic: 'Protocol violations',
    difficulty: 'medium',
    points: 15
  },
  {
    id: 'gate-cse-practice-lock-granularity',
    examId: 'gate-cse',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'Why do real database systems use intention locks (IS, IX, SIX) in addition to S and X locks?',
    options: [
      { id: 'a', text: 'To allow more transactions to hold X-locks on the same item' },
      { id: 'b', text: 'To support multiple-granularity locking without checking every descendant node' },
      { id: 'c', text: 'To replace the need for two-phase locking' },
      { id: 'd', text: 'To make deadlock detection unnecessary' }
    ],
    correct: ['b'],
    explanation: 'Intention locks signal that a node of the lock hierarchy is locked in a stronger mode lower down, so a lock on an ancestor node can be granted without inspecting the whole subtree. They do not replace 2PL and they do not remove the need for deadlock handling.',
    topic: 'Lock Basics',
    subtopic: 'Multiple granularity locking',
    difficulty: 'hard',
    points: 20
  },
  {
    id: 'gate-cse-practice-commit-abort-locks',
    examId: 'gate-cse',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'Which of the following statements about commit and abort is correct?',
    options: [
      { id: 'a', text: 'An abort releases only the shared locks, while a commit releases all locks' },
      { id: 'b', text: 'Both commit and abort release every lock held by the transaction' },
      { id: 'c', text: 'A commit keeps the exclusive locks until the next checkpoint' },
      { id: 'd', text: 'An aborted transaction keeps its locks so that it can be restarted' }
    ],
    correct: ['b'],
    explanation: 'Whether a transaction ends successfully or is rolled back, all of its locks must go — otherwise the items would stay inaccessible and waiting transactions could never proceed.',
    topic: 'Transactions',
    subtopic: 'Commit and abort behaviour',
    difficulty: 'easy',
    points: 10
  },
  {
    id: 'gate-cse-practice-2pl-deadlock-example',
    examId: 'gate-cse',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'T1 holds X(A) and requests X(B); T2 holds X(B) and requests X(A). Which protocol would have prevented this deadlock?',
    options: [
      { id: 'a', text: 'Basic 2PL' },
      { id: 'b', text: 'Strict 2PL' },
      { id: 'c', text: 'Conservative 2PL, if both transactions lock A and B in the same global order' },
      { id: 'd', text: 'No locking protocol can prevent it' }
    ],
    correct: ['c'],
    explanation: 'Basic, strict and rigorous 2PL all allow a deadlock. Conservative 2PL prevents it by requiring all locks to be taken before execution — and, when the items are locked in a common global order, no circular wait can be formed.',
    topic: 'Deadlock',
    subtopic: 'Deadlock prevention',
    difficulty: 'medium',
    points: 15
  },
  {
    id: 'ugc-net-cs-practice-lock-compatibility',
    examId: 'ugc-net-cs',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'Which pair of locks is NOT compatible?',
    options: [
      { id: 'a', text: 'Shared (S) and Shared (S)' },
      { id: 'b', text: 'Shared (S) and Exclusive (X)' },
      { id: 'c', text: 'Exclusive (X) and Exclusive (X)' },
      { id: 'd', text: 'None — all pairs are compatible' }
    ],
    correct: ['b'],
    explanation: 'S/S is compatible. S/X, X/S and X/X all conflict, so an item locked in exclusive mode cannot be accessed by anybody else.',
    topic: 'Lock Basics',
    subtopic: 'Lock compatibility matrix',
    difficulty: 'easy',
    points: 10
  },
  {
    id: 'ugc-net-cs-practice-recoverable-schedule',
    examId: 'ugc-net-cs',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'A transaction T2 reads a value written by T1, and T1 later aborts. What does this tell us about the schedule?',
    options: [
      { id: 'a', text: 'The schedule is recoverable, because T2 can simply be re-executed' },
      { id: 'b', text: 'The schedule is not recoverable; T2 must also be rolled back (cascading rollback)' },
      { id: 'c', text: 'The schedule is conflict-serializable but not recoverable' },
      { id: 'd', text: 'The schedule must contain a deadlock' }
    ],
    correct: ['b'],
    explanation: 'A recoverable schedule never lets a committed transaction depend on the output of a transaction that later aborts. Here T2 read uncommitted data, so T2 has to be rolled back as well — a cascading rollback.',
    topic: 'Transactions',
    subtopic: 'Recoverability',
    difficulty: 'medium',
    points: 15
  },
  {
    id: 'ugc-net-cs-practice-lock-point',
    examId: 'ugc-net-cs',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'Consider a transaction that acquires S(A), then S(B), then X(C) and finally releases S(A) and S(B). At which point does the shrinking phase begin?',
    options: [
      { id: 'a', text: 'When S(A) is acquired' },
      { id: 'b', text: 'When X(C) is acquired' },
      { id: 'c', text: 'When the first lock is released' },
      { id: 'd', text: 'When the transaction commits' }
    ],
    correct: ['c'],
    explanation: 'The shrinking phase starts with the first release. The lock point — the end of the growing phase — is the moment the last lock (X(C)) is acquired.',
    topic: 'Two-Phase Locking',
    subtopic: 'Growing and shrinking phases',
    difficulty: 'medium',
    points: 15
  },
  {
    id: 'ugc-net-cs-practice-isolation-level',
    examId: 'ugc-net-cs',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'Which isolation level is the strongest, and which problem does it eliminate?',
    options: [
      { id: 'a', text: 'Read Committed — eliminates dirty reads only' },
      { id: 'b', text: 'Repeatable Read — eliminates all anomalies' },
      { id: 'c', text: 'Serializable — eliminates every anomaly, behaving as if transactions ran one after another' },
      { id: 'd', text: 'Read Uncommitted — eliminates lost updates' }
    ],
    correct: ['c'],
    explanation: 'Serializable is the strictest isolation level: the schedule behaves exactly as if the transactions had executed one after another, so no anomaly (dirty read, non-repeatable read, phantom or lost update) can occur.',
    topic: 'Concurrency Control',
    subtopic: 'Isolation levels',
    difficulty: 'easy',
    points: 10
  },
  {
    id: 'ugc-net-cs-practice-wait-queue',
    examId: 'ugc-net-cs',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'T1 holds an X-lock on A. T2 and T3 both request an X-lock on A and are queued. When T1 commits, which transaction is granted the lock?',
    options: [
      { id: 'a', text: 'Both T2 and T3, because the item is now free' },
      { id: 'b', text: 'T2, the transaction that has been waiting longest (the queue is served in order)' },
      { id: 'c', text: 'Whichever transaction requests it again first' },
      { id: 'd', text: 'Neither — the lock must be reacquired by T1' }
    ],
    correct: ['b'],
    explanation: 'The wait queue is served in order, so T2 — the head of the queue — is granted the lock. T3 stays queued because T3\'s X-lock request is incompatible with the X-lock T2 now holds.',
    topic: 'Lock Basics',
    subtopic: 'Wait queues',
    difficulty: 'medium',
    points: 15
  },
  {
    id: 'ugc-net-cs-practice-serializable-graph',
    examId: 'ugc-net-cs',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'A schedule is found to be conflict-serializable. What can be concluded about the schedule?',
    options: [
      { id: 'a', text: 'It is also deadlock-free' },
      { id: 'b', text: 'It is equivalent in its effect to some serial schedule of the same transactions' },
      { id: 'c', text: 'It can be produced by strict 2PL' },
      { id: 'd', text: 'It cannot contain a dirty read' }
    ],
    correct: ['b'],
    explanation: 'Conflict-serializability means the schedule has the same effect as running the transactions one after another in some order. It does not imply freedom from deadlock, and conflict-serializable schedules exist that no locking protocol can produce.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    difficulty: 'medium',
    points: 15
  },
  {
    id: 'ugc-net-cs-practice-lock-upgrade',
    examId: 'ugc-net-cs',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'T1 holds an S-lock on A and requests an X-lock on A. T2 holds an S-lock on A. What is the outcome?',
    options: [
      { id: 'a', text: 'T1\'s upgrade is granted because S-locks are compatible' },
      { id: 'b', text: 'T1 waits, and a deadlock occurs once T2 also requests an X-lock on A' },
      { id: 'c', text: 'T1\'s upgrade is granted and T2 is aborted' },
      { id: 'd', text: 'T1 is downgraded to a shared lock automatically' }
    ],
    correct: ['b'],
    explanation: 'The upgrade cannot be granted while T2 holds a conflicting S-lock, so T1 waits. If T2 then also asks for an X-lock on A, the two transactions wait for each other and the wait-for graph contains a cycle — a deadlock.',
    topic: 'Deadlock',
    subtopic: 'Lock upgrade deadlock',
    difficulty: 'medium',
    points: 15
  },
  {
    id: 'ugc-net-cs-practice-basic-2pl-serializability',
    examId: 'ugc-net-cs',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'Which of the following schedules is guaranteed to be conflict-serializable because it follows the 2PL protocol?',
    options: [
      { id: 'a', text: 'A schedule in which every transaction takes all of its locks before releasing any of them' },
      { id: 'b', text: 'A schedule in which a transaction releases a lock and later acquires another one' },
      { id: 'c', text: 'Any schedule in which every transaction commits' },
      { id: 'd', text: 'A schedule in which no two transactions touch the same item' }
    ],
    correct: ['a'],
    explanation: 'Taking all locks before releasing any is exactly the two-phase rule, which guarantees conflict-serializability. Option B breaks the rule, option C is not sufficient (committing does not imply serialisability) and option D is trivially serialisable but is not a 2PL schedule.',
    topic: 'Two-Phase Locking',
    subtopic: 'Guarantees of 2PL',
    difficulty: 'medium',
    points: 15
  },
  {
    id: 'ugc-net-cs-practice-abort-cascade',
    examId: 'ugc-net-cs',
    year: null,
    session: null,
    questionType: 'practice',
    verification: 'unverified',
    prompt: 'Which protocol guarantees that a transaction never reads uncommitted data written by another transaction?',
    options: [
      { id: 'a', text: 'Basic 2PL' },
      { id: 'b', text: 'Strict 2PL' },
      { id: 'c', text: 'Conservative 2PL' },
      { id: 'd', text: 'None of them' }
    ],
    correct: ['b'],
    explanation: 'Strict 2PL holds X-locks until commit or abort, so no other transaction can read an item that has been modified but not yet committed. Basic 2PL may release an X-lock early, and Conservative 2PL guarantees serialisability and deadlock-freedom but does not by itself forbid reading uncommitted data.',
    topic: 'Two-Phase Locking',
    subtopic: 'Strict 2PL',
    difficulty: 'medium',
    points: 15
  }
];

module.exports = { EXAMS, EXAM_QUESTIONS };
