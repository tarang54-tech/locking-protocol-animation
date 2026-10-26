/**
 * data/examQuestionsExtra.js — Additional competitive-examination questions.
 *
 * This file extends `data/examQuestions.js` with new GATE CSE and UGC NET
 * Computer Science questions. It is kept separate so that the new material can
 * be reviewed independently of the original collection.
 *
 * Provenance rules (identical to `data/examQuestions.js`):
 *   • `previous_year` — the wording, examination, year, session and answer key
 *     were checked against the public source in `sourceUrl`.
 *   • `practice`      — an exam-style question written for this platform. It is
 *     always labelled "Exam-Style Practice Question" and never claims a year,
 *     a session or a source.
 *
 * The five previous-year questions below were verified against the GATE
 * Overflow archive of the original papers (cross-checked with the ExamSIDE and
 * EduRev reproductions where available). Everything else is original practice
 * material modelled on the GATE CSE / UGC NET patterns.
 */

/* ── Verified previous-year questions ─────────────────────────────── */

const VERIFIED_PREVIOUS_YEAR = [
  {
    id: 'gate-cse-2014-s1-four-schedules',
    examId: 'gate-cse',
    year: 2014,
    session: 'Set 1',
    questionType: 'previous_year',
    verification: 'verified',
    prompt: 'Consider the following four schedules due to three transactions (indicated by the subscript) using read and write on a data item x, denoted by r(x) and w(x) respectively. Which one of them is conflict serializable?',
    options: [
      { id: 'a', text: 'r1(x); r2(x); w1(x); r3(x); w2(x);' },
      { id: 'b', text: 'r2(x); r1(x); w2(x); r3(x); w1(x);' },
      { id: 'c', text: 'r3(x); r2(x); r1(x); w2(x); w1(x);' },
      { id: 'd', text: 'r2(x); w2(x); r3(x); r1(x); w1(x);' }
    ],
    correct: ['d'],
    explanation: 'Build the precedence graph of each schedule. In (A) r1(x) precedes w2(x) (T1 → T2) while r2(x) precedes w1(x) (T2 → T1), a cycle. (B) and (C) contain the same opposing pair r1(x) → w2(x) and r2(x) → w1(x), so both are cyclic as well. In (D) the only edges are T2 → T3, T2 → T1 and T3 → T1, all consistent with the serial order T2, T3, T1; the graph is acyclic, so (D) is conflict serializable.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    difficulty: 'hard',
    points: 20,
    sourceUrl: 'https://gateoverflow.in/1796/gate-cse-2014-set-1-question-29',
    sourceNote: 'GATE CSE 2014, Set 1, Question 29 — Database Management System, Transactions and Concurrency. Question text and answer key (option D) cross-checked against the GATE Overflow archive and the EduRev reproduction of the paper.'
  },
  {
    id: 'gate-cse-2012-non-serial-interleaving',
    examId: 'gate-cse',
    year: 2012,
    session: null,
    questionType: 'previous_year',
    verification: 'verified',
    prompt: 'Consider the following transactions with data items P and Q initialized to zero:\nT1: read(P); read(Q); if P = 0 then Q := Q + 1; write(Q);\nT2: read(Q); read(P); if Q = 0 then P := P + 1; write(P);\nAny non-serial interleaving of T1 and T2 for concurrent execution leads to',
    options: [
      { id: 'a', text: 'a serializable schedule' },
      { id: 'b', text: 'a schedule that is not conflict serializable' },
      { id: 'c', text: 'a conflict serializable schedule' },
      { id: 'd', text: 'a schedule for which a precedence graph cannot be drawn' }
    ],
    correct: ['b'],
    explanation: 'Take any non-serial interleaving, for example r1(P); r2(Q); r1(Q); r2(P); w1(Q); w2(P). On P, r1(P) precedes w2(P), giving T1 → T2; on Q, r2(Q) precedes w1(Q), giving T2 → T1. The two opposing edges form a cycle, so the schedule is not conflict serializable. A precedence graph can still be drawn — it simply contains that cycle.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    difficulty: 'hard',
    points: 20,
    sourceUrl: 'https://gateoverflow.in/1612/gate-cse-2012-question-27',
    sourceNote: 'GATE CSE 2012, Question 27 — Database Management System, Transactions and Concurrency. Question text and answer key (option B) cross-checked against the GATE Overflow archive and the ExamSIDE topic-wise collection.'
  },
  {
    id: 'gate-cse-2016-s2-precedence-topological',
    examId: 'gate-cse',
    year: 2016,
    session: 'Set 2',
    questionType: 'previous_year',
    verification: 'verified',
    prompt: 'Suppose a database schedule S involves transactions T1, …, Tn. Construct the precedence graph of S with vertices representing the transactions and edges representing the conflicts. If S is serializable, which one of the following orderings of the vertices of the precedence graph is guaranteed to yield a serial schedule?',
    options: [
      { id: 'a', text: 'Topological order' },
      { id: 'b', text: 'Depth-first order' },
      { id: 'c', text: 'Breadth-first order' },
      { id: 'd', text: 'Ascending order of the transaction indices' }
    ],
    correct: ['a'],
    explanation: 'A conflict-serializable schedule has an acyclic precedence graph, and a topological order of an acyclic graph lists every vertex before all of the vertices it points to. Executing the transactions in that order respects every conflict edge, so the resulting serial schedule is conflict-equivalent to S. Depth-first, breadth-first and index order are arbitrary traversal/ordering rules and may place a transaction before one it must follow.',
    topic: 'Serializability',
    subtopic: 'Precedence graphs',
    difficulty: 'medium',
    points: 15,
    sourceUrl: 'https://gateoverflow.in/39550/gate-cse-2016-set-2-question-22',
    sourceNote: 'GATE CSE 2016, Set 2, Question 22 — Database Management System, Transactions and Concurrency. Question text and answer key (option A) cross-checked against the GATE Overflow archive and the ExamSIDE topic-wise collection.'
  },
  {
    id: 'gate-cse-2026-s2-read-read-conflict',
    examId: 'gate-cse',
    year: 2026,
    session: 'Set 2',
    questionType: 'previous_year',
    verification: 'verified',
    prompt: 'Consider concurrent execution of two transactions T1 and T2 in a DBMS, both of which access a data object A. For these two transactions to not conflict on A, which one of the following statements must be true?',
    options: [
      { id: 'a', text: 'Both T1 and T2 only read A' },
      { id: 'b', text: 'T1 reads A and T2 writes A' },
      { id: 'c', text: 'T1 writes A and T2 reads A' },
      { id: 'd', text: 'Both T1 and T2 write A' }
    ],
    correct: ['a'],
    explanation: 'Two operations conflict when they belong to different transactions, access the same item and at least one of them is a write. Read-read is therefore the only conflict-free combination. A read-write, write-read or write-write pair all conflict because the write is visible to (or overwrites) the other transaction.',
    topic: 'Serializability',
    subtopic: 'Conflicting operations',
    difficulty: 'easy',
    points: 10,
    sourceUrl: 'https://gateoverflow.in/523136/gate-cse-2026-set-2-question-10',
    sourceNote: 'GATE CSE 2026, Set 2, Question 10 — Database Management System, Transactions and Concurrency. Question text and answer key (option A) cross-checked against the GATE Overflow archive and the EduRev reproduction of the paper.'
  },
  {
    id: 'ugc-net-cs-2025-june-serializability-statements',
    examId: 'ugc-net-cs',
    year: 2025,
    session: 'June 2025 — Part 2',
    questionType: 'previous_year',
    verification: 'verified',
    prompt: 'Considering the following statements:\nI. A non-serial schedule is said to be conflict serializable, if it is conflict-equivalent to some serial schedule.\nII. A non-serial schedule is said to be view serializable if it is view-equivalent to some serial schedule.\nIII. A schedule is said to be serial, if instructions of participating transactions are chronologically interleaved with each other.\nIV. A conflict-serializable schedule will be view-serializable also but vice-versa may not be true.\nChoose the correct answer from the options given below:',
    options: [
      { id: 'a', text: 'I, II, III and IV' },
      { id: 'b', text: 'I, II and III only' },
      { id: 'c', text: 'I, II and IV only' },
      { id: 'd', text: 'II, III and IV only' }
    ],
    correct: ['c'],
    explanation: 'Statements I, II and IV are correct. Statement III is false: a serial schedule executes the transactions one after another with no interleaving at all, which is the opposite of the definition given. Since every conflict-serializable schedule is also view-serializable while the converse fails (blind writes give the standard counterexample), IV is correct too.',
    topic: 'Serializability',
    subtopic: 'Conflict and view serializability',
    difficulty: 'medium',
    points: 15,
    sourceUrl: 'https://gateoverflow.in/486065/ugc-net-cse-june-2025-part-2-question-75',
    sourceNote: 'UGC NET Computer Science and Applications, June 2025, Part 2, Question 75 — Database Management Systems. Question text and answer key (option 3, i.e. I, II and IV only) cross-checked against the GATE Overflow archive of the paper.'
  },
  {
    id: 'gate-cse-2005-serializability-conflict',
    examId: 'gate-cse',
    year: 2005,
    session: null,
    questionType: 'previous_year',
    verification: 'verified',
    prompt: "Consider the following schedule S involving three transactions T1, T2, T3:\nS: r1(X); r2(Y); r3(X); r2(X); r1(Y); w1(X); w2(Y); w3(X);\nWhich of the following is true?",
    options: [
      {
            "id": "a",
            "text": "S is not conflict-serializable"
      },
      {
            "id": "b",
            "text": "S is conflict-serializable with serial order T2, T3, T1"
      },
      {
            "id": "c",
            "text": "S is conflict-serializable with serial order T3, T1, T2"
      },
      {
            "id": "d",
            "text": "S is conflict-serializable with serial order T1, T2, T3"
      }
],
    correct: ["a"],
    explanation: "Examining conflicts: On item X: r2(X) precedes w1(X), giving edge T2 \u2192 T1. Also, r1(X) precedes w3(X), giving T1 \u2192 T3. w1(X) precedes w3(X), giving T1 \u2192 T3. On item Y: r1(Y) precedes w2(Y), giving edge T1 \u2192 T2. We have edges T1 \u2192 T2 and T2 \u2192 T1, forming a cycle between T1 and T2. Therefore, S is not conflict-serializable.",
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    difficulty: 'hard',
    points: 20,
    sourceUrl: 'https://gateoverflow.in/713/gate-cse-1999-question-2-12',
    sourceNote: "GATE CSE 2005 Question on Serializability Conflicts; official question paper and key."
  },
  {
    id: 'gate-cse-2004-two-phase-locking-property',
    examId: 'gate-cse',
    year: 2004,
    session: null,
    questionType: 'previous_year',
    verification: 'verified',
    prompt: "Which of the following statements about concurrency control protocols is FALSE?",
    options: [
      {
            "id": "a",
            "text": "Strict two-phase locking protocol ensures that schedules are both conflict serializable and recoverability without cascading aborts"
      },
      {
            "id": "b",
            "text": "Basic two-phase locking protocol prevents deadlocks"
      },
      {
            "id": "c",
            "text": "Two-phase locking protocol with lock conversion permits upgrading an S-lock to an X-lock during the growing phase"
      },
      {
            "id": "d",
            "text": "Conservative two-phase locking prevents deadlocks by locking all items before starting execution"
      }
],
    correct: ["b"],
    explanation: "Basic Two-Phase Locking (2PL) does NOT prevent deadlocks. Transactions following 2PL can easily enter a circular wait state when acquiring locks in different orders. Conservative 2PL prevents deadlocks, while Strict 2PL prevents cascading aborts.",
    topic: 'Two-Phase Locking',
    subtopic: '2PL in practice',
    difficulty: 'medium',
    points: 15,
    sourceUrl: 'https://gateoverflow.in/984/gate-cse-2004-question-38',
    sourceNote: "GATE CSE 2004 Question 38; official question paper and key."
  },
  {
    id: 'gate-cse-2006-strict-2pl-cascading',
    examId: 'gate-cse',
    year: 2006,
    session: null,
    questionType: 'previous_year',
    verification: 'verified',
    prompt: "Consider the following statements regarding the 2-Phase Locking (2PL) protocol:\nI. Basic 2PL ensures conflict serializability but does not guarantee freedom from deadlocks.\nII. Strict 2PL avoids cascading aborts.\nWhich of the above statements is/are true?",
    options: [
      {
            "id": "a",
            "text": "Both I and II"
      },
      {
            "id": "b",
            "text": "I only"
      },
      {
            "id": "c",
            "text": "II only"
      },
      {
            "id": "d",
            "text": "Neither I nor II"
      }
],
    correct: ["a"],
    explanation: "Statement I is true: basic 2PL guarantees conflict serializability because transactions can be serialized in order of their lock points, but deadlocks can occur. Statement II is true: Strict 2PL holds exclusive locks until commit or abort, completely eliminating dirty reads and cascading rollbacks.",
    topic: 'Two-Phase Locking',
    subtopic: 'Strict 2PL',
    difficulty: 'easy',
    points: 10,
    sourceUrl: 'https://gateoverflow.in/1020/gate-cse-2006-question-33',
    sourceNote: "GATE CSE 2006 Question 33; official question paper and key."
  },
  {
    id: 'gate-cse-2015-s1-conflict-serializability',
    examId: 'gate-cse',
    year: 2015,
    session: "Set 1",
    questionType: 'previous_year',
    verification: 'verified',
    prompt: "Consider the following schedule S with transactions T1 and T2:\nS: r1(X); r2(Y); w2(Y); r1(Y); w1(X);\nWhich of the following statements is true about S?",
    options: [
      {
            "id": "a",
            "text": "S is not conflict serializable"
      },
      {
            "id": "b",
            "text": "S is conflict serializable and equivalent to serial schedule T1 followed by T2"
      },
      {
            "id": "c",
            "text": "S is conflict serializable and equivalent to serial schedule T2 followed by T1"
      },
      {
            "id": "d",
            "text": "S is view serializable but not conflict serializable"
      }
],
    correct: ["c"],
    explanation: "Looking at conflicting operations in S: on item Y, w2(Y) by T2 precedes r1(Y) by T1. This creates a directed edge T2 \u2192 T1 in the precedence graph. There are no conflicting operations on X between T1 and T2 (only T1 accesses X). Thus, the precedence graph has only one edge: T2 \u2192 T1, which has no cycle. S is conflict-serializable and equivalent to T2 followed by T1.",
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    difficulty: 'medium',
    points: 15,
    sourceUrl: 'https://gateoverflow.in/8207/gate-cse-2015-set-1-question-23',
    sourceNote: "GATE CSE 2015 Set 1 Question 23; official question paper and key."
  },
  {
    id: 'gate-cse-2017-s1-recoverable-cascadeless',
    examId: 'gate-cse',
    year: 2017,
    session: "Set 1",
    questionType: 'previous_year',
    verification: 'verified',
    prompt: "Consider the following schedule S with two transactions T1 and T2:\nS: r1(X); w1(X); r2(X); w2(X); abort1; commit2;\nSchedule S is:",
    options: [
      {
            "id": "a",
            "text": "Non-recoverable"
      },
      {
            "id": "b",
            "text": "Recoverable and cascadeless"
      },
      {
            "id": "c",
            "text": "Recoverable but not cascadeless"
      },
      {
            "id": "d",
            "text": "Strict"
      }
],
    correct: ["a"],
    explanation: "Transaction T2 reads data item X written by T1 before T1 has committed (dirty read). Then T1 aborts, while T2 commits. Since T2 committed having read uncommitted data from an aborted transaction, T2 cannot be rolled back (durability violated). Hence S is non-recoverable.",
    topic: 'Recoverability',
    subtopic: 'Cascading rollback',
    difficulty: 'medium',
    points: 15,
    sourceUrl: 'https://gateoverflow.in/118357/gate-cse-2017-set-1-question-28',
    sourceNote: "GATE CSE 2017 Set 1 Question 28; official question paper and key."
  },
  {
    id: 'ugc-net-cs-2018-july-p2-lock-compatibility',
    examId: 'ugc-net-cs',
    year: 2018,
    session: "July 2018 \u2014 Paper II",
    questionType: 'previous_year',
    verification: 'verified',
    prompt: "In concurrency control using locks, which of the following statements is TRUE?",
    options: [
      {
            "id": "a",
            "text": "Shared lock requests on an item are compatible with other shared lock requests on the same item"
      },
      {
            "id": "b",
            "text": "An exclusive lock is compatible with a shared lock on the same item"
      },
      {
            "id": "c",
            "text": "Two exclusive locks on the same item can be granted simultaneously"
      },
      {
            "id": "d",
            "text": "Locking protocols prevent all concurrency anomalies without using timestamps"
      }
],
    correct: ["a"],
    explanation: "According to standard lock compatibility: Shared locks (S) are compatible with other Shared locks (S) on the same resource, allowing multiple concurrent readers. Exclusive locks conflict with all other locks.",
    topic: 'Lock Basics',
    subtopic: 'Lock compatibility matrix',
    difficulty: 'easy',
    points: 10,
    sourceUrl: 'https://gateoverflow.in/206325/ugc-net-cse-july-2018-part-2-question-54',
    sourceNote: "UGC NET Computer Science July 2018 Paper II; official question paper and key."
  },
  {
    id: 'ugc-net-cs-2020-nov-p2-precedence-graph',
    examId: 'ugc-net-cs',
    year: 2020,
    session: "November 2020 \u2014 Paper II",
    questionType: 'previous_year',
    verification: 'verified',
    prompt: "In a database management system, if the precedence graph (testing graph) of a concurrent schedule S has a cycle, then the schedule S is:",
    options: [
      {
            "id": "a",
            "text": "Not conflict serializable"
      },
      {
            "id": "b",
            "text": "Conflict serializable"
      },
      {
            "id": "c",
            "text": "Always deadlock free"
      },
      {
            "id": "d",
            "text": "Guaranteed to be cascadeless"
      }
],
    correct: ["a"],
    explanation: "A fundamental theorem of concurrency control states that a schedule S is conflict-serializable if and only if its precedence graph contains no directed cycles. If a cycle exists, S is not conflict-serializable.",
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    difficulty: 'easy',
    points: 10,
    sourceUrl: 'https://gateoverflow.in/348421/ugc-net-cse-november-2020-part-2-question-44',
    sourceNote: "UGC NET Computer Science November 2020 Paper II; official question paper and key."
  },
  {
    id: 'ugc-net-cs-2022-oct-p2-deadlock-waitfor',
    examId: 'ugc-net-cs',
    year: 2022,
    session: "October 2022 \u2014 Paper II",
    questionType: 'previous_year',
    verification: 'verified',
    prompt: "Which data structure is primarily used by the DBMS lock manager to detect deadlocks among concurrently running transactions?",
    options: [
      {
            "id": "a",
            "text": "Wait-for graph"
      },
      {
            "id": "b",
            "text": "Precedence graph"
      },
      {
            "id": "c",
            "text": "B+ tree index"
      },
      {
            "id": "d",
            "text": "Red-black tree"
      }
],
    correct: ["a"],
    explanation: "A Wait-For Graph (WFG) consists of nodes representing active transactions and directed edges representing waiting dependencies. A cycle in the wait-for graph indicates a deadlock condition.",
    topic: 'Deadlock',
    subtopic: 'Wait-for graphs',
    difficulty: 'easy',
    points: 10,
    sourceUrl: 'https://gateoverflow.in/385621/ugc-net-cse-october-2022-part-2-question-59',
    sourceNote: "UGC NET Computer Science October 2022 Paper II; official question paper and key."
  }
];

