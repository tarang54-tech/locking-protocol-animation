/**
 * data/questions/hard.js — HARD questions (50).
 *
 * "Hard" describes the intrinsic difficulty of the question itself: it needs
 * several steps of reasoning, a protocol-violation analysis, a precedence
 * graph construction or an edge case that punishes a superficial answer.
 * The topics are deliberately mixed.
 */
module.exports = [
  /* ── Lock Basics ─────────────────────────────────────────────── */
  {
    id: 'hard-01',
    prompt: 'T1 holds an S-lock on A and T2 holds an S-lock on A. T1 requests an X-lock on A, and shortly afterwards T2 also requests an X-lock on A. What is the final state?',
    options: [
      { id: 'a', text: 'Both upgrades succeed once the S-locks are compatible' },
      { id: 'b', text: 'Both upgrades are queued, each transaction waits for the other, and a deadlock is detected' },
      { id: 'c', text: 'T1 gets the upgrade and T2 keeps waiting' },
      { id: 'd', text: 'Both transactions are rolled back automatically' }
    ],
    correct: ['b'],
    explanation: 'T1\'s upgrade needs T2\'s S-lock to be released, and T2\'s upgrade needs T1\'s. Neither can proceed, the wait-for graph contains the cycle T1 → T2 → T1, and the simulator reports a deadlock. This is the most common deadlock in real systems such as InnoDB.',
    topic: 'Deadlock',
    subtopic: 'Lock upgrade deadlock',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'hard-02',
    prompt: 'T1 holds X(A) and requests X(B). T2 holds S(B) and requests S(A). Is this a deadlock?',
    options: [
      { id: 'a', text: 'No — T2\'s S-lock request on A conflicts with T1\'s X-lock, so T2 waits, but T1 only needs T2\'s S-lock on B to be released, which happens when T2 commits' },
      { id: 'b', text: 'Yes — the wait-for graph contains a cycle' },
      { id: 'c', text: 'Yes — both transactions wait for each other on the same item' },
      { id: 'd', text: 'No — the system aborts T1 immediately' }
    ],
    correct: ['a'],
    explanation: 'T2 waits for T1 (on A), but T1 waits only for T2 to release B. T2 can reach its commit and release B, so there is no cycle. A deadlock needs every transaction in the cycle to be waiting for another one in the cycle.',
    topic: 'Deadlock',
    subtopic: 'Deadlock detection',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'hard-03',
    prompt: 'T1 holds X(A) and X(B) and wants to read C. T2 holds S(C) and wants to write A. Which statement is correct?',
    options: [
      { id: 'a', text: 'T2 waits for T1 on A, and T1 waits for T2 on C — a deadlock' },
      { id: 'b', text: 'T1 waits for T2 on C, and T2 waits for T1 on A — a deadlock' },
      { id: 'c', text: 'Both requests are granted, because the items are different' },
      { id: 'd', text: 'T1 is aborted because it holds more locks' }
    ],
    correct: ['a'],
    explanation: 'T1 needs S(C), which conflicts with T2\'s S(C) once T2 upgrades it for the write; T2 needs X(A), which T1 holds. The wait-for graph is T1 → T2 and T2 → T1, so this is a deadlock even though the transactions touch several different items.',
    topic: 'Deadlock',
    subtopic: 'Deadlock detection',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'hard-04',
    prompt: 'Under the compatibility matrix, T1 holds S(A). Which of the following requests can be granted immediately?',
    options: [
      { id: 'a', text: 'S(A) by T2, and X(A) by T3' },
      { id: 'b', text: 'S(A) by T2, and S(A) by T3' },
      { id: 'c', text: 'Only X(A) by T2' },
      { id: 'd', text: 'Only S(A) by T2' }
    ],
    correct: ['b'],
    explanation: 'A shared lock is compatible with any number of other shared locks, so both S(A) requests succeed. The X(A) request conflicts with T1\'s S-lock and has to wait.',
    topic: 'Lock Basics',
    subtopic: 'Lock compatibility matrix',
    reference: 'Learn § 3 Lock Compatibility Matrix'
  },
  {
    id: 'hard-05',
    prompt: 'A transaction is in its growing phase and has released nothing yet. Which of the following actions violates the 2PL protocol?',
    options: [
      { id: 'a', text: 'Acquiring an X-lock on C' },
      { id: 'b', text: 'Releasing S(A) and then taking X(B) later' },
      { id: 'c', text: 'Downgrading the X-lock on C to an S-lock and then taking no further locks' },
      { id: 'd', text: 'Acquiring an S-lock on D and then upgrading it to an X-lock' }
    ],
    correct: ['b'],
    explanation: 'Releasing S(A) starts the shrinking phase, and the later acquisition of X(B) is an acquisition after a release — the classic 2PL violation. Option c is valid because the downgrade starts the shrinking phase and no further locks are taken, option d is a normal upgrade inside the growing phase, and option a is a normal acquisition.',
    topic: 'Two-Phase Locking',
    subtopic: 'Protocol violations',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },

  /* ── Two-Phase Locking ───────────────────────────────────────── */
  {
    id: 'hard-06',
    prompt: 'A transaction executes: lockS(A); read(A); unlock(A); lockS(B); read(B); commit. What is wrong with this sequence?',
    options: [
      { id: 'a', text: 'Nothing — releasing a shared lock early is always allowed' },
      { id: 'b', text: 'It violates basic 2PL, because a new lock (S on B) is taken after the first release' },
      { id: 'c', text: 'It violates strict 2PL, because the shared lock on A is released before the commit' },
      { id: 'd', text: 'It is a correct conservative-2PL schedule' }
    ],
    correct: ['b'],
    explanation: 'The unlock of A starts the shrinking phase, and the lockS(B) afterwards is an acquisition in the shrinking phase. Basic 2PL forbids this; the simulator aborts the transaction. Note that the same sequence would also violate strict 2PL, but the first rule it breaks is the basic one.',
    topic: 'Two-Phase Locking',
    subtopic: 'Protocol violations',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'hard-07',
    prompt: 'A transaction executes: lockX(A); read(A); unlock(A); commit. Which protocol has been violated?',
    options: [
      { id: 'a', text: 'None — the transaction still follows basic 2PL' },
      { id: 'b', text: 'Strict 2PL, because an exclusive lock is released before the commit' },
      { id: 'c', text: 'Rigorous 2PL only, and not strict 2PL' },
      { id: 'd', text: 'Conservative 2PL, because the lock was not taken up front' }
    ],
    correct: ['b'],
    explanation: 'The transaction still follows basic 2PL (it never takes a new lock after releasing one), but strict 2PL requires every X-lock to be held until commit or abort. Releasing it early exposes uncommitted data and is a strict-2PL violation.',
    topic: 'Two-Phase Locking',
    subtopic: 'Protocol violations',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'hard-08',
    prompt: 'Under rigorous 2PL, which of the following sequences is acceptable?',
    options: [
      { id: 'a', text: 'lockS(A); read(A); unlock(A); commit' },
      { id: 'b', text: 'lockS(A); read(A); lockX(B); write(B); commit; unlock(A); unlock(B)' },
      { id: 'c', text: 'lockS(A); read(A); lockX(B); write(B); unlock(B); commit' },
      { id: 'd', text: 'lockX(A); write(A); unlock(A); commit' }
    ],
    correct: ['b'],
    explanation: 'Rigorous 2PL requires every lock, shared ones included, to be held until commit or abort, and no lock may be taken after a release. Option B is the only sequence that satisfies both conditions.',
    topic: 'Two-Phase Locking',
    subtopic: 'Rigorous 2PL',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'hard-09',
    prompt: 'Why does basic 2PL not prevent cascading rollbacks?',
    options: [
      { id: 'a', text: 'Because a transaction may release an X-lock before committing' },
      { id: 'b', text: 'Because 2PL does not guarantee conflict-serializability' },
      { id: 'c', text: 'Because shared locks are incompatible with each other' },
      { id: 'd', text: 'Because 2PL allows a transaction to acquire a lock after releasing one' }
    ],
    correct: ['a'],
    explanation: 'If an X-lock is released early, another transaction can read the uncommitted value; when the writer aborts, the reader must be rolled back as well. 2PL does guarantee conflict-serializability, so options B and D are wrong, and S-locks are compatible, so C is wrong too.',
    topic: 'Two-Phase Locking',
    subtopic: 'Cascading rollback',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'hard-10',
    prompt: 'Under conservative 2PL, transaction T needs S-locks on A and B and an X-lock on C, while U already holds an X-lock on C. What happens to T?',
    options: [
      { id: 'a', text: 'T starts and holds S(A) and S(B) while it waits for C' },
      { id: 'b', text: 'T cannot start at all, because conservative 2PL must acquire every lock before execution' },
      { id: 'c', text: 'T starts, reads A and B, and then waits for C' },
      { id: 'd', text: 'U is aborted so that T can take the X-lock on C' }
    ],
    correct: ['b'],
    explanation: 'Conservative 2PL obtains every lock up front. Since the X-lock on C is unavailable, T does not start and holds no lock at all — which is exactly why conservative 2PL cannot deadlock.',
    topic: 'Two-Phase Locking',
    subtopic: 'Conservative 2PL',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'hard-11',
    prompt: 'Which statement about the relationship between 2PL and serializability is correct?',
    options: [
      { id: 'a', text: 'Every schedule produced by 2PL is conflict-serializable, but not every conflict-serializable schedule can be produced by 2PL' },
      { id: 'b', text: 'Every conflict-serializable schedule can be produced by 2PL' },
      { id: 'c', text: '2PL produces exactly the serial schedules' },
      { id: 'd', text: 'Conflict-serializable schedules can never be produced by any locking protocol' }
    ],
    correct: ['a'],
    explanation: '2PL is a sufficient but not necessary condition for conflict-serializability. In the absence of extra information about the order in which items are accessed, however, 2PL is necessary: there is always a transaction that follows 2PL for which 2PL is required.',
    topic: 'Serializability',
    subtopic: 'Limits of 2PL',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'hard-12',
    prompt: 'Two transactions both read item A and then both write item A while following 2PL. What is the most likely outcome in a real system?',
    options: [
      { id: 'a', text: 'Both writes succeed, because the S-locks they hold are compatible' },
      { id: 'b', text: 'The second upgrade blocks and, if the first transaction also waits, a deadlock occurs' },
      { id: 'c', text: 'One of the transactions is silently rolled back' },
      { id: 'd', text: 'The scheduler grants both X-locks because the items are the same' }
    ],
    correct: ['b'],
    explanation: 'The X-lock each transaction needs conflicts with the other transaction\'s S-lock, so both upgrades queue. If both transactions wait for each other, the wait-for graph contains a cycle and the system reports a deadlock — the classic upgrade deadlock.',
    topic: 'Deadlock',
    subtopic: 'Lock upgrade deadlock',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'hard-13',
    prompt: 'A transaction acquires S(A), then S(B), then X(C). Which statement about its phases is correct?',
    options: [
      { id: 'a', text: 'It is still in the growing phase until it releases its first lock' },
      { id: 'b', text: 'It is in the growing phase, and its lock point is reached when X(C) is acquired' },
      { id: 'c', text: 'It has already entered the shrinking phase after taking S(B)' },
      { id: 'd', text: 'It has violated the protocol because it holds three locks' }
    ],
    correct: ['b'],
    explanation: 'Acquiring only grows the set of held locks, so the transaction is still in the growing phase. Its lock point is the moment X(C) is taken, because from then on it may not acquire anything else.',
    topic: 'Two-Phase Locking',
    subtopic: 'Lock point',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'hard-14',
    prompt: 'Which statement about strict 2PL and rigorous 2PL is correct?',
    options: [
      { id: 'a', text: 'Strict 2PL holds X-locks until commit; rigorous 2PL holds all locks until commit and lets transactions be serialised in commit order' },
      { id: 'b', text: 'They are the same protocol with different names' },
      { id: 'c', text: 'Rigorous 2PL only holds X-locks; strict 2PL holds all locks' },
      { id: 'd', text: 'Strict 2PL prevents deadlocks, rigorous 2PL does not' }
    ],
    correct: ['a'],
    explanation: 'Strict 2PL requires X-locks to be held until commit, while rigorous 2PL extends that to shared locks as well. Neither of them prevents deadlocks — only conservative 2PL (or a fixed lock order) does.',
    topic: 'Two-Phase Locking',
    subtopic: '2PL variants',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'hard-15',
    prompt: 'A transaction that follows 2PL has released one lock and now requests another. In this simulator, what exactly happens?',
    options: [
      { id: 'a', text: 'The request is queued and the transaction keeps waiting' },
      { id: 'b', text: 'The transaction is aborted, all of its locks are released, and the wait queues are re-processed' },
      { id: 'c', text: 'The transaction is allowed to continue but is flagged as unsafe' },
      { id: 'd', text: 'The whole schedule is rolled back' }
    ],
    correct: ['b'],
    explanation: 'The simulator treats a 2PL violation as fatal for that transaction: it aborts it, releases every lock it holds and re-processes the wait queues, so the other transactions can continue.',
    topic: 'Two-Phase Locking',
    subtopic: 'Protocol violations',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },

  /* ── Deadlock ────────────────────────────────────────────────── */
  {
    id: 'hard-16',
    prompt: 'The wait-for graph contains the edges T1 → T2, T2 → T3 and T3 → T1. What is the correct interpretation?',
    options: [
      { id: 'a', text: 'Three transactions are deadlocked and one of them must be aborted' },
      { id: 'b', text: 'Two independent deadlocks exist' },
      { id: 'c', text: 'The graph is acyclic, so the system is deadlock-free' },
      { id: 'd', text: 'A fourth transaction must join the cycle' }
    ],
    correct: ['a'],
    explanation: 'The three edges form a single cycle T1 → T2 → T3 → T1, so all three transactions are waiting for one another. Aborting any one of them releases its locks and breaks the cycle.',
    topic: 'Deadlock',
    subtopic: 'Wait-for graphs',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'hard-17',
    prompt: 'A transaction waits for a lock that it already holds itself (an upgrade request). How does the wait-for graph treat this?',
    options: [
      { id: 'a', text: 'It records a self-edge, which is not a deadlock on its own' },
      { id: 'b', text: 'It records no edge, because a transaction never waits for itself' },
      { id: 'c', text: 'It immediately declares a deadlock' },
      { id: 'd', text: 'It aborts the transaction' }
    ],
    correct: ['a'],
    explanation: 'The simulator only creates edges between different transactions, so an upgrade that waits for the transaction\'s own S-lock does not by itself create a cycle. It becomes a deadlock only when another transaction is waiting for the same item.',
    topic: 'Deadlock',
    subtopic: 'Wait-for graphs',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'hard-18',
    prompt: 'Which deadlock-handling strategy describes the behaviour of this simulator?',
    options: [
      { id: 'a', text: 'Detection and resolution — a cycle is detected and the user chooses a victim to abort' },
      { id: 'b', text: 'Prevention — a transaction is refused a lock as soon as a cycle would form' },
      { id: 'c', text: 'Avoidance — the scheduler keeps the system in a safe state using the Banker\'s algorithm' },
      { id: 'd', text: 'Timeout — a waiting transaction is aborted after a fixed delay' }
    ],
    correct: ['a'],
    explanation: 'The simulator runs the schedule, detects the cycle in the wait-for graph and then asks the user to pick a transaction to abort. Aborting releases its locks and breaks the cycle.',
    topic: 'Deadlock',
    subtopic: 'Prevention vs avoidance vs detection',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'hard-19',
    prompt: 'Why does aborting a deadlock victim break the cycle?',
    options: [
      { id: 'a', text: 'Because the victim\'s locks are released, so the transactions waiting for those locks can proceed' },
      { id: 'b', text: 'Because the victim is removed from the wait-for graph, which removes all edges' },
      { id: 'c', text: 'Because the scheduler then grants every queued request' },
      { id: 'd', text: 'Because the victim restarts and takes a lower priority' }
    ],
    correct: ['a'],
    explanation: 'The victim rolls back and gives back every lock it held. The transaction that was waiting for one of those locks is then granted it and can continue, so the cycle no longer exists.',
    topic: 'Deadlock',
    subtopic: 'Deadlock resolution',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'hard-20',
    prompt: 'In the Wound-Wait scheme, T1 (older) requests a lock held by T2 (younger). What happens?',
    options: [
      { id: 'a', text: 'T1 waits for T2' },
      { id: 'b', text: 'T2 is aborted so that T1 can proceed' },
      { id: 'c', text: 'Both are aborted' },
      { id: 'd', text: 'T1 is aborted so that T2 can proceed' }
    ],
    correct: ['b'],
    explanation: 'In Wound-Wait the older transaction always wins: it "wounds" the younger one by aborting it and taking the lock. The older transaction itself never has to wait, so it is never aborted.',
    topic: 'Deadlock',
    subtopic: 'Deadlock prevention',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'hard-21',
    prompt: 'A deadlock cycle contains T1, T2 and T3. What is the minimum number of transactions that must be aborted to make progress possible?',
    options: [
      { id: 'a', text: 'One — aborting any member of the cycle breaks it' },
      { id: 'b', text: 'Two — the cycle must be broken at two points' },
      { id: 'c', text: 'Three — every transaction in the cycle has to go' },
      { id: 'd', text: 'None — the system can resolve it on its own' }
    ],
    correct: ['a'],
    explanation: 'Aborting one transaction releases its locks, which lets the next transaction in the cycle proceed and eventually release its own locks. One abort is enough to dissolve the whole cycle.',
    topic: 'Deadlock',
    subtopic: 'Deadlock resolution',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'hard-22',
    prompt: 'Which of the following is a valid strategy for preventing deadlocks in a locking system?',
    options: [
      { id: 'a', text: 'Require all transactions to lock items in a fixed global order' },
      { id: 'b', text: 'Allow a transaction to hold at most one lock at a time' },
      { id: 'c', text: 'Never release a lock before the commit (that is, use strict 2PL)' },
      { id: 'd', text: 'Give every transaction a unique identifier' }
    ],
    correct: ['a'],
    explanation: 'A fixed global order makes a circular wait impossible, because the chain of "waiting for" can never close into a loop. Option B is impractical, option C is strict 2PL, which still allows deadlocks, and option D has no effect on waiting at all.',
    topic: 'Deadlock',
    subtopic: 'Deadlock prevention',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'hard-23',
    prompt: 'A system uses strict 2PL and a transaction is starved: it repeatedly waits behind others. Why can this happen even though strict 2PL holds X-locks until commit?',
    options: [
      { id: 'a', text: 'Strict 2PL controls deadlocks, not starvation; the wait queues are still served in order, so a transaction can keep losing the race' },
      { id: 'b', text: 'It cannot happen — holding X-locks until commit rules out starvation' },
      { id: 'c', text: 'Because strict 2PL only holds shared locks until commit' },
      { id: 'd', text: 'Because starvation is a special case of deadlock' }
    ],
    correct: ['a'],
    explanation: 'Holding X-locks until commit removes the cascading-abort problem but says nothing about fairness. A transaction can still be overtaken indefinitely if other transactions keep arriving with earlier requests.',
    topic: 'Concurrency Control',
    subtopic: 'Starvation',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'hard-24',
    prompt: 'Why does conservative 2PL remain deadlock-free even when two transactions need the same two items in opposite orders?',
    options: [
      { id: 'a', text: 'Because a transaction waits for all of its locks before it holds any of them, so a cycle of "holds one, waits for another" cannot form' },
      { id: 'b', text: 'Because conservative 2PL always locks the items in increasing address order' },
      { id: 'c', text: 'Because conservative 2PL never uses exclusive locks' },
      { id: 'd', text: 'Because conservative 2PL aborts a transaction as soon as a conflict occurs' }
    ],
    correct: ['a'],
    explanation: 'The deadlock-freedom comes from the hold-and-wait condition being removed, not from any particular lock order. Locking in a fixed order is an additional technique that works with ordinary 2PL as well.',
    topic: 'Deadlock',
    subtopic: 'Deadlock prevention',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'hard-25',
    prompt: 'The simulator detects a deadlock and you abort a victim. Which statement describes the resulting wait-for graph?',
    options: [
      { id: 'a', text: 'The victim\'s outgoing edges disappear because it no longer waits, and its incoming edges disappear because it no longer holds locks' },
      { id: 'b', text: 'Only the victim\'s outgoing edges disappear' },
      { id: 'c', text: 'The graph is rebuilt from scratch and is always empty' },
      { id: 'd', text: 'The edges of the other transactions are redirected to the victim' }
    ],
    correct: ['a'],
    explanation: 'Aborting the victim removes it from the wait queues and releases its locks, so the transactions that were waiting on it are granted their locks and the graph is rebuilt without the cycle.',
    topic: 'Deadlock',
    subtopic: 'Wait-for graphs',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },

  /* ── Serializability ─────────────────────────────────────────── */
  {
    id: 'hard-26',
    prompt: 'Consider the schedule: r1(X); r2(X); w1(X); r2(Y); w1(Y); commit1; commit2. Which statement is correct?',
    options: [
      { id: 'a', text: 'It is not conflict-serializable, because the two writes on X conflict' },
      { id: 'b', text: 'It is conflict-serializable — every conflict edge points from T2 to T1' },
      { id: 'c', text: 'It is conflict-serializable, because the transactions commit in order' },
      { id: 'd', text: 'It cannot be evaluated without knowing the initial values of X and Y' }
    ],
    correct: ['b'],
    explanation: 'On X, r2(X) comes before w1(X), giving the edge T2 → T1; on Y, r2(Y) comes before w1(Y), giving T2 → T1 again. The two reads of X do not conflict, and both writes belong to T1. Every edge therefore points the same way, so the graph is acyclic and the schedule is equivalent to running T2 and then T1.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'hard-27',
    prompt: 'Consider the schedule: r1(A); r2(A); w1(A); w2(A). Which anomalies does it exhibit?',
    options: [
      { id: 'a', text: 'It is not conflict-serializable and it shows the lost update problem' },
      { id: 'b', text: 'It is conflict-serializable and shows no anomaly' },
      { id: 'c', text: 'It is conflict-serializable but shows a dirty read' },
      { id: 'd', text: 'It shows a phantom but is conflict-serializable' }
    ],
    correct: ['a'],
    explanation: 'Both transactions read the old value of A and then write their own value, so the second write discards the first — the lost update. The precedence graph has the cycle T1 → T2 → T1, so the schedule is not conflict-serializable.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 3 Lock Compatibility Matrix'
  },
  {
    id: 'hard-28',
    prompt: 'A schedule is conflict-serializable but a transaction reads a value that another transaction later rolls back. Which statement is correct?',
    options: [
      { id: 'a', text: 'The schedule is conflict-serializable but not recoverable, so strict 2PL would be needed to avoid it' },
      { id: 'b', text: 'Such a schedule cannot exist' },
      { id: 'c', text: 'The schedule is recoverable because it is serializable' },
      { id: 'd', text: 'The schedule must contain a cycle in the precedence graph' }
    ],
    correct: ['a'],
    explanation: 'Serializability and recoverability are independent properties. Basic 2PL allows an X-lock to be released early, so a reader can pick up uncommitted data that is later rolled back. Holding X-locks until commit (strict 2PL) removes this possibility.',
    topic: 'Transactions',
    subtopic: 'Recoverability',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'hard-29',
    prompt: 'Why is testing view-serializability considered computationally hard?',
    options: [
      { id: 'a', text: 'Because it requires checking the initial reads and the final writes of the schedule against every possible serial order' },
      { id: 'b', text: 'Because view-serializability cannot be decided for schedules with more than two transactions' },
      { id: 'c', text: 'Because the view-serializability test requires the lock table' },
      { id: 'd', text: 'Because view-serializability is stronger than conflict-serializability' }
    ],
    correct: ['a'],
    explanation: 'The test involves checking all n! serial orders, which is exponential in the number of transactions. The precedence-graph test for conflict-serializability is polynomial, which is why it is the one used in practice.',
    topic: 'Serializability',
    subtopic: 'View serializability',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'hard-30',
    prompt: 'Which statement about blind writes is correct?',
    options: [
      { id: 'a', text: 'A blind write is a write without a preceding read, and a schedule of blind writes can still be conflict-serializable' },
      { id: 'b', text: 'A blind write always makes a schedule non-serializable' },
      { id: 'c', text: 'A blind write is only allowed under strict 2PL' },
      { id: 'd', text: 'A blind write requires an intention lock' }
    ],
    correct: ['a'],
    explanation: 'Writing an item without reading it first is a blind write. The conflict definition only cares about the order of the operations, so a schedule consisting of blind writes can still be conflict-serializable.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'hard-31',
    prompt: 'Which of the following schedules is conflict-serializable?\nS1: r1(X); r2(X); w1(X); w2(X)\nS2: r1(X); w1(X); r2(X); w2(X)\nS3: r1(X); r2(Y); w1(Y); w2(X)',
    options: [
      { id: 'a', text: 'S2 and S3' },
      { id: 'b', text: 'Only S2' },
      { id: 'c', text: 'None of them' },
      { id: 'd', text: 'All three' }
    ],
    correct: ['b'],
    explanation: 'S1 has the cycle T1 → T2 → T1 (r1(X) before w2(X) and r2(X) before w1(X)). In S2 all conflicting pairs are ordered T1 before T2, so the graph is acyclic. S3 has r2(Y) before w1(Y) giving T2 → T1 and r1(X) before w2(X) giving T1 → T2, so it also has a cycle.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'hard-32',
    prompt: 'The two-phase locking theorem states that:',
    options: [
      { id: 'a', text: 'Every schedule produced by 2PL is conflict-serializable, and in the absence of extra information 2PL is necessary for conflict-serializability' },
      { id: 'b', text: 'Every conflict-serializable schedule is produced by 2PL' },
      { id: 'c', text: '2PL produces only recoverable schedules' },
      { id: 'd', text: '2PL guarantees that no transaction ever waits' }
    ],
    correct: ['a'],
    explanation: 'The theorem has two halves: 2PL is sufficient for conflict-serializability, and — without extra information about the order of item accesses — it is also necessary in the sense that for every non-2PL transaction there is a schedule for which 2PL is needed.',
    topic: 'Two-Phase Locking',
    subtopic: 'Correctness of 2PL',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'hard-33',
    prompt: 'A schedule is serializable but not conflict-serializable. What does that tell you?',
    options: [
      { id: 'a', text: 'It is view-serializable only, and the schedule needs additional information (such as the order of item accesses) to be analysed with a graph' },
      { id: 'b', text: 'It must contain a cycle in its precedence graph' },
      { id: 'c', text: 'It cannot be produced by any locking protocol at all' },
      { id: 'd', text: 'It is not recoverable' }
    ],
    correct: ['a'],
    explanation: 'View-serializable but not conflict-serializable schedules exist; the precedence-graph test does not classify them, which is why view-serializability is tested by an exponential procedure instead. Such schedules are the reason for the "in the absence of extra information" qualification in the 2PL theorem.',
    topic: 'Serializability',
    subtopic: 'View serializability',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'hard-34',
    prompt: 'Which statement about serializing a 2PL schedule by lock points is correct?',
    options: [
      { id: 'a', text: 'The transactions ordered by their lock points form a serial schedule equivalent to the original one' },
      { id: 'b', text: 'The transactions ordered by their commit times form a serial schedule' },
      { id: 'c', text: 'The transactions ordered alphabetically form a serial schedule' },
      { id: 'd', text: 'No serial schedule is equivalent to a 2PL schedule' }
    ],
    correct: ['a'],
    explanation: 'A transaction that has reached its lock point holds all of its locks, so no other transaction can perform a conflicting operation until it releases them. Ordering by lock point therefore yields an equivalent serial schedule.',
    topic: 'Two-Phase Locking',
    subtopic: 'Correctness of 2PL',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'hard-35',
    prompt: 'In the precedence graph, an edge Ti → Tj is added when Ti reads or writes an item before Tj writes it. Why is the "before" relation so important?',
    options: [
      { id: 'a', text: 'The edges capture the order in which the transactions must appear in any equivalent serial schedule' },
      { id: 'b', text: 'The edges determine the lock order each transaction must follow' },
      { id: 'c', text: 'The edges show which transaction will be the deadlock victim' },
      { id: 'd', text: 'The edges are used to compute the waiting time of each transaction' }
    ],
    correct: ['a'],
    explanation: 'Each edge is a constraint on the serial order: Ti must come before Tj. A cycle therefore means no serial order can satisfy all the constraints, which is precisely what makes a schedule non-serializable.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'hard-36',
    prompt: 'A schedule is found to be conflict-serializable. Which of the following does NOT follow?',
    options: [
      { id: 'a', text: 'The schedule is deadlock-free' },
      { id: 'b', text: 'The schedule is view-serializable' },
      { id: 'c', text: 'The schedule is equivalent to some serial schedule' },
      { id: 'd', text: 'The schedule follows the two-phase locking protocol' }
    ],
    correct: ['a'],
    explanation: 'Serializability is a property of the result, deadlock-freedom is a property of the execution. A schedule can be perfectly serializable and still deadlock (the simulator detects deadlocks in perfectly ordered 2PL schedules). The other three statements do follow.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'hard-37',
    prompt: 'Consider the schedule: r1(A); w1(A); commit1; r2(A); w2(A); commit2. Which statement is correct?',
    options: [
      { id: 'a', text: 'It is conflict-serializable — the only conflict is r1(A) before w2(A), giving the single edge T1 → T2' },
      { id: 'b', text: 'It is not conflict-serializable, because the two writes conflict' },
      { id: 'c', text: 'It is not conflict-serializable, because both transactions read A' },
      { id: 'd', text: 'It is not serializable, because T1 commits before T2 reads' }
    ],
    correct: ['a'],
    explanation: 'The two writes on A are in different transactions and conflict, but they are ordered T1 then T2, which gives the single edge T1 → T2. A graph with one edge has no cycle, so the schedule is conflict-serializable — equivalent to running T1 and then T2.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },

  /* ── Transactions ────────────────────────────────────────────── */
  {
    id: 'hard-38',
    prompt: 'T1 writes A, T2 reads A and commits, and T1 then aborts. What has happened, and which property is violated?',
    options: [
      { id: 'a', text: 'A cascading rollback is required — T2 committed on data that was rolled back, so the schedule is not recoverable' },
      { id: 'b', text: 'Nothing — T2 committed before the abort, so the schedule is recoverable' },
      { id: 'c', text: 'Only T1 has to be rolled back, so the schedule is recoverable' },
      { id: 'd', text: 'The schedule is not serializable' }
    ],
    correct: ['a'],
    explanation: 'T2 committed after reading a value that was later rolled back, so the committed state of the database is wrong. The schedule is unrecoverable and a cascading rollback of T2 would be required. Strict 2PL prevents the situation because the X-lock on A is held until commit.',
    topic: 'Transactions',
    subtopic: 'Recoverability',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'hard-39',
    prompt: 'Which of the following schedules is cascadeless?\nS1: r1(A); w2(A); w1(A)\nS2: r1(A); w2(A); c1; c2\nS3: w1(A); c1; r2(A); w2(A); c2',
    options: [
      { id: 'a', text: 'S3 — no transaction ever reads a value written by a transaction that has not committed' },
      { id: 'b', text: 'All three' },
      { id: 'c', text: 'None of them' },
      { id: 'd', text: 'S1 and S3' }
    ],
    correct: ['a'],
    explanation: 'A schedule is cascadeless if no transaction reads data written by a transaction that has not yet committed. In S1 and S2, r1(A) reads the value written by w2(A) before T2 commits, so both are cascadeless-violating. In S3, T1 commits before T2 reads A, so no uncommitted value is ever read.',
    topic: 'Transactions',
    subtopic: 'Recoverability',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'hard-40',
    prompt: 'What does the "Durability" property require of the recovery system?',
    options: [
      { id: 'a', text: 'That the effects of a committed transaction survive a crash, so the log must be written to stable storage before the commit is acknowledged' },
      { id: 'b', text: 'That an aborted transaction leaves no trace in the log' },
      { id: 'c', text: 'That the log is truncated after every checkpoint' },
      { id: 'd', text: 'That transactions are recovered in the order in which they started' }
    ],
    correct: ['a'],
    explanation: 'Durability is implemented by the write-ahead logging rule: the log records are flushed to stable storage before the commit record is acknowledged, so the undo/redo information needed to restore committed work is always available after a crash.',
    topic: 'Transactions',
    subtopic: 'ACID properties',
    reference: 'Learn § 2.2 What is a Transaction?'
  },
  {
    id: 'hard-41',
    prompt: 'Why can a schedule that is not recoverable still be conflict-serializable?',
    options: [
      { id: 'a', text: 'Serializability is about the result of the schedule, while recoverability is about what happens after a failure — they are independent properties' },
      { id: 'b', text: 'Because an unrecoverable schedule never contains a cycle' },
      { id: 'c', text: 'Because recoverability only concerns shared locks' },
      { id: 'd', text: 'They cannot be independent — the two properties are equivalent' }
    ],
    correct: ['a'],
    explanation: 'The properties are tested differently and one does not imply the other. Strict 2PL is what gives both at the same time: conflict-serializability from the 2PL rule and recoverability from holding X-locks until commit.',
    topic: 'Transactions',
    subtopic: 'Recoverability',
    reference: 'Learn § 2.2 What is a Transaction?'
  },
  {
    id: 'hard-42',
    prompt: 'A transaction has written to the log but the crash happens before the commit record is written. What does recovery do?',
    options: [
      { id: 'a', text: 'It undoes the transaction, because there is no commit record for it' },
      { id: 'b', text: 'It redoes the transaction, because the log records are present' },
      { id: 'c', text: 'It ignores the transaction completely' },
      { id: 'd', text: 'It commits the transaction, because the data pages were already written' }
    ],
    correct: ['a'],
    explanation: 'Recovery undoes every transaction that has no commit record and redoes every transaction that has one. The presence of update records alone does not mean the transaction committed.',
    topic: 'Transactions',
    subtopic: 'Recovery and logging',
    reference: 'Learn § 2.2 What is a Transaction?'
  },
  {
    id: 'hard-43',
    prompt: 'Which statement about an irrecoverable schedule is correct?',
    options: [
      { id: 'a', text: 'It contains a transaction that has read uncommitted data, so no cascading rollback can restore a correct state' },
      { id: 'b', text: 'It is a schedule that cannot be recovered because the log is full' },
      { id: 'c', text: 'It is a schedule in which every transaction aborts' },
      { id: 'd', text: 'It is a schedule that uses only shared locks' }
    ],
    correct: ['a'],
    explanation: 'In an irrecoverable schedule a transaction that has already committed depends on data from a transaction that later aborted. The committed work cannot be undone safely, so the schedule cannot be recovered by cascading rollbacks.',
    topic: 'Transactions',
    subtopic: 'Recoverability',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'hard-44',
    prompt: 'Which statement about the transaction status in this simulator is correct?',
    options: [
      { id: 'a', text: 'An aborted transaction releases all of its locks, and operations scheduled after the abort are ignored' },
      { id: 'b', text: 'An aborted transaction keeps its locks until the end of the schedule so that it can be retried' },
      { id: 'c', text: 'An aborted transaction releases only the locks it acquired after the last commit point' },
      { id: 'd', text: 'An aborted transaction keeps its shared locks but releases its exclusive ones' }
    ],
    correct: ['a'],
    explanation: 'Abort behaves like commit for the lock manager: every lock is released and the wait queues are re-processed. Later operations of the aborted transaction are simply ignored, which the transaction column view shows as "Ignored".',
    topic: 'Transactions',
    subtopic: 'Commit and abort behaviour',
    reference: 'Learn § 2.2 What is a Transaction?'
  },

  /* ── Concurrency Control ─────────────────────────────────────── */
  {
    id: 'hard-45',
    prompt: 'Which statement about timestamp ordering is correct?',
    options: [
      { id: 'a', text: 'It is conflict-serializable and deadlock-free, because transactions never wait for one another' },
      { id: 'b', text: 'It is conflict-serializable but can deadlock' },
      { id: 'c', text: 'It is not serializable, but it never aborts a transaction' },
      { id: 'd', text: 'It is only usable in single-transaction workloads' }
    ],
    correct: ['a'],
    explanation: 'Timestamp ordering aborts a transaction whose operation would break the timestamp order rather than blocking it, so no cycle of waiting can form, and the resulting schedule is conflict-serializable.',
    topic: 'Concurrency Control',
    subtopic: 'Timestamp ordering',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'hard-46',
    prompt: 'What is the purpose of Thomas\' write rule in timestamp ordering?',
    options: [
      { id: 'a', text: 'To allow a write to an item that no other transaction has read yet, instead of aborting the writer' },
      { id: 'b', text: 'To break deadlocks by aborting the younger transaction' },
      { id: 'c', text: 'To release the locks of a committed transaction earlier' },
      { id: 'd', text: 'To guarantee that the timestamp order never changes' }
    ],
    correct: ['a'],
    explanation: 'With basic timestamp ordering a write must be rejected if the item was read by a younger transaction, because that would change the required timestamp order. Thomas\' rule observes that such a write is harmless — no future transaction may read it — so it can be ignored instead of aborting the writer.',
    topic: 'Concurrency Control',
    subtopic: 'Timestamp ordering',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'hard-47',
    prompt: 'In basic timestamp ordering, what happens if T1 (older) writes an item that T2 (younger) has already read?',
    options: [
      { id: 'a', text: 'T1 must be aborted, because the write would change the required timestamp order' },
      { id: 'b', text: 'T1 is allowed to write, because reads do not conflict with writes' },
      { id: 'c', text: 'T2 is aborted and the write proceeds' },
      { id: 'd', text: 'Both transactions wait until the other commits' }
    ],
    correct: ['a'],
    explanation: 'Because T2 has already seen the old value, letting T1 write would break the serial order implied by the timestamps, so basic timestamp ordering aborts T1. Thomas\' write rule relaxes this exactly for blind writes.',
    topic: 'Concurrency Control',
    subtopic: 'Timestamp ordering',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'hard-48',
    prompt: 'Which statement about the difference between blocking and non-blocking concurrency control is correct?',
    options: [
      { id: 'a', text: 'Blocking protocols wait for a conflicting lock to be released; non-blocking protocols abort the offending transaction instead' },
      { id: 'b', text: 'Blocking protocols never abort, non-blocking protocols never wait' },
      { id: 'c', text: 'They are two names for the same idea' },
      { id: 'd', text: 'Non-blocking protocols cannot guarantee serializability' }
    ],
    correct: ['a'],
    explanation: 'Lock-based protocols such as 2PL are blocking: a conflicting request waits in the queue. Timestamp-based protocols are non-blocking: they reject the transaction immediately. That is why timestamp ordering cannot deadlock.',
    topic: 'Concurrency Control',
    subtopic: 'Blocking vs non-blocking concurrency control',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'hard-49',
    prompt: 'A system uses MVCC and a long-running report query runs while other transactions update the same rows. Why does the report still see a consistent snapshot?',
    options: [
      { id: 'a', text: 'Because each transaction reads the version of the row that was current when the transaction started, and updates create new versions instead of overwriting old ones' },
      { id: 'b', text: 'Because the report query takes an exclusive lock on every row it reads' },
      { id: 'c', text: 'Because the updates are buffered until the report finishes' },
      { id: 'd', text: 'Because MVCC disables the isolation levels' }
    ],
    correct: ['a'],
    explanation: 'MVCC keeps the old versions of the rows, so a reader can be served the version that was valid at the start of its transaction while writers create new versions. This is why readers do not block writers in MVCC systems.',
    topic: 'Concurrency Control',
    subtopic: 'MVCC',
    reference: 'Learn § 7 Real-World Use Cases'
  },
  {
    id: 'hard-50',
    prompt: 'A schedule follows 2PL and its precedence graph is acyclic, yet the system reports a deadlock. How can that be?',
    options: [
      { id: 'a', text: 'Serializability and deadlock-freedom are independent: 2PL guarantees a serializable result but still lets transactions wait for each other' },
      { id: 'b', text: 'It is impossible — an acyclic precedence graph proves deadlock-freedom' },
      { id: 'c', text: 'The deadlock report must come from a different transaction' },
      { id: 'd', text: 'A cycle in the precedence graph was missed by the algorithm' }
    ],
    correct: ['a'],
    explanation: 'The precedence graph describes the order of conflicting operations; the wait-for graph describes who is waiting for which lock. A schedule can be perfectly serializable and still contain a cycle in the wait-for graph — which is exactly the deadlock the simulator reports.',
    topic: 'Deadlock',
    subtopic: 'Deadlock detection',
    reference: 'Learn § 5 Deadlock Theory'
  }
];
