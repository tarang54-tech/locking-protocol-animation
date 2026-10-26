/**
 * data/questions/easy.js — EASY questions (50).
 *
 * "Easy" describes the intrinsic difficulty of the question itself: it can be
 * answered by recalling or by applying one rule directly. The topics are
 * deliberately mixed — an easy question may be about deadlocks, and a hard
 * question may be about lock basics.
 *
 * Question shape:
 *   id, prompt, options:[{id,text}], correct:[optionId], multi, explanation,
 *   topic, subtopic, reference, points
 */
module.exports = [
  /* ── Lock Basics ─────────────────────────────────────────────── */
  {
    id: 'easy-01',
    prompt: 'Which lock type allows several transactions to read the same data item at the same time?',
    options: [
      { id: 'a', text: 'Exclusive (X) lock' },
      { id: 'b', text: 'Shared (S) lock' },
      { id: 'c', text: 'Intent (I) lock' },
      { id: 'd', text: 'Update (U) lock' }
    ],
    correct: ['b'],
    explanation: 'A Shared (S) lock is compatible with other S-locks, so any number of transactions may hold an S-lock on the same item and read it concurrently.',
    topic: 'Lock Basics',
    subtopic: 'Shared vs exclusive locks',
    reference: 'Learn § 2.4 Shared Lock (S-Lock)'
  },
  {
    id: 'easy-02',
    prompt: 'Which lock must be acquired before a transaction writes a data item?',
    options: [
      { id: 'a', text: 'Shared (S) lock' },
      { id: 'b', text: 'Exclusive (X) lock' },
      { id: 'c', text: 'No lock is required for a write' },
      { id: 'd', text: 'Both an S-lock and an X-lock' }
    ],
    correct: ['b'],
    explanation: 'A write modifies the item, so it needs an Exclusive (X) lock. An X-lock is incompatible with every other lock on the same item.',
    topic: 'Lock Basics',
    subtopic: 'Shared vs exclusive locks',
    reference: 'Learn § 2.5 Exclusive Lock (X-Lock)'
  },
  {
    id: 'easy-03',
    prompt: 'Are two Shared (S) locks on the same data item compatible with each other?',
    options: [
      { id: 'a', text: 'Yes — S-locks are compatible with S-locks' },
      { id: 'b', text: 'No — only one lock may exist per item' },
      { id: 'c', text: 'Yes, but only if the transactions are in the growing phase' },
      { id: 'd', text: 'No — S-locks conflict with every lock' }
    ],
    correct: ['a'],
    explanation: 'The lock compatibility matrix marks S/S as compatible. This is what allows several readers to work on the same item concurrently.',
    topic: 'Lock Basics',
    subtopic: 'Lock compatibility matrix',
    reference: 'Learn § 3 Lock Compatibility Matrix'
  },
  {
    id: 'easy-04',
    prompt: 'An Exclusive (X) lock is held on item A by T1. What may T2 do on item A?',
    options: [
      { id: 'a', text: 'Read A using a shared lock' },
      { id: 'b', text: 'Write A using an exclusive lock' },
      { id: 'c', text: 'Neither read nor write A — the request is queued' },
      { id: 'd', text: 'Read A, but only after T1 has started its shrinking phase' }
    ],
    correct: ['c'],
    explanation: 'An X-lock conflicts with both S-locks and X-locks, so while T1 holds it no other transaction may read or write A. The request goes into the wait queue instead.',
    topic: 'Lock Basics',
    subtopic: 'Lock compatibility matrix',
    reference: 'Learn § 3 Lock Compatibility Matrix'
  },
  {
    id: 'easy-05',
    prompt: 'Which database operation requires an Exclusive (X) lock?',
    options: [
      { id: 'a', text: 'Reading an item' },
      { id: 'b', text: 'Writing an item' },
      { id: 'c', text: 'Listing the items of a relation' },
      { id: 'd', text: 'Committing a transaction' }
    ],
    correct: ['b'],
    explanation: 'A write needs an X-lock so that no other transaction can read or modify the item until the write is committed.',
    topic: 'Lock Basics',
    subtopic: 'Shared vs exclusive locks',
    reference: 'Learn § 2.5 Exclusive Lock (X-Lock)'
  },
  {
    id: 'easy-06',
    prompt: 'What is a lock upgrade?',
    options: [
      { id: 'a', text: 'Converting a held X-lock into an S-lock' },
      { id: 'b', text: 'Converting a held S-lock into an X-lock' },
      { id: 'c', text: 'Acquiring locks on several items at once' },
      { id: 'd', text: 'Releasing every lock held by a transaction' }
    ],
    correct: ['b'],
    explanation: 'A transaction that read an item holds an S-lock; when it later writes the item it upgrades that S-lock into an X-lock.',
    topic: 'Lock Basics',
    subtopic: 'Lock upgrades and downgrades',
    reference: 'Learn § 12 Technical Implementation'
  },
  {
    id: 'easy-07',
    prompt: 'What is a lock downgrade?',
    options: [
      { id: 'a', text: 'Converting a held S-lock into an X-lock' },
      { id: 'b', text: 'Converting a held X-lock into an S-lock' },
      { id: 'c', text: 'Releasing a lock that was never acquired' },
      { id: 'd', text: 'Taking a second X-lock on the same item' }
    ],
    correct: ['b'],
    explanation: 'A downgrade weakens an X-lock into an S-lock, for instance when a transaction has written an item and only needs to read it from then on.',
    topic: 'Lock Basics',
    subtopic: 'Lock upgrades and downgrades',
    reference: 'Learn § 12 Technical Implementation'
  },
  {
    id: 'easy-08',
    prompt: 'What is the maximum number of transactions that can simultaneously hold a shared (S) lock on the same data item?',
    options: [
      { id: 'a', text: 'One' },
      { id: 'b', text: 'Two' },
      { id: 'c', text: 'Unlimited — S-locks are mutually compatible' },
      { id: 'd', text: 'Exactly the number of transactions in the schedule' }
    ],
    correct: ['c'],
    explanation: 'Because S-locks are compatible with one another, an arbitrary number of transactions may hold an S-lock on the same item. A limit only appears when one of them asks for an X-lock.',
    topic: 'Lock Basics',
    subtopic: 'Lock compatibility matrix',
    reference: 'Learn § 3 Lock Compatibility Matrix'
  },
  {
    id: 'easy-09',
    prompt: 'In the lock table of this simulator, what does the "waiting queue" of a data item hold?',
    options: [
      { id: 'a', text: 'The transactions that currently hold a lock on the item' },
      { id: 'b', text: 'The transactions whose lock requests could not be granted yet' },
      { id: 'c', text: 'A history of every lock ever taken on the item' },
      { id: 'd', text: 'The data values stored in the item' }
    ],
    correct: ['b'],
    explanation: 'Each lock-table row has "holders" (transactions that own a lock) and "queue" (requests that are waiting because the locks conflict). The queue is served in FIFO order.',
    topic: 'Lock Basics',
    subtopic: 'Lock table structure',
    reference: 'Learn § 12 Technical Implementation'
  },
  {
    id: 'easy-10',
    prompt: 'What happens to a transaction whose lock request conflicts with a lock already held by another transaction?',
    options: [
      { id: 'a', text: 'The request is granted immediately' },
      { id: 'b', text: 'The transaction is aborted straight away' },
      { id: 'c', text: 'The transaction waits in the queue for that item' },
      { id: 'd', text: 'The conflicting lock is revoked' }
    ],
    correct: ['c'],
    explanation: 'Incompatible requests are queued: the transaction moves to the "waiting" state and is granted the lock as soon as the blocking holders release it.',
    topic: 'Lock Basics',
    subtopic: 'Wait queues',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'easy-11',
    prompt: 'Which statement about the growing phase of a transaction is correct?',
    options: [
      { id: 'a', text: 'The transaction may acquire new locks but must not release any' },
      { id: 'b', text: 'The transaction may release locks but must not acquire new ones' },
      { id: 'c', text: 'The transaction may do anything with locks' },
      { id: 'd', text: 'The transaction must already hold every lock it will ever need' }
    ],
    correct: ['a'],
    explanation: 'In the growing phase the set of held locks only grows: new locks may be taken, but none may be given back.',
    topic: 'Two-Phase Locking',
    subtopic: 'Growing and shrinking phases',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'easy-12',
    prompt: 'Which statement about the shrinking phase of a transaction is correct?',
    options: [
      { id: 'a', text: 'The transaction may acquire new locks but must not release any' },
      { id: 'b', text: 'The transaction may release locks but must not acquire new ones' },
      { id: 'c', text: 'The transaction must hold all locks until commit' },
      { id: 'd', text: 'The transaction may only read after it starts shrinking' }
    ],
    correct: ['b'],
    explanation: 'In the shrinking phase locks may be released, but acquiring a new lock after the first release breaks the two-phase rule.',
    topic: 'Two-Phase Locking',
    subtopic: 'Growing and shrinking phases',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },

  /* ── Two-Phase Locking ───────────────────────────────────────── */
  {
    id: 'easy-13',
    prompt: 'How many phases does the Two-Phase Locking (2PL) protocol define?',
    options: [
      { id: 'a', text: 'One' },
      { id: 'b', text: 'Two — a growing phase and a shrinking phase' },
      { id: 'c', text: 'Three — read, write and commit' },
      { id: 'd', text: 'Four — one per lock type' }
    ],
    correct: ['b'],
    explanation: '2PL splits the life of a transaction into a growing phase (acquiring locks) and a shrinking phase (releasing locks).',
    topic: 'Two-Phase Locking',
    subtopic: 'Basic two-phase locking',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'easy-14',
    prompt: 'Which of the following orderings of the two 2PL phases is correct?',
    options: [
      { id: 'a', text: 'Shrinking phase first, then growing phase' },
      { id: 'b', text: 'Growing phase first, then shrinking phase' },
      { id: 'c', text: 'The two phases may be interleaved freely' },
      { id: 'd', text: 'Both phases happen simultaneously at commit time' }
    ],
    correct: ['b'],
    explanation: 'A transaction first grows its set of locks and afterwards shrinks it. The point in between is called the lock point.',
    topic: 'Two-Phase Locking',
    subtopic: 'Growing and shrinking phases',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'easy-15',
    prompt: 'What is the "lock point" of a transaction?',
    options: [
      { id: 'a', text: 'The moment the first lock is acquired' },
      { id: 'b', text: 'The moment the last required lock is acquired' },
      { id: 'c', text: 'The moment the first lock is released' },
      { id: 'd', text: 'The moment the transaction commits' }
    ],
    correct: ['b'],
    explanation: 'The lock point is the boundary between the growing and the shrinking phase — the point at which the transaction holds all of its locks.',
    topic: 'Two-Phase Locking',
    subtopic: 'Lock point',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'easy-16',
    prompt: 'What does following the 2PL protocol guarantee about the resulting schedule?',
    options: [
      { id: 'a', text: 'It is conflict-serializable' },
      { id: 'b', text: 'It is deadlock-free' },
      { id: 'c', text: 'It never needs cascading rollback' },
      { id: 'd', text: 'It is free of starvation' }
    ],
    correct: ['a'],
    explanation: '2PL guarantees conflict-serializability. It does not by itself guarantee freedom from deadlock, from cascading rollback or from starvation.',
    topic: 'Two-Phase Locking',
    subtopic: 'Guarantees of 2PL',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'easy-17',
    prompt: 'What triggers the beginning of the shrinking phase?',
    options: [
      { id: 'a', text: 'The acquisition of the first lock' },
      { id: 'b', text: 'The release of the first lock' },
      { id: 'c', text: 'The commit of the transaction' },
      { id: 'd', text: 'The read of the first item' }
    ],
    correct: ['b'],
    explanation: 'The shrinking phase begins with the very first release. From that point on the transaction may only give locks back, never take new ones.',
    topic: 'Two-Phase Locking',
    subtopic: 'Growing and shrinking phases',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'easy-18',
    prompt: 'May a transaction that has already released a lock acquire a new lock?',
    options: [
      { id: 'a', text: 'Yes, as long as the new lock is on a different item' },
      { id: 'b', text: 'Yes, if the transaction has not committed yet' },
      { id: 'c', text: 'No — that would break the two-phase rule' },
      { id: 'd', text: 'Yes, but only for shared locks' }
    ],
    correct: ['c'],
    explanation: 'Acquiring a new lock after the first release breaks the two-phase rule, so the schedule loses the conflict-serializability guarantee.',
    topic: 'Two-Phase Locking',
    subtopic: 'Protocol violations',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'easy-19',
    prompt: 'How many locks must a transaction hold at its lock point?',
    options: [
      { id: 'a', text: 'At least one' },
      { id: 'b', text: 'All the locks it will ever need' },
      { id: 'c', text: 'Exactly one' },
      { id: 'd', text: 'Only the exclusive locks' }
    ],
    correct: ['b'],
    explanation: 'At the lock point the growing phase is over: the transaction holds every lock it needs, which is what allows other transactions to be ordered safely around it.',
    topic: 'Two-Phase Locking',
    subtopic: 'Lock point',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'easy-20',
    prompt: 'Which of the following is the 2PL rule in a single sentence?',
    options: [
      { id: 'a', text: 'A transaction may not acquire a new lock after it has released one' },
      { id: 'b', text: 'A transaction must hold all its locks until it commits' },
      { id: 'c', text: 'A transaction may only lock items it is going to read' },
      { id: 'd', text: 'A transaction may not hold more than one lock at a time' }
    ],
    correct: ['a'],
    explanation: 'That single sentence is the whole of basic 2PL: the growing phase comes first and the shrinking phase second, with no overlap.',
    topic: 'Two-Phase Locking',
    subtopic: 'Basic two-phase locking',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'easy-21',
    prompt: 'In this simulator, what happens when a transaction violates the Basic 2PL rule?',
    options: [
      { id: 'a', text: 'The lock is simply refused and the transaction waits' },
      { id: 'b', text: 'The transaction is aborted and all of its locks are released' },
      { id: 'c', text: 'The transaction is allowed to continue but is marked as unsafe' },
      { id: 'd', text: 'The scheduler silently ignores the offending operation' }
    ],
    correct: ['b'],
    explanation: 'The simulator detects the violation, aborts the transaction, releases its locks and re-processes the wait queues so that other transactions can continue.',
    topic: 'Two-Phase Locking',
    subtopic: 'Protocol violations',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'easy-22',
    prompt: 'What is the phase of a transaction that has acquired all of its locks but not yet released any of them?',
    options: [
      { id: 'a', text: 'The growing phase' },
      { id: 'b', text: 'The shrinking phase' },
      { id: 'c', text: 'The lock point' },
      { id: 'd', text: 'The waiting phase' }
    ],
    correct: ['c'],
    explanation: 'The moment the last lock is taken, the transaction is at its lock point: the growing phase has ended and the shrinking phase is about to begin.',
    topic: 'Two-Phase Locking',
    subtopic: 'Lock point',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },

  /* ── Deadlock ────────────────────────────────────────────────── */
  {
    id: 'easy-23',
    prompt: 'What is a deadlock in the context of locking protocols?',
    options: [
      { id: 'a', text: 'When a transaction takes too long' },
      { id: 'b', text: 'When transactions wait for each other in a cycle' },
      { id: 'c', text: 'When a lock cannot be granted' },
      { id: 'd', text: 'When the database runs out of memory' }
    ],
    correct: ['b'],
    explanation: 'A deadlock is a situation in which every transaction in a cycle waits for a resource held by the next one, so none of them can proceed.',
    topic: 'Deadlock',
    subtopic: 'Deadlock detection',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'easy-24',
    prompt: 'Which data structure is used to detect deadlocks?',
    options: [
      { id: 'a', text: 'The lock table' },
      { id: 'b', text: 'The wait-for graph' },
      { id: 'c', text: 'The precedence graph' },
      { id: 'd', text: 'The buffer pool' }
    ],
    correct: ['b'],
    explanation: 'The wait-for graph shows which transactions are waiting for which other transactions. A cycle in this graph indicates a deadlock.',
    topic: 'Deadlock',
    subtopic: 'Wait-for graphs',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'easy-25',
    prompt: 'A cycle in the wait-for graph means:',
    options: [
      { id: 'a', text: 'A lock upgrade is possible' },
      { id: 'b', text: 'A transaction is starving' },
      { id: 'c', text: 'A deadlock exists' },
      { id: 'd', text: 'The schedule is conflict-serializable' }
    ],
    correct: ['c'],
    explanation: 'If T1 waits for T2, T2 waits for T3 and T3 waits for T1, no transaction can ever proceed — the circular wait condition of a deadlock is satisfied.',
    topic: 'Deadlock',
    subtopic: 'Deadlock detection',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'easy-26',
    prompt: 'In a wait-for graph, what does the edge T1 → T2 mean?',
    options: [
      { id: 'a', text: 'T1 has committed and released its locks to T2' },
      { id: 'b', text: 'T1 is waiting for a lock that is held by T2' },
      { id: 'c', text: 'T1 is blocked because T2 aborted' },
      { id: 'd', text: 'T1 and T2 requested a lock on the same item' }
    ],
    correct: ['b'],
    explanation: 'An edge is added from a waiter to every holder of the lock it is waiting for, so the arrow points in the direction "waits for".',
    topic: 'Deadlock',
    subtopic: 'Wait-for graphs',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'easy-27',
    prompt: 'Which algorithm does this simulator use to detect a cycle in the wait-for graph?',
    options: [
      { id: 'a', text: 'Depth-First Search with a recursion stack' },
      { id: 'b', text: "Dijkstra's shortest path algorithm" },
      { id: 'c', text: 'Binary search over sorted transaction ids' },
      { id: 'd', text: "Kruskal's minimum spanning tree" }
    ],
    correct: ['a'],
    explanation: 'The simulator performs a DFS over the wait-for graph. Reaching a node that is already on the current recursion path means a cycle — and therefore a deadlock — has been found.',
    topic: 'Deadlock',
    subtopic: 'Deadlock detection',
    reference: 'Learn § 12 Technical Implementation'
  },
  {
    id: 'easy-28',
    prompt: 'How is a deadlock typically resolved?',
    options: [
      { id: 'a', text: 'By waiting for the transactions to sort themselves out' },
      { id: 'b', text: 'By aborting one of the transactions in the cycle (victim selection)' },
      { id: 'c', text: 'By granting every pending lock request at once' },
      { id: 'd', text: 'By restarting the database' }
    ],
    correct: ['b'],
    explanation: 'A deadlock can only be broken by making at least one transaction give up its locks. Aborting a victim rolls it back and releases its locks, which breaks the cycle.',
    topic: 'Deadlock',
    subtopic: 'Deadlock resolution',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'easy-29',
    prompt: 'What is starvation in the context of locking?',
    options: [
      { id: 'a', text: 'A transaction is aborted because of a deadlock' },
      { id: 'b', text: 'A transaction waits indefinitely because other transactions keep taking priority' },
      { id: 'c', text: 'A transaction reads data that was never committed' },
      { id: 'd', text: 'A transaction holds more locks than it actually needs' }
    ],
    correct: ['b'],
    explanation: 'In starvation the transaction is not blocked by a cycle — it simply never wins the race for the lock, because other transactions are repeatedly granted ahead of it.',
    topic: 'Concurrency Control',
    subtopic: 'Starvation',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'easy-30',
    prompt: 'What is a deadlock victim?',
    options: [
      { id: 'a', text: 'The transaction that is chosen to be aborted so that the cycle can be broken' },
      { id: 'b', text: 'The transaction that has been waiting the longest' },
      { id: 'c', text: 'The transaction that holds the most locks' },
      { id: 'd', text: 'The transaction that is granted the lock first' }
    ],
    correct: ['a'],
    explanation: 'Aborting the victim releases its locks, which unblocks the rest of the cycle. A good victim is usually the one that has done the least work, to keep the rollback cheap.',
    topic: 'Deadlock',
    subtopic: 'Deadlock resolution',
    reference: 'Learn § 5 Deadlock Theory'
  },

  /* ── Serializability ─────────────────────────────────────────── */
  {
    id: 'easy-31',
    prompt: 'Two operations conflict when:',
    options: [
      { id: 'a', text: 'They belong to the same transaction and touch the same item' },
      { id: 'b', text: 'They belong to different transactions, touch the same item, and at least one of them is a write' },
      { id: 'c', text: 'They are two reads of the same item' },
      { id: 'd', text: 'They are two writes of different items' }
    ],
    correct: ['b'],
    explanation: 'A conflict requires different transactions, the same item, and at least one write. Two reads never conflict, which is exactly why S-locks are compatible.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'easy-32',
    prompt: 'Which pair of operations is NOT a conflict?',
    options: [
      { id: 'a', text: 'Read (A) in T1 and Write (A) in T2' },
      { id: 'b', text: 'Write (A) in T1 and Read (A) in T2' },
      { id: 'c', text: 'Write (A) in T1 and Write (A) in T2' },
      { id: 'd', text: 'Read (A) in T1 and Read (A) in T2' }
    ],
    correct: ['d'],
    explanation: 'Two reads of the same item do not interfere with each other, so read-read is not a conflict. Every pair that contains a write is a conflict.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'easy-33',
    prompt: 'A schedule is called serializable if:',
    options: [
      { id: 'a', text: 'All transactions run in parallel' },
      { id: 'b', text: 'Its outcome is equivalent to that of some serial schedule' },
      { id: 'c', text: 'No locks are used' },
      { id: 'd', text: 'Every transaction commits' }
    ],
    correct: ['b'],
    explanation: 'A serializable schedule produces the same result as executing the transactions one after another in some order, so the interleaving is invisible to the user.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'easy-34',
    prompt: 'Which structure is used to test whether a schedule is conflict-serializable?',
    options: [
      { id: 'a', text: 'The lock table' },
      { id: 'b', text: 'The precedence (serialization) graph' },
      { id: 'c', text: 'The wait-for graph' },
      { id: 'd', text: 'The write-ahead log' }
    ],
    correct: ['b'],
    explanation: 'The precedence graph has one vertex per transaction and an edge Ti → Tj for every conflicting pair ordered Ti before Tj. The schedule is conflict-serializable exactly when this graph is acyclic.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'easy-35',
    prompt: 'The precedence graph of a schedule is acyclic. What can be concluded?',
    options: [
      { id: 'a', text: 'The schedule is conflict-serializable' },
      { id: 'b', text: 'The schedule is deadlock-free' },
      { id: 'c', text: 'The schedule is recoverable' },
      { id: 'd', text: 'The schedule follows 2PL' }
    ],
    correct: ['a'],
    explanation: 'An acyclic precedence graph is exactly the test for conflict-serializability. It says nothing about deadlocks, recoverability or whether 2PL was followed.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'easy-36',
    prompt: 'Does a cycle in the precedence graph mean that a deadlock occurred?',
    options: [
      { id: 'a', text: 'Yes — a cycle always means a deadlock' },
      { id: 'b', text: 'No — a cycle means the schedule is not conflict-serializable' },
      { id: 'c', text: 'Yes, provided the transactions are waiting for each other' },
      { id: 'd', text: 'No, because cycles cannot appear in a precedence graph' }
    ],
    correct: ['b'],
    explanation: 'The precedence graph describes the order of conflicting operations, while the wait-for graph describes who is waiting for which lock. A cycle in the precedence graph means the schedule is not conflict-serializable — not that it is deadlocked.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },

  /* ── Transactions ────────────────────────────────────────────── */
  {
    id: 'easy-37',
    prompt: 'What is released when a transaction commits?',
    options: [
      { id: 'a', text: 'Nothing — the locks stay until the database is restarted' },
      { id: 'b', text: 'All locks the transaction is holding' },
      { id: 'c', text: 'Only the shared locks' },
      { id: 'd', text: 'Only the exclusive lock on the last item written' }
    ],
    correct: ['b'],
    explanation: 'On commit (or abort) the transaction releases every lock it holds, which is also what unblocks any transaction waiting behind it.',
    topic: 'Transactions',
    subtopic: 'Commit and abort behaviour',
    reference: 'Learn § 2.2 What is a Transaction?'
  },
  {
    id: 'easy-38',
    prompt: 'What is released when a transaction aborts?',
    options: [
      { id: 'a', text: 'Only the locks on items that were not modified' },
      { id: 'b', text: 'All locks the transaction is holding' },
      { id: 'c', text: 'Nothing — the locks are kept until the transaction is retried' },
      { id: 'd', text: 'Only the exclusive locks' }
    ],
    correct: ['b'],
    explanation: 'An aborted transaction is rolled back and gives back every lock it holds, so that the items become accessible again.',
    topic: 'Transactions',
    subtopic: 'Commit and abort behaviour',
    reference: 'Learn § 2.2 What is a Transaction?'
  },
  {
    id: 'easy-39',
    prompt: 'In the simulator, what does the blue "T1: Committed" badge in the transaction status bar mean?',
    options: [
      { id: 'a', text: 'T1 finished successfully and released all of its locks' },
      { id: 'b', text: 'T1 is waiting for a lock' },
      { id: 'c', text: 'T1 was aborted because of a protocol violation' },
      { id: 'd', text: 'T1 has not started yet' }
    ],
    correct: ['a'],
    explanation: 'A committed transaction has finished normally; all the locks it held were released, so other transactions waiting on them can now proceed.',
    topic: 'Transactions',
    subtopic: 'Commit and abort behaviour',
    reference: 'Learn § 2.2 What is a Transaction?'
  },
  {
    id: 'easy-40',
    prompt: 'What does the "D" of the ACID properties stand for?',
    options: [
      { id: 'a', text: 'Determinism' },
      { id: 'b', text: 'Durability' },
      { id: 'c', text: 'Deadlock-freedom' },
      { id: 'd', text: 'Data isolation' }
    ],
    correct: ['b'],
    explanation: 'Durability means that once a transaction has committed, its effect survives a crash — the changes have been written to durable storage.',
    topic: 'Transactions',
    subtopic: 'ACID properties',
    reference: 'Learn § 2.2 What is a Transaction?'
  },
  {
    id: 'easy-41',
    prompt: 'What is a dirty read?',
    options: [
      { id: 'a', text: 'Reading a value written by a committed transaction' },
      { id: 'b', text: 'Reading a value written by a transaction that has not yet committed' },
      { id: 'c', text: 'Reading the same value twice in one transaction' },
      { id: 'd', text: 'Failing to read a value that has been deleted' }
    ],
    correct: ['b'],
    explanation: 'A dirty read exposes uncommitted data. Strict 2PL prevents it because the writer keeps its X-lock until commit, so no reader can touch the item in the meantime.',
    topic: 'Concurrency Control',
    subtopic: 'Isolation problems',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'easy-42',
    prompt: 'What is a cascading rollback?',
    options: [
      { id: 'a', text: 'Rolling back a single transaction' },
      { id: 'b', text: 'Aborting one transaction forces other transactions that read its data to abort too' },
      { id: 'c', text: 'Releasing the locks of a transaction in reverse order' },
      { id: 'd', text: 'Restarting the database after a crash' }
    ],
    correct: ['b'],
    explanation: 'If T2 reads data written by T1 and T1 then aborts, T2 has used invalid data and must be rolled back as well — and so on down the chain.',
    topic: 'Transactions',
    subtopic: 'Cascading rollback',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },

  /* ── Concurrency Control ─────────────────────────────────────── */
  {
    id: 'easy-43',
    prompt: 'Which isolation level is the strictest?',
    options: [
      { id: 'a', text: 'Read Uncommitted' },
      { id: 'b', text: 'Read Committed' },
      { id: 'c', text: 'Repeatable Read' },
      { id: 'd', text: 'Serializable' }
    ],
    correct: ['d'],
    explanation: 'Serializable is the strictest isolation level: the schedule behaves exactly as if the transactions had executed one after another.',
    topic: 'Concurrency Control',
    subtopic: 'Isolation levels',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'easy-44',
    prompt: 'What is the phantom problem?',
    options: [
      { id: 'a', text: 'A transaction reads a value that was never committed' },
      { id: 'b', text: 'A repeated query returns new rows inserted by another committed transaction' },
      { id: 'c', text: 'A lock disappears from the lock table' },
      { id: 'd', text: 'A transaction holds two locks on the same item' }
    ],
    correct: ['b'],
    explanation: 'Row-level locks do not protect the result set of a predicate: new rows can appear between two executions of the same query. Range or predicate locks are the usual remedy.',
    topic: 'Concurrency Control',
    subtopic: 'Phantom reads',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'easy-45',
    prompt: 'Which family of protocols is called "pessimistic"?',
    options: [
      { id: 'a', text: 'Lock-based protocols such as 2PL, because they lock before using data' },
      { id: 'b', text: 'Timestamp-based protocols, because they use timestamps' },
      { id: 'c', text: 'Validation-based protocols, because they check at the end' },
      { id: 'd', text: 'Checkpoint-based protocols, because they take checkpoints' }
    ],
    correct: ['a'],
    explanation: 'Pessimistic concurrency control assumes conflicts will happen and prevents them by locking the data in advance. Optimistic control lets transactions run and checks them at commit time instead.',
    topic: 'Concurrency Control',
    subtopic: 'Pessimistic vs optimistic concurrency control',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'easy-46',
    prompt: 'Which family of protocols is called "optimistic"?',
    options: [
      { id: 'a', text: 'Lock-based protocols, because they hold locks for a long time' },
      { id: 'b', text: 'Timestamp and validation-based protocols, because they detect conflicts at commit time' },
      { id: 'c', text: 'Only the protocols that never abort' },
      { id: 'd', text: 'Only the protocols used in distributed databases' }
    ],
    correct: ['b'],
    explanation: 'Optimistic concurrency control lets transactions run without blocking and validates them at the end; if a conflict is found the transaction is aborted and retried.',
    topic: 'Concurrency Control',
    subtopic: 'Pessimistic vs optimistic concurrency control',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'easy-47',
    prompt: 'Does two-phase locking prevent deadlocks?',
    options: [
      { id: 'a', text: 'Yes — a transaction in 2PL can never wait' },
      { id: 'b', text: 'No — 2PL guarantees serializability but deadlocks are still possible' },
      { id: 'c', text: 'Yes — but only under strict 2PL' },
      { id: 'd', text: 'Yes — but only when shared locks are not used' }
    ],
    correct: ['b'],
    explanation: 'Transactions following 2PL can still wait for one another and form a cycle. Deadlock freedom needs an extra rule, such as conservative 2PL or a fixed lock order.',
    topic: 'Deadlock',
    subtopic: 'Deadlock freedom',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'easy-48',
    prompt: 'What is the lost update problem?',
    options: [
      { id: 'a', text: 'Two transactions update the same item and one update silently overwrites the other' },
      { id: 'b', text: 'A transaction reads data that was never committed' },
      { id: 'c', text: 'A transaction is blocked forever by another transaction' },
      { id: 'd', text: 'The database crashes in the middle of a commit' }
    ],
    correct: ['a'],
    explanation: 'If T1 and T2 both read a value and then both write a new value based on it, the second write discards the first one. Exclusive locks (or a timestamp check) prevent this.',
    topic: 'Concurrency Control',
    subtopic: 'Lost update problem',
    reference: 'Learn § 3 Lock Compatibility Matrix'
  },
  {
    id: 'easy-49',
    prompt: 'Which of the following is the correct order of the isolation levels from weakest to strongest?',
    options: [
      { id: 'a', text: 'Read Uncommitted → Read Committed → Repeatable Read → Serializable' },
      { id: 'b', text: 'Serializable → Repeatable Read → Read Committed → Read Uncommitted' },
      { id: 'c', text: 'Read Committed → Read Uncommitted → Serializable → Repeatable Read' },
      { id: 'd', text: 'Repeatable Read → Read Uncommitted → Read Committed → Serializable' }
    ],
    correct: ['a'],
    explanation: 'Each level adds a guarantee: Read Uncommitted allows dirty reads, Read Committed prevents them, Repeatable Read also prevents non-repeatable reads, and Serializable prevents every anomaly.',
    topic: 'Concurrency Control',
    subtopic: 'Isolation levels',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'easy-50',
    prompt: 'Which statement about shared locks is correct?',
    options: [
      { id: 'a', text: 'An S-lock prevents other transactions from taking an S-lock' },
      { id: 'b', text: 'An S-lock allows only reading and does not block other readers' },
      { id: 'c', text: 'An S-lock is released automatically when the transaction ends only' },
      { id: 'd', text: 'An S-lock is only allowed in the shrinking phase' }
    ],
    correct: ['b'],
    explanation: 'An S-lock grants read access only and is compatible with other S-locks, which is what makes concurrent reads possible. It conflicts with any X-lock on the same item.',
    topic: 'Lock Basics',
    subtopic: 'Shared vs exclusive locks',
    reference: 'Learn § 2.4 Shared Lock (S-Lock)'
  },
  {
    id: 'easy-51',
    prompt: "In a lock compatibility matrix, which pair of lock requests on the same data item is compatible?",
    options: [
      {
            "id": "a",
            "text": "Shared (S) and Shared (S)"
      },
      {
            "id": "b",
            "text": "Shared (S) and Exclusive (X)"
      },
      {
            "id": "c",
            "text": "Exclusive (X) and Shared (S)"
      },
      {
            "id": "d",
            "text": "Exclusive (X) and Exclusive (X)"
      }
],
    correct: ["a"],
    explanation: "In the standard lock compatibility matrix, only Shared-Shared (S-S) locks are compatible with each other on the same data item. Any combination involving an Exclusive (X) lock conflicts.",
    topic: 'Lock Basics',
    subtopic: 'Lock compatibility matrix',
    reference: 'Learn § 2.4 Shared Lock (S-Lock)'
  },
  {
    id: 'easy-52',
    prompt: "What occurs during the growing phase of the basic Two-Phase Locking (2PL) protocol?",
    options: [
      {
            "id": "a",
            "text": "A transaction may acquire new locks, but cannot release any locks"
      },
      {
            "id": "b",
            "text": "A transaction may release locks, but cannot acquire any new locks"
      },
      {
            "id": "c",
            "text": "A transaction can both acquire and release locks freely"
      },
      {
            "id": "d",
            "text": "All locks are converted exclusively to shared locks"
      }
],
    correct: ["a"],
    explanation: "In the growing (or expanding) phase of 2PL, a transaction may acquire new locks as needed, but is strictly prohibited from releasing any locks.",
    topic: 'Two-Phase Locking',
    subtopic: 'Growing and shrinking phases',
    reference: 'Learn § 4.1 Basic Two-Phase Locking'
  },
  {
    id: 'easy-53',
    prompt: "What marks the beginning of the shrinking phase in basic Two-Phase Locking (2PL)?",
    options: [
      {
            "id": "a",
            "text": "The release of the very first lock by the transaction"
      },
      {
            "id": "b",
            "text": "The commit of the transaction"
      },
      {
            "id": "c",
            "text": "The acquisition of the final lock required"
      },
      {
            "id": "d",
            "text": "The rollback of any conflicting transaction"
      }
],
    correct: ["a"],
    explanation: "The shrinking phase begins the moment a transaction releases its first lock. Once this happens, the lock point has been passed and no new locks can ever be acquired.",
    topic: 'Two-Phase Locking',
    subtopic: 'Growing and shrinking phases',
    reference: 'Learn § 4.1 Basic Two-Phase Locking'
  },
  {
    id: 'easy-54',
    prompt: "What is the lock point of a transaction under basic Two-Phase Locking?",
    options: [
      {
            "id": "a",
            "text": "The point in time when the transaction acquires its final lock"
      },
      {
            "id": "b",
            "text": "The moment the transaction issues its very first read operation"
      },
      {
            "id": "c",
            "text": "The time when the transaction commits and writes to disk"
      },
      {
            "id": "d",
            "text": "The moment when all locks are finally released"
      }
],
    correct: ["a"],
    explanation: "The lock point is the exact instant when a transaction has acquired the last lock it needs before it starts releasing locks. The serialization order of transactions is determined by their lock points.",
    topic: 'Two-Phase Locking',
    subtopic: 'Growing and shrinking phases',
    reference: 'Learn § 4.1 Basic Two-Phase Locking'
  },
  {
    id: 'easy-55',
    prompt: "In Strict Two-Phase Locking (Strict 2PL), when are exclusive (X) locks released?",
    options: [
      {
            "id": "a",
            "text": "Only after the transaction commits or aborts"
      },
      {
            "id": "b",
            "text": "As soon as the write operation on the item completes"
      },
      {
            "id": "c",
            "text": "Immediately when the shrinking phase begins"
      },
      {
            "id": "d",
            "text": "Whenever another transaction requests a shared lock on the item"
      }
],
    correct: ["a"],
    explanation: "Strict 2PL requires that all exclusive (X) locks held by a transaction must be retained until the transaction terminates (commits or aborts), preventing dirty reads and cascading rollbacks.",
    topic: 'Two-Phase Locking',
    subtopic: 'Strict 2PL',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'easy-56',
    prompt: "How does Rigorous Two-Phase Locking differ from Strict Two-Phase Locking?",
    options: [
      {
            "id": "a",
            "text": "Rigorous 2PL holds BOTH shared (S) and exclusive (X) locks until commit or abort"
      },
      {
            "id": "b",
            "text": "Rigorous 2PL holds only shared locks until commit and releases X locks early"
      },
      {
            "id": "c",
            "text": "Rigorous 2PL acquires all locks atomically before execution begins"
      },
      {
            "id": "d",
            "text": "Rigorous 2PL completely eliminates deadlocks"
      }
],
    correct: ["a"],
    explanation: "While Strict 2PL holds all exclusive locks until end-of-transaction, Rigorous 2PL holds all locks (both shared and exclusive) until the transaction commits or aborts.",
    topic: 'Two-Phase Locking',
    subtopic: 'Rigorous 2PL',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'easy-57',
    prompt: "What is the primary operational rule of Conservative (Static) Two-Phase Locking?",
    options: [
      {
            "id": "a",
            "text": "A transaction must pre-declare and acquire all required locks before starting execution"
      },
      {
            "id": "b",
            "text": "A transaction never releases any locks until 10 seconds after commit"
      },
      {
            "id": "c",
            "text": "A transaction only locks tables, never individual rows or disk pages"
      },
      {
            "id": "d",
            "text": "Shared locks are automatically upgraded to exclusive locks upon reading"
      }
],
    correct: ["a"],
    explanation: "Conservative 2PL requires a transaction to lock all items it will access before execution begins. If any item cannot be locked, it waits without holding any locks, thereby avoiding deadlocks.",
    topic: 'Two-Phase Locking',
    subtopic: 'Conservative 2PL',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'easy-58',
    prompt: "Which of the following protocols is inherently deadlock-free by design?",
    options: [
      {
            "id": "a",
            "text": "Conservative (Static) Two-Phase Locking"
      },
      {
            "id": "b",
            "text": "Basic Two-Phase Locking"
      },
      {
            "id": "c",
            "text": "Strict Two-Phase Locking"
      },
      {
            "id": "d",
            "text": "Rigorous Two-Phase Locking"
      }
],
    correct: ["a"],
    explanation: "Because Conservative 2PL acquires all required locks upfront or none at all (it does not hold some locks while waiting for others), it eliminates the hold-and-wait condition, making deadlock impossible.",
    topic: 'Deadlock',
    subtopic: 'Deadlock prevention',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'easy-59',
    prompt: "What does a directed edge from transaction T1 to T2 (T1 \u2192 T2) in a Wait-For Graph (WFG) signify?",
    options: [
      {
            "id": "a",
            "text": "T1 is waiting for a lock currently held by T2"
      },
      {
            "id": "b",
            "text": "T2 is waiting for a lock currently held by T1"
      },
      {
            "id": "c",
            "text": "T1 committed before T2 started"
      },
      {
            "id": "d",
            "text": "T1 has aborted T2 due to timestamp superiority"
      }
],
    correct: ["a"],
    explanation: "In a Wait-For Graph (WFG), a directed edge T1 \u2192 T2 indicates that transaction T1 is waiting for data item(s) currently locked by transaction T2.",
    topic: 'Deadlock',
    subtopic: 'Wait-for graph',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'easy-60',
    prompt: "What does the presence of a cycle in a Wait-For Graph indicate in a database system?",
    options: [
      {
            "id": "a",
            "text": "A deadlock exists among the transactions forming the cycle"
      },
      {
            "id": "b",
            "text": "The execution schedule is guaranteed to be conflict-serializable"
      },
      {
            "id": "c",
            "text": "A cascading rollback has been triggered"
      },
      {
            "id": "d",
            "text": "All transactions in the cycle have committed successfully"
      }
],
    correct: ["a"],
    explanation: "A cycle in a Wait-For Graph indicates a circular wait condition where every transaction in the cycle is waiting for a resource held by another, meaning a deadlock has occurred.",
    topic: 'Deadlock',
    subtopic: 'Wait-for graph',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'easy-61',
    prompt: "In Multiple Granularity Locking (MGL), what does an Intention Shared (IS) lock at a higher node indicate?",
    options: [
      {
            "id": "a",
            "text": "Explicit shared locking will be performed at a finer (lower) level of the hierarchy"
      },
      {
            "id": "b",
            "text": "The entire subtree rooted at this node is locked in shared mode"
      },
      {
            "id": "c",
            "text": "Exclusive locks are held on all children of this node"
      },
      {
            "id": "d",
            "text": "The node is locked for intentional deletion"
      }
],
    correct: ["a"],
    explanation: "An Intention Shared (IS) lock indicates that the transaction intends to acquire explicit Shared (S) locks at a lower, finer granularity level in the hierarchy tree.",
    topic: 'Multiple Granularity Locking',
    subtopic: 'Intention locks',
    reference: 'Learn § 6 Multiple Granularity'
  },
  {
    id: 'easy-62',
    prompt: "In Multiple Granularity Locking (MGL), what does an Intention Exclusive (IX) lock signify?",
    options: [
      {
            "id": "a",
            "text": "Explicit exclusive or shared locking will be performed at a lower level of the hierarchy"
      },
      {
            "id": "b",
            "text": "The entire table or database is locked exclusively"
      },
      {
            "id": "c",
            "text": "All lower level locks must be released immediately"
      },
      {
            "id": "d",
            "text": "No lower level locks may be acquired by this transaction"
      }
],
    correct: ["a"],
    explanation: "An Intention Exclusive (IX) lock explicitly signals that lower-level granular items (e.g., rows or pages) will be locked in exclusive or shared mode.",
    topic: 'Multiple Granularity Locking',
    subtopic: 'Intention locks',
    reference: 'Learn § 6 Multiple Granularity'
  },
  {
    id: 'easy-63',
    prompt: "Are Intention Shared (IS) and Intention Exclusive (IX) locks compatible on the same node?",
    options: [
      {
            "id": "a",
            "text": "Yes, IS and IX are compatible with each other"
      },
      {
            "id": "b",
            "text": "No, IS and IX always conflict"
      },
      {
            "id": "c",
            "text": "Only if both are held by the exact same transaction"
      },
      {
            "id": "d",
            "text": "Only if the node represents an individual record"
      }
],
    correct: ["a"],
    explanation: "In the MGL compatibility matrix, IS and IX are compatible. One transaction can read some records (IS) while another writes different records (IX) within the same table.",
    topic: 'Multiple Granularity Locking',
    subtopic: 'Intention locks',
    reference: 'Learn § 6 Multiple Granularity'
  },
  {
    id: 'easy-64',
    prompt: "What does a Shared Intention Exclusive (SIX) lock represent in Multiple Granularity Locking?",
    options: [
      {
            "id": "a",
            "text": "The node is locked in shared mode, and explicit exclusive locking will be done at lower levels"
      },
      {
            "id": "b",
            "text": "Six transactions are sharing an exclusive lock simultaneously"
      },
      {
            "id": "c",
            "text": "The node allows shared locks only after six clock cycles"
      },
      {
            "id": "d",
            "text": "An intention lock used strictly for index leaf nodes"
      }
],
    correct: ["a"],
    explanation: "A SIX lock combines S and IX: the entire subtree is locked in Shared mode (so the holder can read everything), and the transaction intends to acquire explicit Exclusive locks on specific lower-level items.",
    topic: 'Multiple Granularity Locking',
    subtopic: 'Intention locks',
    reference: 'Learn § 6 Multiple Granularity'
  },
  {
    id: 'easy-65',
    prompt: "What is lock escalation in a Database Management System?",
    options: [
      {
            "id": "a",
            "text": "Converting many fine-grained locks (such as row locks) into a single coarse-grained lock (such as a table lock)"
      },
      {
            "id": "b",
            "text": "Automatically upgrading every read lock to a write lock after 10 seconds"
      },
      {
            "id": "c",
            "text": "Raising the priority of a transaction waiting in a lock queue"
      },
      {
            "id": "d",
            "text": "Releasing locks before transactions commit to save memory"
      }
],
    correct: ["a"],
    explanation: "Lock escalation is the process of converting numerous fine-grained locks (like thousands of individual row locks) into a single coarser lock (such as a table lock) to free lock manager memory.",
    topic: 'Multiple Granularity Locking',
    subtopic: 'Lock escalation',
    reference: 'Learn § 6 Multiple Granularity'
  },
  {
    id: 'easy-66',
    prompt: "What is the primary role of an Update (U) lock?",
    options: [
      {
            "id": "a",
            "text": "To prevent a common deadlock when multiple transactions read with intent to update later"
      },
      {
            "id": "b",
            "text": "To force immediate update of database indexes on disk"
      },
      {
            "id": "c",
            "text": "To update transaction timestamps upon commit"
      },
      {
            "id": "d",
            "text": "To permit concurrent writing by multiple transactions"
      }
],
    correct: ["a"],
    explanation: "An Update (U) lock is used when reading an item that might later be updated. Since U locks are mutually incompatible, only one transaction can hold a U lock, avoiding conversion deadlocks where two transactions hold S locks and both wait for X.",
    topic: 'Lock Basics',
    subtopic: 'Update locks',
    reference: 'Learn § 2 Lock Types'
  },
  {
    id: 'easy-67',
    prompt: "In the Wait-Die deadlock prevention scheme, what happens if an older transaction requests a lock held by a younger transaction?",
    options: [
      {
            "id": "a",
            "text": "The older transaction is allowed to wait"
      },
      {
            "id": "b",
            "text": "The older transaction is aborted and dies"
      },
      {
            "id": "c",
            "text": "The younger transaction is aborted immediately"
      },
      {
            "id": "d",
            "text": "Both transactions are rolled back"
      }
],
    correct: ["a"],
    explanation: "In Wait-Die: Old requests Young \u2192 Old is allowed to WAIT. Young requests Old \u2192 Young is aborted (DIES). Hence an older transaction waiting for a younger one simply waits.",
    topic: 'Deadlock',
    subtopic: 'Wait-Die and Wound-Wait',
    reference: 'Learn § 5.2 Prevention'
  },
  {
    id: 'easy-68',
    prompt: "In the Wait-Die deadlock prevention scheme, what happens if a younger transaction requests a lock held by an older transaction?",
    options: [
      {
            "id": "a",
            "text": "The younger transaction dies (aborts and restarts)"
      },
      {
            "id": "b",
            "text": "The younger transaction is allowed to wait"
      },
      {
            "id": "c",
            "text": "The older transaction is killed"
      },
      {
            "id": "d",
            "text": "The lock is granted immediately to both"
      }
],
    correct: ["a"],
    explanation: "In Wait-Die, if a younger transaction requests a resource held by an older transaction, the younger transaction is not permitted to wait; it dies (aborts and restarts with its original timestamp).",
    topic: 'Deadlock',
    subtopic: 'Wait-Die and Wound-Wait',
    reference: 'Learn § 5.2 Prevention'
  },
  {
    id: 'easy-69',
    prompt: "In the Wound-Wait deadlock prevention scheme, what happens if an older transaction requests a lock held by a younger transaction?",
    options: [
      {
            "id": "a",
            "text": "The older transaction wounds (preempts/aborts) the younger transaction"
      },
      {
            "id": "b",
            "text": "The older transaction is aborted and dies"
      },
      {
            "id": "c",
            "text": "The older transaction is forced to wait indefinitely"
      },
      {
            "id": "d",
            "text": "The younger transaction is upgraded to exclusive mode"
      }
],
    correct: ["a"],
    explanation: "In Wound-Wait: Old requests Young \u2192 Old WOUNDS Young (Young is aborted and rolls back). Young requests Old \u2192 Young WAITS.",
    topic: 'Deadlock',
    subtopic: 'Wait-Die and Wound-Wait',
    reference: 'Learn § 5.2 Prevention'
  },
  {
    id: 'easy-70',
    prompt: "In the Wound-Wait deadlock prevention scheme, what happens if a younger transaction requests a lock held by an older transaction?",
    options: [
      {
            "id": "a",
            "text": "The younger transaction is allowed to wait"
      },
      {
            "id": "b",
            "text": "The younger transaction wounds the older transaction"
      },
      {
            "id": "c",
            "text": "The younger transaction is aborted immediately"
      },
      {
            "id": "d",
            "text": "The older transaction is restarted with a new timestamp"
      }
],
    correct: ["a"],
    explanation: "In Wound-Wait, if a younger transaction requests a resource held by an older transaction, the younger transaction is allowed to wait.",
    topic: 'Deadlock',
    subtopic: 'Wait-Die and Wound-Wait',
    reference: 'Learn § 5.2 Prevention'
  },
  {
    id: 'easy-71',
    prompt: "What happens to a transaction timestamp when it is aborted and restarted under Wait-Die or Wound-Wait?",
    options: [
      {
            "id": "a",
            "text": "It retains its original timestamp to prevent starvation"
      },
      {
            "id": "b",
            "text": "It receives a brand-new current timestamp making it younger"
      },
      {
            "id": "c",
            "text": "Its timestamp is doubled to lower its priority"
      },
      {
            "id": "d",
            "text": "Its timestamp is removed and converted to a random priority"
      }
],
    correct: ["a"],
    explanation: "To prevent starvation, an aborted transaction in timestamp-based deadlock prevention schemes is restarted with its original timestamp so it progressively becomes the oldest transaction in the system.",
    topic: 'Deadlock',
    subtopic: 'Wait-Die and Wound-Wait',
    reference: 'Learn § 5.2 Prevention'
  },
  {
    id: 'easy-72',
    prompt: "What is a cascading rollback (or cascading abort)?",
    options: [
      {
            "id": "a",
            "text": "The failure of one transaction causes other transactions that read its uncommitted changes to also abort"
      },
      {
            "id": "b",
            "text": "A transaction that rolls back and immediately restarts ten times"
      },
      {
            "id": "c",
            "text": "Rolling back the database log when disk storage is exhausted"
      },
      {
            "id": "d",
            "text": "A deadlock resolution technique that kills all transactions simultaneously"
      }
],
    correct: ["a"],
    explanation: "Cascading rollback occurs when the failure/abort of one transaction T forces other transactions that read uncommitted data written by T to also be aborted and rolled back.",
    topic: 'Transactions',
    subtopic: 'Cascading rollbacks',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'easy-73',
    prompt: "Which locking protocol is guaranteed to be Cascadeless (prevents cascading rollbacks)?",
    options: [
      {
            "id": "a",
            "text": "Strict Two-Phase Locking"
      },
      {
            "id": "b",
            "text": "Basic Two-Phase Locking without strictness"
      },
      {
            "id": "c",
            "text": "Tree-based locking protocol with early release"
      },
      {
            "id": "d",
            "text": "Shared-only locking with early unlock"
      }
],
    correct: ["a"],
    explanation: "Strict 2PL prevents cascading aborts because exclusive locks are held until commit, meaning no other transaction can read uncommitted data (dirty reads are completely prevented).",
    topic: 'Two-Phase Locking',
    subtopic: 'Strict 2PL',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'easy-74',
    prompt: "In a precedence graph (serialization graph), what does a directed edge from Ti to Tj represent?",
    options: [
      {
            "id": "a",
            "text": "An operation of Ti executed before and conflicted with an operation of Tj"
      },
      {
            "id": "b",
            "text": "Ti is blocked waiting for Tj to release a lock"
      },
      {
            "id": "c",
            "text": "Tj committed before Ti started"
      },
      {
            "id": "d",
            "text": "Ti has a smaller timestamp than Tj"
      }
],
    correct: ["a"],
    explanation: "In a precedence graph, an edge Ti \u2192 Tj means there is a conflicting operation between Ti and Tj, and Ti executed its conflicting operation before Tj.",
    topic: 'Serializability',
    subtopic: 'Precedence graph',
    reference: 'Learn § 3 Serializability'
  },
  {
    id: 'easy-75',
    prompt: "A schedule is conflict-serializable if and only if its precedence graph:",
    options: [
      {
            "id": "a",
            "text": "Contains no cycles (is acyclic)"
      },
      {
            "id": "b",
            "text": "Contains at least one cycle"
      },
      {
            "id": "c",
            "text": "Has all edges pointing in a single direction towards one terminal node"
      },
      {
            "id": "d",
            "text": "Is completely disconnected with no edges"
      }
],
    correct: ["a"],
    explanation: "A schedule S is conflict-serializable if and only if its serialization graph (precedence graph) has no cycles (is a Directed Acyclic Graph / DAG).",
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 3 Serializability'
  }
];