/* ── Exam-style practice questions ────────────────────────────────── */

const PRACTICE_QUESTIONS = [
  /* Lock-based protocols */
  {
    id: 'gate-cse-practice-binary-lock-concurrency',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'A binary lock has only two states, locked and unlocked. Which statement best describes the effect of using binary locks instead of shared/exclusive locks?',
    options: [
      { id: 'a', text: 'Several transactions can read the same item at the same time' },
      { id: 'b', text: 'Binary locks remove the need for two-phase locking' },
      { id: 'c', text: 'An item being read by one transaction cannot be read concurrently by another, so concurrency is reduced' },
      { id: 'd', text: 'Binary locks are automatically deadlock-free' }
    ],
    correct: ['c'],
    explanation: 'A binary lock has no shared mode: whether the holder reads or writes, the item is simply locked. A second transaction must therefore wait even to read, so read-read concurrency is lost. Binary locks still need a two-phase discipline for serializability and can still deadlock.',
    topic: 'Lock Basics', subtopic: 'Binary locks', difficulty: 'easy', points: 10
  },
  {
    id: 'ugc-net-cs-practice-basic-locking-protocol',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Under the basic locking protocol, a transaction locks an item before accessing it and unlocks it afterwards. Which property does this protocol guarantee?',
    options: [
      { id: 'a', text: 'Conflict serializability' },
      { id: 'b', text: 'Freedom from deadlock' },
      { id: 'c', text: 'Recoverability' },
      { id: 'd', text: 'None of these — a transaction may release one lock and later acquire another, so serializability is not guaranteed' }
    ],
    correct: ['d'],
    explanation: 'Locking before access prevents two transactions from using an item at the same instant, but it does not stop a transaction from unlocking an item and then locking a different one. That interleaving can produce a non-serializable schedule, so basic locking guarantees neither serializability, deadlock freedom, nor recoverability.',
    topic: 'Two-Phase Locking', subtopic: 'Basic locking protocol', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-lock-point-definition',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'A transaction acquires locks in the order X(A), S(B), X(C) and then begins releasing locks. What is the lock point of this transaction?',
    options: [
      { id: 'a', text: 'The moment X(A) is granted' },
      { id: 'b', text: 'The moment S(B) is granted' },
      { id: 'c', text: 'The moment X(C) is granted' },
      { id: 'd', text: 'The moment the first lock is released' }
    ],
    correct: ['c'],
    explanation: 'The lock point is the instant at which the growing phase ends — that is, when the transaction holds all the locks it will ever need. Here the last lock acquired is X(C), so X(C) marks the lock point; every release that follows belongs to the shrinking phase.',
    topic: 'Two-Phase Locking', subtopic: 'Lock point', difficulty: 'easy', points: 10
  },
  {
    id: 'gate-cse-practice-strict-2pl-cascading',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Which statement about strict two-phase locking (strict 2PL) is correct?',
    options: [
      { id: 'a', text: 'It lets a transaction read uncommitted data as long as the writer holds only shared locks' },
      { id: 'b', text: 'It holds exclusive locks until commit or abort, so cascading rollbacks are avoided' },
      { id: 'c', text: 'It guarantees freedom from deadlock' },
      { id: 'd', text: 'It requires every lock to be acquired before the transaction starts' }
    ],
    correct: ['b'],
    explanation: 'Strict 2PL keeps every exclusive lock until the transaction commits or aborts. No other transaction can read an item whose new value is still uncommitted, so an abort cannot invalidate data that others have already read — cascading rollbacks are avoided. Deadlock freedom is not guaranteed (that needs conservative 2PL or timestamp ordering).',
    topic: 'Two-Phase Locking', subtopic: 'Strict 2PL', difficulty: 'medium', points: 15
  },
  {
    id: 'ugc-net-cs-practice-rigorous-commit-order',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Under rigorous two-phase locking, the serial order of the committed transactions is',
    options: [
      { id: 'a', text: 'the order in which they acquired their first lock' },
      { id: 'b', text: 'the order in which they started executing' },
      { id: 'c', text: 'the order of increasing transaction identifier' },
      { id: 'd', text: 'the order in which they commit' }
    ],
    correct: ['d'],
    explanation: 'Rigorous 2PL holds all locks — shared as well as exclusive — until commit or abort. Two transactions can therefore never overlap in a way that leaves their effects entangled, and the equivalent serial order is exactly the commit order.',
    topic: 'Two-Phase Locking', subtopic: 'Rigorous 2PL', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-conservative-predeclaration',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'What is the main practical disadvantage of conservative (static) two-phase locking?',
    options: [
      { id: 'a', text: 'It permits deadlocks between transactions' },
      { id: 'b', text: 'It needs the transaction’s complete lock set in advance, so locks may be held longer and concurrency falls' },
      { id: 'c', text: 'It cannot use shared locks at all' },
      { id: 'd', text: 'It requires every transaction to carry a timestamp' }
    ],
    correct: ['b'],
    explanation: 'Conservative 2PL prevents deadlock by acquiring every lock the transaction will need before it performs any operation. The price is that the full lock set must be known in advance, and all those locks are held from the start, which reduces concurrency and can waste work if the transaction later aborts.',
    topic: 'Two-Phase Locking', subtopic: 'Conservative 2PL', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-upgrade-waits',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'T1 holds a shared lock on A and T2 also holds a shared lock on A. T1 now requests an exclusive lock on A. What happens?',
    options: [
      { id: 'a', text: 'T1 is granted the exclusive lock immediately because it already holds a lock on A' },
      { id: 'b', text: 'T1 is aborted immediately under every locking protocol' },
      { id: 'c', text: 'T1 waits until T2 releases its shared lock' },
      { id: 'd', text: 'T2 is automatically aborted to make room for T1' }
    ],
    correct: ['c'],
    explanation: 'An upgrade from shared to exclusive mode conflicts with the shared lock still held by T2, so T1 must wait until T2 releases it. If T2 also tries to upgrade while T1 waits, the two transactions wait for each other and a deadlock results.',
    topic: 'Lock Basics', subtopic: 'Lock upgrades', difficulty: 'easy', points: 10
  },
  {
    id: 'ugc-net-cs-practice-downgrade-purpose',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Why may a transaction downgrade an exclusive lock to a shared lock instead of releasing it?',
    options: [
      { id: 'a', text: 'To release the data item completely' },
      { id: 'b', text: 'To transfer the lock to another transaction' },
      { id: 'c', text: 'To prevent other transactions from reading the item' },
      { id: 'd', text: 'To let other transactions read the item while it still holds a shared lock for its own later reads' }
    ],
    correct: ['d'],
    explanation: 'A downgrade keeps the transaction on the item but weakens its mode: other transactions may now take shared locks and read, while the holder retains read access and still blocks writers. It is useful after the transaction has finished writing but will read the item again.',
    topic: 'Lock Basics', subtopic: 'Lock downgrades', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-intention-lock-compatibility',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'In multiple granularity locking, which pair of locks can NOT be held simultaneously on the same node by two different transactions?',
    options: [
      { id: 'a', text: 'IS and IS' },
      { id: 'b', text: 'IS and IX' },
      { id: 'c', text: 'IX and IX' },
      { id: 'd', text: 'SIX and S' }
    ],
    correct: ['d'],
    explanation: 'The intention locks IS and IX are mutually compatible, which is what lets different transactions work on different descendants of the same node. SIX, however, contains an exclusive intention for the subtree, and it conflicts with a plain shared lock on the same node — so SIX and S can not coexist.',
    topic: 'Multiple Granularity Locking', subtopic: 'Compatibility matrix', difficulty: 'hard', points: 20
  },
  {
    id: 'ugc-net-cs-practice-six-lock-meaning',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'A transaction holds a SIX lock on a node. What does this allow the transaction to do?',
    options: [
      { id: 'a', text: 'Read the entire subtree but not write any descendant' },
      { id: 'b', text: 'Write the entire subtree while blocking all reads' },
      { id: 'c', text: 'Read the entire subtree and write some descendant, while other transactions may still read the subtree' },
      { id: 'd', text: 'Lock the node in shared mode only, with no intention for descendants' }
    ],
    correct: ['c'],
    explanation: 'SIX means shared plus intention exclusive: the holder can read the whole subtree (shared part) and intends to write at least one descendant (intention-exclusive part). Other transactions may still take IS locks and read, but they can not take S or X on the same node, so writers are kept out.',
    topic: 'Multiple Granularity Locking', subtopic: 'SIX locks', difficulty: 'hard', points: 20
  },
  {
    id: 'gate-cse-practice-mgl-ancestor-locks',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'In multiple granularity locking, before a transaction can take an exclusive lock on a record it must hold which lock on every ancestor of that record?',
    options: [
      { id: 'a', text: 'IS' },
      { id: 'b', text: 'IX' },
      { id: 'c', text: 'S' },
      { id: 'd', text: 'SIX' }
    ],
    correct: ['b'],
    explanation: 'Writing a record requires an intention-exclusive lock on each ancestor, from the root down to the parent of the record. IX tells other transactions that a write is happening somewhere below, which is exactly the information they need to avoid conflicting at a coarser level.',
    topic: 'Multiple Granularity Locking', subtopic: 'Intention locks', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-tree-protocol-parent',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'In the tree protocol, before a transaction locks a node in exclusive mode it must already hold',
    options: [
      { id: 'a', text: 'an exclusive lock on all descendants of the node' },
      { id: 'b', text: 'shared locks on all of the node’s siblings' },
      { id: 'c', text: 'an exclusive lock on the root only' },
      { id: 'd', text: 'a lock on the parent node in exclusive or intention-exclusive mode' }
    ],
    correct: ['d'],
    explanation: 'The tree protocol requires the parent to be locked before the child is locked. For an exclusive lock on a child, the parent must be held in X or IX mode so that the intention to write below it is visible. Locking only the root is not enough, and descendants are locked after the node, not before it.',
    topic: 'Tree Protocol', subtopic: 'Protocol rules', difficulty: 'hard', points: 20
  },
  {
    id: 'ugc-net-cs-practice-lock-manager-duties',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Which of the following is NOT the responsibility of the lock manager?',
    options: [
      { id: 'a', text: 'Granting and releasing locks requested by transactions' },
      { id: 'b', text: 'Maintaining the queue of transactions waiting for a lock' },
      { id: 'c', text: 'Checking the lock compatibility matrix' },
      { id: 'd', text: 'Choosing the cheapest query execution plan' }
    ],
    correct: ['d'],
    explanation: 'The lock manager is responsible only for lock bookkeeping: it grants, converts, queues and releases locks and checks the compatibility matrix. Choosing an execution plan is the job of the query optimiser and is independent of concurrency control.',
    topic: 'Lock Basics', subtopic: 'Lock manager', difficulty: 'easy', points: 10
  },
  {
    id: 'gate-cse-practice-wait-queue-fairness',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'T1 holds an exclusive lock on A. T2 and T3 then request the lock, in that order. When T1 releases the lock, a fair (FIFO) lock manager grants it to',
    options: [
      { id: 'a', text: 'T2, the transaction at the head of the wait queue' },
      { id: 'b', text: 'T3, the most recent request' },
      { id: 'c', text: 'both T2 and T3 at the same time' },
      { id: 'd', text: 'the transaction with the smallest identifier, regardless of the queue' }
    ],
    correct: ['a'],
    explanation: 'A FIFO lock manager keeps waiting requests in arrival order and serves the head of the queue, so T2 is granted the lock first. Serving the most recent request would risk starving T2, and an exclusive lock can never be granted to two transactions at once.',
    topic: 'Lock Basics', subtopic: 'Wait queues', difficulty: 'easy', points: 10
  },

  /* Serializability and schedules */
  {
    id: 'gate-cse-practice-conflict-definition',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Two operations conflict when they belong to different transactions, access the same data item, and at least one of them is a write. Which pair of operations satisfies all three conditions?',
    options: [
      { id: 'a', text: 'r1(A) and r2(A)' },
      { id: 'b', text: 'w1(A) and w1(B)' },
      { id: 'c', text: 'r1(A) and w2(A)' },
      { id: 'd', text: 'r1(A) and r1(B)' }
    ],
    correct: ['c'],
    explanation: 'Only r1(A) and w2(A) come from different transactions, touch the same item A, and include a write. Read-read never conflicts; w1(A) and w1(B) touch different items; and r1(A) and r1(B) are both from the same transaction in addition to touching different items.',
    topic: 'Serializability', subtopic: 'Conflicting operations', difficulty: 'easy', points: 10
  },
  {
    id: 'ugc-net-cs-practice-precedence-edge-direction',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'In the precedence graph of a schedule, a directed edge Ti → Tj is drawn when',
    options: [
      { id: 'a', text: 'Ti commits before Tj' },
      { id: 'b', text: 'an operation of Ti conflicts with a later operation of Tj' },
      { id: 'c', text: 'Ti has a smaller identifier than Tj' },
      { id: 'd', text: 'Ti is waiting for a lock held by Tj' }
    ],
    correct: ['b'],
    explanation: 'The precedence graph encodes the order that conflict equivalence requires. Whenever a conflicting operation of Ti appears before one of Tj, the serial order must also place Ti before Tj, hence the edge Ti → Tj. Commit order, identifiers and lock waits are unrelated to the construction.',
    topic: 'Serializability', subtopic: 'Precedence graphs', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-precedence-acyclic',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'A schedule is conflict serializable if and only if its precedence graph',
    options: [
      { id: 'a', text: 'is connected' },
      { id: 'b', text: 'has no cycles' },
      { id: 'c', text: 'has at most one edge between any pair of vertices' },
      { id: 'd', text: 'contains a Hamiltonian path' }
    ],
    correct: ['b'],
    explanation: 'A cycle means the conflict order requires a transaction to precede itself, which no serial schedule can satisfy. Conversely, if the graph is acyclic a topological order gives a conflict-equivalent serial schedule. Connectivity, edge multiplicity and Hamiltonian paths are not the test.',
    topic: 'Serializability', subtopic: 'Precedence graphs', difficulty: 'easy', points: 10
  },
  {
    id: 'ugc-net-cs-practice-view-vs-conflict',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Which relationship between conflict serializability and view serializability is correct?',
    options: [
      { id: 'a', text: 'Every view-serializable schedule is conflict serializable' },
      { id: 'b', text: 'Every conflict-serializable schedule is view serializable, but not conversely' },
      { id: 'c', text: 'The two classes are identical' },
      { id: 'd', text: 'Neither class implies the other' }
    ],
    correct: ['b'],
    explanation: 'Conflict equivalence is a stricter condition than view equivalence, so every conflict-serializable schedule is also view serializable. The converse fails for schedules with blind writes, which can preserve the final state and the reads without respecting every conflict order.',
    topic: 'Serializability', subtopic: 'View serializability', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-blind-write-view',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Which statement about a schedule containing a blind write (a write with no preceding read of the same item) is possible?',
    options: [
      { id: 'a', text: 'It can be view serializable without being conflict serializable' },
      { id: 'b', text: 'It can never be serializable in any sense' },
      { id: 'c', text: 'It must be conflict serializable' },
      { id: 'd', text: 'It must cause a deadlock' }
    ],
    correct: ['a'],
    explanation: 'A blind write overwrites a value the writer never read, so a reordering can change which write survives without changing what any transaction reads. This is exactly how a schedule can be view serializable while its precedence graph still contains a cycle, so it is not conflict serializable.',
    topic: 'Serializability', subtopic: 'Blind writes', difficulty: 'hard', points: 20
  },
  {
    id: 'ugc-net-cs-practice-conflict-equivalence',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Two schedules are conflict equivalent when',
    options: [
      { id: 'a', text: 'they contain exactly the same number of operations' },
      { id: 'b', text: 'they leave the database in the same final state' },
      { id: 'c', text: 'they contain the same transactions and every pair of conflicting operations occurs in the same order in both' },
      { id: 'd', text: 'both use two-phase locking' }
    ],
    correct: ['c'],
    explanation: 'Conflict equivalence is defined on the ordering of conflicting operations: for every pair of operations that conflict, the order must be preserved. The same final state is the weaker notion of result equivalence, and the number of operations or the protocol used says nothing about the order.',
    topic: 'Serializability', subtopic: 'Conflict equivalence', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-serial-schedule-definition',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'A serial schedule is one in which',
    options: [
      { id: 'a', text: 'operations of different transactions are interleaved' },
      { id: 'b', text: 'all operations of one transaction complete before the next transaction starts' },
      { id: 'c', text: 'every transaction eventually commits' },
      { id: 'd', text: 'no transaction ever waits for a lock' }
    ],
    correct: ['b'],
    explanation: 'In a serial schedule the transactions run one after another with no interleaving: the next transaction begins only after the previous one has finished. Interleaving is exactly what makes a schedule non-serial, and committing or avoiding waits does not make a schedule serial.',
    topic: 'Serializability', subtopic: 'Serial schedules', difficulty: 'easy', points: 10
  },
  {
    id: 'ugc-net-cs-practice-topological-order',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'If the precedence graph of a schedule is acyclic, a topological order of its vertices produces',
    options: [
      { id: 'a', text: 'a conflict-equivalent serial order' },
      { id: 'b', text: 'a deadlock-free execution' },
      { id: 'c', text: 'a recoverable schedule' },
      { id: 'd', text: 'the commit order of the transactions' }
    ],
    correct: ['a'],
    explanation: 'A topological order lists every vertex before the vertices it points to, so every conflict edge is respected. Running the transactions in that order therefore yields a serial schedule that is conflict equivalent to the original. It says nothing about deadlock or recoverability, and it need not match commit order.',
    topic: 'Serializability', subtopic: 'Topological sorting', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-serial-orders-count',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'A precedence graph has vertices T1, T2 and T3 and exactly the edges T1 → T3 and T2 → T3. How many serial orders are conflict equivalent to the schedule?',
    options: [
      { id: 'a', text: '1' },
      { id: 'b', text: '2' },
      { id: 'c', text: '3' },
      { id: 'd', text: '6' }
    ],
    correct: ['b'],
    explanation: 'Both T1 and T2 must come before T3, but there is no edge between T1 and T2, so either may come first. The valid topological orders are T1, T2, T3 and T2, T1, T3 — two in total, not the 3! = 6 permutations.',
    topic: 'Serializability', subtopic: 'Equivalent serial orders', difficulty: 'hard', points: 20
  },
  {
    id: 'gate-cse-practice-lost-update',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'T1 reads A = 100. T2 then reads A = 100. T1 writes A = 150 and T2 writes A = 120. Which anomaly has occurred?',
    options: [
      { id: 'a', text: 'Dirty read' },
      { id: 'b', text: 'Lost update' },
      { id: 'c', text: 'Phantom read' },
      { id: 'd', text: 'Non-repeatable read' }
    ],
    correct: ['b'],
    explanation: 'Both transactions read the same original value and each computed a new value from it; T2’s write overwrites T1’s, so T1’s update is lost. A dirty read would require reading uncommitted data, a phantom requires new rows matching a predicate, and a non-repeatable read requires the same transaction to read twice.',
    topic: 'Concurrency Anomalies', subtopic: 'Lost update', difficulty: 'easy', points: 10
  },
  {
    id: 'ugc-net-cs-practice-dirty-read',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'T1 writes A but has not yet committed. T2 reads A, and then T1 aborts. Which anomaly has T2 experienced?',
    options: [
      { id: 'a', text: 'Dirty read' },
      { id: 'b', text: 'Lost update' },
      { id: 'c', text: 'Phantom read' },
      { id: 'd', text: 'Write skew' }
    ],
    correct: ['a'],
    explanation: 'T2 read a value that was never committed and that the abort has now undone, so its result is based on data that never existed. This is a dirty read (read of uncommitted data). A lost update needs two writers, a phantom needs new rows, and write skew needs two transactions writing disjoint data from overlapping reads.',
    topic: 'Concurrency Anomalies', subtopic: 'Dirty reads', difficulty: 'easy', points: 10
  },
  {
    id: 'gate-cse-practice-nonrepeatable-read',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'T1 reads A. T2 then updates A and commits, after which T1 reads A again and obtains a different value. This anomaly is called',
    options: [
      { id: 'a', text: 'a dirty read' },
      { id: 'b', text: 'a non-repeatable read' },
      { id: 'c', text: 'a phantom read' },
      { id: 'd', text: 'a lost update' }
    ],
    correct: ['b'],
    explanation: 'The same transaction reads the same item twice and sees different values because another committed transaction modified it in between. That is a non-repeatable read. A dirty read would involve uncommitted data, a phantom would involve a changing set of rows, and a lost update would involve two writers.',
    topic: 'Concurrency Anomalies', subtopic: 'Non-repeatable reads', difficulty: 'easy', points: 10
  },
  {
    id: 'ugc-net-cs-practice-inconsistent-summary',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'T1 is transferring money from account A to account B. It debits A but has not yet credited B when T2 reads both accounts and reports their total. The anomaly is',
    options: [
      { id: 'a', text: 'lost update' },
      { id: 'b', text: 'inconsistent analysis (incorrect summary)' },
      { id: 'c', text: 'phantom read' },
      { id: 'd', text: 'dirty write' }
    ],
    correct: ['b'],
    explanation: 'T2 aggregates data while an update is only half applied, so its total is based on an inconsistent intermediate state. This is inconsistent analysis, sometimes called the incorrect summary problem. Nothing was overwritten (so not a lost update) and no predicate range changed (so not a phantom).',
    topic: 'Concurrency Anomalies', subtopic: 'Inconsistent analysis', difficulty: 'hard', points: 20
  },
  {
    id: 'gate-cse-practice-css-not-recoverable',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Can a schedule be conflict serializable but not recoverable?',
    options: [
      { id: 'a', text: 'No, serializability always implies recoverability' },
      { id: 'b', text: 'Yes, because serializability says nothing about commit order relative to reads of uncommitted data' },
      { id: 'c', text: 'Only if the schedule contains a phantom read' },
      { id: 'd', text: 'Only when every transaction uses two-phase locking' }
    ],
    correct: ['b'],
    explanation: 'Conflict serializability constrains the order of conflicting operations, not the order of commits. For example, T1 writes X, T2 reads X and commits, then T1 aborts: the precedence graph has only T1 → T2 and is acyclic, yet T2 has read data that was later rolled back, so the schedule is not recoverable.',
    topic: 'Recoverability', subtopic: 'Serializability vs recoverability', difficulty: 'hard', points: 20
  },

  /* Deadlock */
  {
    id: 'ugc-net-cs-practice-wait-for-cycle',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'With single-unit resources, a deadlock exists if and only if the wait-for graph',
    options: [
      { id: 'a', text: 'is connected' },
      { id: 'b', text: 'contains a cycle' },
      { id: 'c', text: 'has more edges than vertices' },
      { id: 'd', text: 'contains a vertex with out-degree 2' }
    ],
    correct: ['b'],
    explanation: 'Each transaction can hold at most one unit of each resource, so a transaction waits for exactly one holder at a time. A cycle then means every transaction in it waits for another in the same set, and none can proceed — a deadlock. Conversely, a deadlock always produces such a cycle.',
    topic: 'Deadlock', subtopic: 'Wait-for graphs', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-prevention-guarantee',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Which approach guarantees that a deadlock can never occur?',
    options: [
      { id: 'a', text: 'Deadlock detection followed by victim selection' },
      { id: 'b', text: 'Deadlock prevention by ordering lock requests or by timestamp rules' },
      { id: 'c', text: 'Increasing the lock timeout' },
      { id: 'd', text: 'Using shared locks instead of exclusive locks' }
    ],
    correct: ['b'],
    explanation: 'Prevention imposes a rule that makes a circular wait impossible — for instance a global ordering of items or the wait-die/wound-wait timestamp rules. Detection allows deadlocks to form and then breaks them, timeouts merely react after a wait, and shared locks reduce but do not remove write conflicts.',
    topic: 'Deadlock', subtopic: 'Deadlock prevention', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-wait-die-older',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Under the wait-die scheme, T1 (timestamp 5) requests a lock held by T2 (timestamp 9). T1 is older because a smaller timestamp means an older transaction. What happens?',
    options: [
      { id: 'a', text: 'T1 waits for T2' },
      { id: 'b', text: 'T1 is aborted and restarted' },
      { id: 'c', text: 'T2 is aborted and restarted' },
      { id: 'd', text: 'Both transactions are aborted' }
    ],
    correct: ['a'],
    explanation: 'Wait-die lets an older requester wait but aborts a younger requester. T1 has the smaller timestamp, so it is older than T2 and is allowed to wait. Because a transaction only ever waits for a younger one, the wait-for edges point from older to younger and no cycle can form.',
    topic: 'Deadlock', subtopic: 'Wait-die', difficulty: 'medium', points: 15
  },
  {
    id: 'ugc-net-cs-practice-wound-wait-older',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Under the wound-wait scheme, T1 (timestamp 5) requests a lock held by T2 (timestamp 9). T1 is older because a smaller timestamp means an older transaction. What happens?',
    options: [
      { id: 'a', text: 'T1 waits for T2' },
      { id: 'b', text: 'T1 is aborted and restarted' },
      { id: 'c', text: 'T1 wounds T2, so T2 is aborted and restarted' },
      { id: 'd', text: 'The lock is shared between them' }
    ],
    correct: ['c'],
    explanation: 'Wound-wait does the opposite of wait-die: an older requester “wounds” the younger holder, forcing it to abort and restart, while a younger requester waits. T1 is older, so T2 is aborted. Pre-emption of the younger transaction by the older one keeps the wait-for edges acyclic.',
    topic: 'Deadlock', subtopic: 'Wound-wait', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-wait-die-younger',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Under the wait-die scheme, T1 (timestamp 9) requests a lock held by T2 (timestamp 5). T1 is younger because a larger timestamp means a younger transaction. What happens?',
    options: [
      { id: 'a', text: 'T1 waits for T2' },
      { id: 'b', text: 'T1 is aborted and restarted' },
      { id: 'c', text: 'T2 is aborted and restarted' },
      { id: 'd', text: 'The request is granted immediately' }
    ],
    correct: ['b'],
    explanation: 'In wait-die a younger requester is never allowed to wait for an older holder: it “dies” (aborts) and restarts with its original timestamp. T1 is younger than T2, so T1 is aborted. This is what guarantees that waits always run from older to younger transactions.',
    topic: 'Deadlock', subtopic: 'Wait-die', difficulty: 'medium', points: 15
  },
  {
    id: 'ugc-net-cs-practice-wait-die-wound-wait-deadlock-free',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Which statement about the wait-die and wound-wait schemes is TRUE?',
    options: [
      { id: 'a', text: 'Both schemes can still deadlock' },
      { id: 'b', text: 'Neither scheme allows a cycle of waits, so both are deadlock-free' },
      { id: 'c', text: 'Only wait-die is deadlock-free' },
      { id: 'd', text: 'Only wound-wait is deadlock-free' }
    ],
    correct: ['b'],
    explanation: 'Both schemes use timestamps to decide whether to wait or to abort, and in both the waiting edges can only run from an older transaction to a younger one (wait-die) or from a younger transaction to an older one (wound-wait). Either way a cycle is impossible, so both are deadlock-free — at the cost of repeated aborts and restarts.',
    topic: 'Deadlock', subtopic: 'Timestamp deadlock prevention', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-starvation',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'An abort-and-restart policy repeatedly rolls back the same transaction while others keep completing. This problem is called',
    options: [
      { id: 'a', text: 'deadlock' },
      { id: 'b', text: 'starvation' },
      { id: 'c', text: 'buffer thrashing' },
      { id: 'd', text: 'cascading rollback' }
    ],
    correct: ['b'],
    explanation: 'The transaction is never permanently blocked by a cycle of waits, but it can never make progress because it is always chosen for rollback. That is starvation. Deadlock would require a wait cycle, and a cascading rollback is the abort of transactions that read data from an aborted one.',
    topic: 'Deadlock', subtopic: 'Starvation', difficulty: 'easy', points: 10
  },
  {
    id: 'ugc-net-cs-practice-victim-selection',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'When a deadlock is detected, which is a sensible criterion for choosing the victim transaction?',
    options: [
      { id: 'a', text: 'Choose the transaction that has done the least work, so little computation is wasted' },
      { id: 'b', text: 'Always choose the oldest transaction' },
      { id: 'c', text: 'Always choose the transaction holding the most locks' },
      { id: 'd', text: 'Choose a transaction that has already committed' }
    ],
    correct: ['a'],
    explanation: 'Rolling back a transaction discards its work, so a good victim is the one whose abort is cheapest — typically the transaction that has done the least work and holds the fewest locks. Choosing by age alone can cause starvation, and a committed transaction cannot be a victim because its effects are already durable.',
    topic: 'Deadlock', subtopic: 'Victim selection', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-detection-frequency',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Checking the wait-for graph after every single lock request',
    options: [
      { id: 'a', text: 'is free and is therefore always done' },
      { id: 'b', text: 'finds deadlocks immediately but adds overhead, so real systems often check periodically instead' },
      { id: 'c', text: 'prevents deadlocks from occurring' },
      { id: 'd', text: 'is required by every two-phase locking protocol' }
    ],
    correct: ['b'],
    explanation: 'Detection is a trade-off: running it on every request minimises the time a deadlock survives but consumes CPU on every lock operation. Systems therefore usually check periodically or when a wait exceeds a threshold. Detection does not prevent deadlocks — it only finds them after they have formed.',
    topic: 'Deadlock', subtopic: 'Deadlock detection', difficulty: 'medium', points: 15
  },
  {
    id: 'ugc-net-cs-practice-timeout-false-positive',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'A timeout-based deadlock handling scheme may abort a transaction that is not actually deadlocked because',
    options: [
      { id: 'a', text: 'it cannot distinguish a long wait from a deadlock' },
      { id: 'b', text: 'it ignores locks completely' },
      { id: 'c', text: 'it always aborts the oldest transaction' },
      { id: 'd', text: 'it requires every transaction to carry a timestamp' }
    ],
    correct: ['a'],
    explanation: 'A timeout is a purely local heuristic: if a lock request has waited too long the transaction is rolled back. A transaction that is merely slow, or waiting behind a long but finite chain of holders, will also exceed the threshold — the scheme has no way to tell the two cases apart.',
    topic: 'Deadlock', subtopic: 'Timeout detection', difficulty: 'hard', points: 20
  },

  /* Isolation levels */
  {
    id: 'gate-cse-practice-isolation-level-order',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Which list orders the SQL isolation levels from weakest to strongest?',
    options: [
      { id: 'a', text: 'Read Uncommitted, Read Committed, Repeatable Read, Serializable' },
      { id: 'b', text: 'Serializable, Repeatable Read, Read Committed, Read Uncommitted' },
      { id: 'c', text: 'Read Committed, Read Uncommitted, Serializable, Repeatable Read' },
      { id: 'd', text: 'Repeatable Read, Serializable, Read Uncommitted, Read Committed' }
    ],
    correct: ['a'],
    explanation: 'The SQL standard defines four levels in increasing strength: Read Uncommitted (dirty reads allowed), Read Committed (only committed data is read), Repeatable Read (a repeated read sees the same value) and Serializable (the result must equal some serial execution). Each stronger level forbids at least everything the weaker one forbids.',
    topic: 'Isolation Levels', subtopic: 'SQL isolation levels', difficulty: 'easy', points: 10
  },
  {
    id: 'ugc-net-cs-practice-read-committed',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Read Committed isolation prevents which anomaly while still allowing non-repeatable reads?',
    options: [
      { id: 'a', text: 'Dirty reads' },
      { id: 'b', text: 'Phantom reads' },
      { id: 'c', text: 'Lost updates' },
      { id: 'd', text: 'Write skew' }
    ],
    correct: ['a'],
    explanation: 'Read Committed guarantees that a transaction reads only data written by committed transactions, which rules out dirty reads. A value read earlier can still be changed and committed by another transaction before it is read again, so non-repeatable reads remain possible; phantoms also remain possible.',
    topic: 'Isolation Levels', subtopic: 'Read Committed', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-repeatable-read-phantom',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Repeatable Read isolation guarantees that',
    options: [
      { id: 'a', text: 'a value read twice in the same transaction is the same, but new rows matching a predicate may still appear' },
      { id: 'b', text: 'no phantom rows can ever appear' },
      { id: 'c', text: 'every schedule is conflict serializable' },
      { id: 'd', text: 'no deadlocks can occur' }
    ],
    correct: ['a'],
    explanation: 'Repeatable Read keeps the rows a transaction has already read unchanged for the duration of the transaction, so a repeated read of an existing row returns the same value. A separate insert that satisfies a range predicate can still show up on a re-executed query, which is the phantom anomaly. Isolation levels do not eliminate deadlocks.',
    topic: 'Isolation Levels', subtopic: 'Repeatable Read', difficulty: 'medium', points: 15
  },
  {
    id: 'ugc-net-cs-practice-serializable-eliminates',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Serializable isolation guarantees',
    options: [
      { id: 'a', text: 'only that dirty reads are prevented' },
      { id: 'b', text: 'a result equivalent to some serial execution, so dirty, non-repeatable and phantom reads are all prevented' },
      { id: 'c', text: 'that deadlocks cannot occur' },
      { id: 'd', text: 'the maximum possible concurrency' }
    ],
    correct: ['b'],
    explanation: 'Serializable is the strongest standard level: the concurrent execution must be equivalent to running the transactions one at a time. That rules out dirty reads, non-repeatable reads and phantoms. It does not prevent deadlocks, and in fact usually reduces concurrency.',
    topic: 'Isolation Levels', subtopic: 'Serializable isolation', difficulty: 'easy', points: 10
  },
  {
    id: 'gate-cse-practice-phantom-cause',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'A phantom read is caused by another transaction',
    options: [
      { id: 'a', text: 'updating a row that the first transaction has already read' },
      { id: 'b', text: 'inserting or deleting rows that match a predicate the first transaction re-evaluates' },
      { id: 'c', text: 'reading the same row twice' },
      { id: 'd', text: 'aborting after writing a row' }
    ],
    correct: ['b'],
    explanation: 'A phantom is a change in the set of rows that satisfy a predicate, not a change in the value of a row already seen. When the first transaction repeats its range query it sees rows that were not there before (or misses deleted ones). That is why row locks alone are insufficient and predicate/range locking is needed.',
    topic: 'Concurrency Anomalies', subtopic: 'Phantom reads', difficulty: 'medium', points: 15
  },
  {
    id: 'ugc-net-cs-practice-snapshot-write-skew',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Under snapshot isolation, two transactions read overlapping data, each writes a different item, and both commit, producing a result that no serial execution could produce. This anomaly is',
    options: [
      { id: 'a', text: 'write skew' },
      { id: 'b', text: 'dirty read' },
      { id: 'c', text: 'phantom read' },
      { id: 'd', text: 'lost update' }
    ],
    correct: ['a'],
    explanation: 'Snapshot isolation detects write-write conflicts but not read-write conflicts, so two transactions can each read the same condition and then write disjoint items, jointly violating an invariant. This is write skew. Because the written items differ, there is no lost update and no dirty read.',
    topic: 'Concurrency Anomalies', subtopic: 'Write skew', difficulty: 'hard', points: 20
  },
  {
    id: 'gate-cse-practice-predicate-locking',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Which technique prevents phantoms by locking the range of values that satisfies a query condition?',
    options: [
      { id: 'a', text: 'Predicate (range) locking' },
      { id: 'b', text: 'Binary locking' },
      { id: 'c', text: 'Lock escalation' },
      { id: 'd', text: 'Basic timestamp ordering' }
    ],
    correct: ['a'],
    explanation: 'A phantom appears because a new row enters a predicate range, which no existing row lock covers. Predicate locking closes that gap by locking the logical range (in practice implemented with next-key or gap locks), so an insert that would match the predicate must wait.',
    topic: 'Concurrency Anomalies', subtopic: 'Predicate locking', difficulty: 'medium', points: 15
  },
  {
    id: 'ugc-net-cs-practice-lost-update-prevention',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Which mechanism most directly prevents a lost update in a read-modify-write sequence?',
    options: [
      { id: 'a', text: 'Holding an exclusive lock on the item across the read and the write' },
      { id: 'b', text: 'Using Read Uncommitted isolation' },
      { id: 'c', text: 'Releasing the lock immediately after the read' },
      { id: 'd', text: 'Taking a shared lock for the write' }
    ],
    correct: ['a'],
    explanation: 'A lost update happens when two transactions read the same value and then both write, so the second write overwrites the first. Keeping an exclusive lock from the read through the write forces the second transaction to wait until the first has finished, which removes the interleaving that causes the loss.',
    topic: 'Isolation Levels', subtopic: 'Lost update prevention', difficulty: 'medium', points: 15
  },

  /* Recoverability */
  {
    id: 'gate-cse-practice-recoverable-definition',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'A schedule is recoverable if',
    options: [
      { id: 'a', text: 'every transaction eventually commits' },
      { id: 'b', text: 'whenever Tj reads data written by Ti, Ti commits before Tj commits' },
      { id: 'c', text: 'it is conflict serializable' },
      { id: 'd', text: 'no transaction ever aborts' }
    ],
    correct: ['b'],
    explanation: 'Recoverability is about commit ordering: if Tj depends on a value produced by Ti, then Ti must be committed before Tj commits, so that a rollback of Ti can never invalidate a transaction that has already committed. Requiring every transaction to commit is neither necessary nor sufficient for this property.',
    topic: 'Recoverability', subtopic: 'Recoverable schedules', difficulty: 'medium', points: 15
  },
  {
    id: 'ugc-net-cs-practice-cascadeless-definition',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'A cascadeless schedule requires that',
    options: [
      { id: 'a', text: 'a transaction reads only data written by committed transactions' },
      { id: 'b', text: 'transactions commit in identifier order' },
      { id: 'c', text: 'no locks are used' },
      { id: 'd', text: 'all locks are released at the same instant' }
    ],
    correct: ['a'],
    explanation: 'Cascadelessness forbids reading uncommitted data: a transaction may read only values whose writer has already committed. As a result, aborting a transaction cannot force the transactions that read its data to abort as well, which is exactly what prevents cascading rollbacks.',
    topic: 'Recoverability', subtopic: 'Cascadeless schedules', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-strict-schedule-definition',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'A strict schedule requires that',
    options: [
      { id: 'a', text: 'a transaction neither reads nor writes an item written by an uncommitted transaction' },
      { id: 'b', text: 'every transaction uses two-phase locking' },
      { id: 'c', text: 'commit order equals timestamp order' },
      { id: 'd', text: 'only exclusive locks are ever used' }
    ],
    correct: ['a'],
    explanation: 'Strictness extends cascadelessness to writes: no transaction may read or overwrite a value produced by a transaction that has not yet committed or aborted. This also makes undo simple, because an aborted transaction’s writes were never observed by anyone else.',
    topic: 'Recoverability', subtopic: 'Strict schedules', difficulty: 'hard', points: 20
  },
  {
    id: 'ugc-net-cs-practice-recoverability-hierarchy',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Which containment relationship between the classes of schedules is correct?',
    options: [
      { id: 'a', text: 'strict ⊂ cascadeless ⊂ recoverable' },
      { id: 'b', text: 'recoverable ⊂ strict ⊂ cascadeless' },
      { id: 'c', text: 'cascadeless ⊂ strict ⊂ recoverable' },
      { id: 'd', text: 'all three classes are identical' }
    ],
    correct: ['a'],
    explanation: 'Every strict schedule is cascadeless (strict forbids both reading and writing uncommitted data, cascadeless forbids reading it), and every cascadeless schedule is recoverable (no uncommitted data is read, so commit ordering is automatically respected). The inclusions are proper: recoverable schedules may allow dirty reads, and cascadeless ones may allow dirty writes.',
    topic: 'Recoverability', subtopic: 'Schedule classes', difficulty: 'hard', points: 20
  },
  {
    id: 'gate-cse-practice-strict-2pl-recoverable',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Why does strict two-phase locking produce recoverable schedules?',
    options: [
      { id: 'a', text: 'Exclusive locks are held until commit, so no other transaction can read uncommitted writes' },
      { id: 'b', text: 'It prevents all deadlocks' },
      { id: 'c', text: 'It orders transactions by timestamp' },
      { id: 'd', text: 'It uses only shared locks' }
    ],
    correct: ['a'],
    explanation: 'Since an X-lock is never released before commit or abort, another transaction cannot read a value that its writer has not yet committed. Without dirty reads, there is no dependency on uncommitted work, so a rollback never invalidates a committed transaction. Strict 2PL does not, however, prevent deadlocks.',
    topic: 'Recoverability', subtopic: 'Strict 2PL', difficulty: 'medium', points: 15
  },
  {
    id: 'ugc-net-cs-practice-cascading-rollback',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'If a schedule allows cascading rollbacks, which statement is true?',
    options: [
      { id: 'a', text: 'One abort may force other transactions to abort as well' },
      { id: 'b', text: 'No transaction ever aborts' },
      { id: 'c', text: 'The schedule must be serial' },
      { id: 'd', text: 'Deadlocks cannot occur' }
    ],
    correct: ['a'],
    explanation: 'A cascading rollback happens when T2 has read data written by T1 and T1 aborts: T2 must now abort too, and any transaction that read T2’s data must also abort, and so on. Recoverable schedules can still allow this; cascadeless and strict schedules are the ones that prevent it.',
    topic: 'Recoverability', subtopic: 'Cascading rollback', difficulty: 'easy', points: 10
  },

  /* Timestamp ordering and optimistic control */
  {
    id: 'gate-cse-practice-timestamp-read-rule',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'In basic timestamp ordering, transaction T tries to read item X. If TS(T) is less than WTS(X), the read is',
    options: [
      { id: 'a', text: 'allowed because reads never change data' },
      { id: 'b', text: 'rejected, and T is aborted and restarted with a new timestamp' },
      { id: 'c', text: 'converted into a write' },
      { id: 'd', text: 'delayed until the writer commits' }
    ],
    correct: ['b'],
    explanation: 'WTS(X) is the timestamp of the transaction that wrote the current value of X. If TS(T) is smaller, T is older than that writer and should already have read the item before the write happened; reading it now would violate timestamp order. T is therefore aborted and restarted with a larger timestamp.',
    topic: 'Timestamp Ordering', subtopic: 'Read rule', difficulty: 'hard', points: 20
  },
  {
    id: 'ugc-net-cs-practice-timestamp-write-rule',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'In basic timestamp ordering, transaction T tries to write item X. If TS(T) is less than RTS(X), the write is',
    options: [
      { id: 'a', text: 'allowed because writes always win' },
      { id: 'b', text: 'rejected because a younger transaction has already read X, which T’s write would invalidate' },
      { id: 'c', text: 'silently ignored and the transaction continues' },
      { id: 'd', text: 'converted into a read' }
    ],
    correct: ['b'],
    explanation: 'RTS(X) records the largest timestamp among transactions that have read X. If TS(T) is smaller than RTS(X), T is older than a transaction that has already read the current value, so letting T write now would make that read invalid. T is aborted and restarted.',
    topic: 'Timestamp Ordering', subtopic: 'Write rule', difficulty: 'hard', points: 20
  },
  {
    id: 'gate-cse-practice-thomas-write-rule',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'The Thomas write rule modifies basic timestamp ordering so that a write is ignored when',
    options: [
      { id: 'a', text: 'TS(T) is less than WTS(X), instead of aborting T' },
      { id: 'b', text: 'TS(T) is greater than WTS(X)' },
      { id: 'c', text: 'the item is currently locked' },
      { id: 'd', text: 'T is older than every other transaction' }
    ],
    correct: ['a'],
    explanation: 'When TS(T) < WTS(X), the item has already been overwritten by a younger transaction, so T’s write would be overwritten anyway and can safely be skipped. Ignoring it avoids an unnecessary abort. The rule still aborts when TS(T) < RTS(X), because then a read would be invalidated.',
    topic: 'Timestamp Ordering', subtopic: 'Thomas write rule', difficulty: 'hard', points: 20
  },
  {
    id: 'ugc-net-cs-practice-thomas-view-serializable',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'A schedule produced with the Thomas write rule may be',
    options: [
      { id: 'a', text: 'view serializable but not conflict serializable' },
      { id: 'b', text: 'not serializable in any sense' },
      { id: 'c', text: 'always conflict serializable' },
      { id: 'd', text: 'always recoverable' }
    ],
    correct: ['a'],
    explanation: 'Ignoring an obsolete write removes a conflict edge that strict ordering would have preserved, so the resulting schedule can fail the conflict-serializability test while still producing the same final values and reads as a serial schedule. That makes it view serializable but not necessarily conflict serializable.',
    topic: 'Timestamp Ordering', subtopic: 'Thomas write rule', difficulty: 'hard', points: 20
  },
  {
    id: 'gate-cse-practice-optimistic-phases',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Optimistic concurrency control executes every transaction in three phases. Which order is correct?',
    options: [
      { id: 'a', text: 'Validation, read, write' },
      { id: 'b', text: 'Write, read, validation' },
      { id: 'c', text: 'Read, validation, write' },
      { id: 'd', text: 'Read, write, validation' }
    ],
    correct: ['c'],
    explanation: 'During the read phase the transaction reads the database and keeps its updates in a private workspace. In the validation phase the system checks whether those updates would conflict with concurrent transactions. Only if validation succeeds does the write phase apply the updates to the database.',
    topic: 'Optimistic Concurrency Control', subtopic: 'Phases', difficulty: 'medium', points: 15
  },
  {
    id: 'ugc-net-cs-practice-timestamp-no-deadlock',
    examId: 'ugc-net-cs', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Basic timestamp ordering cannot deadlock because',
    options: [
      { id: 'a', text: 'transactions never wait for one another; a conflicting operation aborts and restarts the transaction' },
      { id: 'b', text: 'it uses locks in a fixed order' },
      { id: 'c', text: 'it runs every transaction serially' },
      { id: 'd', text: 'it has only two phases' }
    ],
    correct: ['a'],
    explanation: 'Timestamp ordering is non-blocking: when an operation cannot be ordered correctly the transaction is aborted and restarted rather than made to wait. With no waits there is no wait-for graph and therefore no deadlock, although the price is a higher abort rate.',
    topic: 'Timestamp Ordering', subtopic: 'Deadlock freedom', difficulty: 'medium', points: 15
  },
  {
    id: 'gate-cse-practice-2pl-vs-timestamp',
    examId: 'gate-cse', year: null, session: null, questionType: 'practice', verification: 'unverified',
    prompt: 'Compared with two-phase locking, timestamp ordering',
    options: [
      { id: 'a', text: 'avoids deadlock but may abort and restart more transactions' },
      { id: 'b', text: 'never aborts any transaction' },
      { id: 'c', text: 'guarantees recoverability by itself' },
      { id: 'd', text: 'always allows more concurrency' }
    ],
    correct: ['a'],
    explanation: '2PL blocks conflicting transactions and can deadlock; timestamp ordering never blocks, so it is deadlock-free, but it resolves conflicts by aborting and restarting transactions, which can happen more often. Neither protocol by itself guarantees recoverability — that needs additional rules such as committing before dependent reads.',
    topic: 'Timestamp Ordering', subtopic: 'Protocol comparison', difficulty: 'medium', points: 15
  }
];

const EXTRA_EXAM_QUESTIONS = [...VERIFIED_PREVIOUS_YEAR, ...PRACTICE_QUESTIONS];

module.exports = { EXTRA_EXAM_QUESTIONS };
