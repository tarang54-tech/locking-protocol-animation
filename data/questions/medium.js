/**
 * data/questions/medium.js — MEDIUM questions (50).
 *
 * "Medium" describes the intrinsic difficulty of the question itself: it
 * needs a rule plus one step of reasoning, or the application of a protocol
 * rule to a concrete scenario. The topics are deliberately mixed — a medium
 * question may be about lock basics and a hard question may be about the
 * growing and shrinking phases.
 */
module.exports = [
  /* ── Lock Basics ─────────────────────────────────────────────── */
  {
    id: 'medium-01',
    prompt: 'When can a transaction upgrade an S-lock on item A into an X-lock?',
    options: [
      { id: 'a', text: 'Whenever it wants to write A' },
      { id: 'b', text: 'Only when no other transaction holds any lock on A' },
      { id: 'c', text: 'Only when the transaction is the only holder of an S-lock on A' },
      { id: 'd', text: 'Only after the shrinking phase has begun' }
    ],
    correct: ['c'],
    explanation: 'An upgrade can only be granted if the requester already holds the item and no other transaction holds a conflicting lock. Otherwise the upgrade is queued just like any other request.',
    topic: 'Lock Basics',
    subtopic: 'Lock upgrades',
    reference: 'Learn § 3 Lock Compatibility Matrix'
  },
  {
    id: 'medium-02',
    prompt: 'Which of the following is a legal lock conversion?',
    options: [
      { id: 'a', text: 'S-lock → X-lock (upgrade)' },
      { id: 'b', text: 'X-lock → S-lock (downgrade)' },
      { id: 'c', text: 'S-lock → no lock, and then X-lock on the same item' },
      { id: 'd', text: 'X-lock → X-lock on a different item' }
    ],
    correct: ['a', 'b'],
    multi: true,
    explanation: 'Both an upgrade (S → X) and a downgrade (X → S) are legal conversions. Option C is not: releasing the lock and taking a new one would count as acquiring a lock after a release, which breaks 2PL.',
    topic: 'Lock Basics',
    subtopic: 'Lock upgrades and downgrades',
    reference: 'Learn § 12 Technical Implementation'
  },
  {
    id: 'medium-03',
    prompt: 'T1 holds an X-lock on A. T2 requests an S-lock on A and is queued. What happens when T1 commits?',
    options: [
      { id: 'a', text: 'T2 is granted the S-lock on A' },
      { id: 'b', text: 'T2 is aborted because it waited too long' },
      { id: 'c', text: 'Nothing happens until T2 requests the lock again' },
      { id: 'd', text: 'T2 is granted an X-lock instead' }
    ],
    correct: ['a'],
    explanation: 'T1 releases every lock on commit, and the wait queues are then re-processed, so the queued S-lock request on A is granted to T2.',
    topic: 'Lock Basics',
    subtopic: 'Wait queues',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-04',
    prompt: 'T1 holds an X-lock on A and T2 holds an X-lock on B. T1 requests an S-lock on B. What is the result?',
    options: [
      { id: 'a', text: 'The request is granted because T1 and T2 are different transactions' },
      { id: 'b', text: 'T1 waits until T2 releases B' },
      { id: 'c', text: 'T2 is aborted so that T1 can proceed' },
      { id: 'd', text: 'Both transactions are aborted' }
    ],
    correct: ['b'],
    explanation: 'An X-lock conflicts with every other lock on the same item, so T1 must wait for T2 to release B. There is no deadlock here, because T2 is not waiting for T1.',
    topic: 'Lock Basics',
    subtopic: 'Lock compatibility matrix',
    reference: 'Learn § 3 Lock Compatibility Matrix'
  },
  {
    id: 'medium-05',
    prompt: 'T1 and T2 both hold a shared (S) lock on item A. T1 then requests an X-lock on A. What happens?',
    options: [
      { id: 'a', text: 'T1 gets the X-lock immediately because it already holds a lock on A' },
      { id: 'b', text: 'T1 waits until T2 releases its S-lock on A' },
      { id: 'c', text: 'T1 and T2 both get an X-lock on A' },
      { id: 'd', text: 'T2 is forced to release its lock so that T1 can proceed' }
    ],
    correct: ['b'],
    explanation: 'T2\'s S-lock conflicts with the X-lock T1 needs, so the upgrade is queued. T2 keeps its S-lock until it commits or releases it.',
    topic: 'Lock Basics',
    subtopic: 'Lock upgrades',
    reference: 'Learn § 3 Lock Compatibility Matrix'
  },
  {
    id: 'medium-06',
    prompt: 'Can a single transaction hold both a shared and an exclusive lock on the same item at the same time?',
    options: [
      { id: 'a', text: 'Yes — the two lock types are independent' },
      { id: 'b', text: 'No — a transaction holds one lock per item; an upgrade replaces the S-lock with the X-lock' },
      { id: 'c', text: 'Yes, but only during the shrinking phase' },
      { id: 'd', text: 'Yes, but only if the item was never written' }
    ],
    correct: ['b'],
    explanation: 'The lock table records one entry per transaction and item. Upgrading replaces the stored lock type, so the transaction ends up holding only the X-lock.',
    topic: 'Lock Basics',
    subtopic: 'Lock table structure',
    reference: 'Learn § 12 Technical Implementation'
  },
  {
    id: 'medium-07',
    prompt: 'Which pair of lock types is compatible?',
    options: [
      { id: 'a', text: 'Shared (S) and Exclusive (X)' },
      { id: 'b', text: 'Exclusive (X) and Exclusive (X)' },
      { id: 'c', text: 'Shared (S) and Shared (S)' },
      { id: 'd', text: 'None of them are compatible' }
    ],
    correct: ['c'],
    explanation: 'S/S is the only compatible pair. Every other combination contains an X-lock, and an X-lock conflicts with everything on the same item.',
    topic: 'Lock Basics',
    subtopic: 'Lock compatibility matrix',
    reference: 'Learn § 3 Lock Compatibility Matrix'
  },
  {
    id: 'medium-08',
    prompt: 'Why do real database systems add intention locks (IS, IX, SIX) to the basic S and X locks?',
    options: [
      { id: 'a', text: 'To allow several transactions to hold X-locks on the same item' },
      { id: 'b', text: 'To support multiple-granularity locking without checking every descendant node' },
      { id: 'c', text: 'To replace the need for two-phase locking' },
      { id: 'd', text: 'To make deadlock detection unnecessary' }
    ],
    correct: ['b'],
    explanation: 'An intention lock signals that a node of the lock hierarchy is locked in a stronger mode lower down, so a lock on an ancestor can be granted without inspecting the whole subtree. Intention locks do not replace 2PL and do not remove the need for deadlock handling.',
    topic: 'Lock Basics',
    subtopic: 'Multiple granularity locking',
    reference: 'Learn § 12 Technical Implementation'
  },

  /* ── Two-Phase Locking ───────────────────────────────────────── */
  {
    id: 'medium-09',
    prompt: 'Which locks does Strict 2PL hold until the transaction commits or aborts?',
    options: [
      { id: 'a', text: 'Only the shared (S) locks' },
      { id: 'b', text: 'Only the exclusive (X) locks' },
      { id: 'c', text: 'Both S and X locks' },
      { id: 'd', text: 'No locks are held until commit' }
    ],
    correct: ['b'],
    explanation: 'Strict 2PL requires every X-lock to be held until commit or abort, which prevents other transactions from reading uncommitted data and therefore prevents cascading rollbacks.',
    topic: 'Two-Phase Locking',
    subtopic: 'Strict 2PL',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'medium-10',
    prompt: 'Which variant of 2PL holds ALL locks — shared and exclusive — until commit or abort?',
    options: [
      { id: 'a', text: 'Basic 2PL' },
      { id: 'b', text: 'Strict 2PL' },
      { id: 'c', text: 'Rigorous 2PL' },
      { id: 'd', text: 'Conservative 2PL' }
    ],
    correct: ['c'],
    explanation: 'Rigorous 2PL is the strictest of the three: every lock, S and X, is held until the transaction ends. As a result its transactions can be serialised in the order in which they commit.',
    topic: 'Two-Phase Locking',
    subtopic: 'Rigorous 2PL',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'medium-11',
    prompt: 'Which problem does Strict 2PL eliminate that Basic 2PL does not?',
    options: [
      { id: 'a', text: 'Deadlocks' },
      { id: 'b', text: 'Cascading rollbacks' },
      { id: 'c', text: 'Starvation' },
      { id: 'd', text: 'Lost updates' }
    ],
    correct: ['b'],
    explanation: 'Because X-locks are held until commit, no other transaction can read uncommitted data, so a rollback never forces a dependent transaction to roll back as well. Strict 2PL does not prevent deadlocks.',
    topic: 'Two-Phase Locking',
    subtopic: 'Strict 2PL',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'medium-12',
    prompt: 'Which 2PL variant acquires every lock a transaction will need before the transaction starts executing?',
    options: [
      { id: 'a', text: 'Basic 2PL' },
      { id: 'b', text: 'Strict 2PL' },
      { id: 'c', text: 'Rigorous 2PL' },
      { id: 'd', text: 'Conservative (static) 2PL' }
    ],
    correct: ['d'],
    explanation: 'Conservative 2PL pre-claims all locks. If any of them cannot be granted, the transaction never starts, which removes the hold-and-wait condition and therefore makes deadlocks impossible.',
    topic: 'Two-Phase Locking',
    subtopic: 'Conservative 2PL',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'medium-13',
    prompt: 'Why is Conservative 2PL deadlock-free?',
    options: [
      { id: 'a', text: 'Because it never uses shared locks' },
      { id: 'b', text: 'Because a transaction that is waiting for a lock holds none, so no cycle can form' },
      { id: 'c', text: 'Because it releases every lock immediately after use' },
      { id: 'd', text: 'Because it uses timestamps instead of queues' }
    ],
    correct: ['b'],
    explanation: 'Conservative 2PL removes the hold-and-wait condition: either a transaction has all of its locks or it has none and is still waiting to start. A circular wait therefore cannot be built.',
    topic: 'Two-Phase Locking',
    subtopic: 'Conservative 2PL',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'medium-14',
    prompt: 'Which 2PL variant allows transactions to be serialised in the order in which they commit?',
    options: [
      { id: 'a', text: 'Basic 2PL' },
      { id: 'b', text: 'Strict 2PL' },
      { id: 'c', text: 'Rigorous 2PL' },
      { id: 'd', text: 'Conservative 2PL' }
    ],
    correct: ['c'],
    explanation: 'Because Rigorous 2PL holds every lock until commit or abort, no transaction can interleave with another in a conflicting way, so the commit order is a valid serial order.',
    topic: 'Two-Phase Locking',
    subtopic: 'Rigorous 2PL',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'medium-15',
    prompt: 'Does Basic 2PL guarantee that a schedule is recoverable?',
    options: [
      { id: 'a', text: 'Yes — 2PL always prevents cascading rollbacks' },
      { id: 'b', text: 'No — an X-lock may be released before the commit, so a reader can pick up uncommitted data' },
      { id: 'c', text: 'Yes, provided no transaction aborts' },
      { id: 'd', text: 'Yes, because 2PL holds all locks until commit' }
    ],
    correct: ['b'],
    explanation: 'Basic 2PL may release an X-lock early, so another transaction can read data that is later rolled back. Strict 2PL is the variant that guarantees recoverability.',
    topic: 'Two-Phase Locking',
    subtopic: 'Cascading rollback',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'medium-16',
    prompt: 'Under Strict 2PL, T1 holds an X-lock on A and T2 requests an S-lock on A. What happens to T2?',
    options: [
      { id: 'a', text: 'T2 gets the S-lock, because shared and exclusive locks only conflict for writes' },
      { id: 'b', text: 'T2 waits until T1 commits or aborts' },
      { id: 'c', text: 'T1 is aborted so that T2 can read the item' },
      { id: 'd', text: 'T2 gets the S-lock but T1 is downgraded' }
    ],
    correct: ['b'],
    explanation: 'An X-lock conflicts with an S-lock, so T2 has to wait. Because T1 holds the X-lock until commit under strict 2PL, the wait ends only when T1 finishes.',
    topic: 'Two-Phase Locking',
    subtopic: 'Strict 2PL',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'medium-17',
    prompt: 'Under Rigorous 2PL, a transaction releases a shared (S) lock before it commits. What is the consequence?',
    options: [
      { id: 'a', text: 'Nothing — S-locks may always be released early' },
      { id: 'b', text: 'The transaction violates Rigorous 2PL and is aborted in this simulator' },
      { id: 'c', text: 'The lock is automatically re-acquired' },
      { id: 'd', text: 'The transaction simply moves to the shrinking phase' }
    ],
    correct: ['b'],
    explanation: 'Rigorous 2PL requires every lock, S included, to be held until commit or abort, so releasing early is a protocol violation and the simulator aborts the transaction.',
    topic: 'Two-Phase Locking',
    subtopic: 'Protocol violations',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'medium-18',
    prompt: 'A transaction takes S(A), releases it, and then takes S(B). Is this a valid basic-2PL transaction?',
    options: [
      { id: 'a', text: 'Yes — shared locks may be taken and released freely' },
      { id: 'b', text: 'No — the second acquisition happens in the shrinking phase and breaks the two-phase rule' },
      { id: 'c', text: 'Yes, as long as no X-lock is involved' },
      { id: 'd', text: 'Yes, because the transaction has not committed yet' }
    ],
    correct: ['b'],
    explanation: 'The first release starts the shrinking phase, and a new lock must never be taken afterwards. The resulting schedule is no longer guaranteed to be conflict-serializable.',
    topic: 'Two-Phase Locking',
    subtopic: 'Protocol violations',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'medium-19',
    prompt: 'Which statement about the shrinking phase and lock acquisition is correct?',
    options: [
      { id: 'a', text: 'A transaction in the shrinking phase may still take a lock it already holds' },
      { id: 'b', text: 'A transaction in the shrinking phase may not take any new lock' },
      { id: 'c', text: 'A transaction in the shrinking phase may take a new lock if it is a shared lock' },
      { id: 'd', text: 'A transaction in the shrinking phase may take a new lock if no other transaction is active' }
    ],
    correct: ['b'],
    explanation: 'Once the shrinking phase has started, the only permitted action is releasing locks. Even re-taking a lock that was already held counts as an acquisition and breaks the rule.',
    topic: 'Two-Phase Locking',
    subtopic: 'Protocol violations',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'medium-20',
    prompt: 'Which real database system is commonly described as implementing strict two-phase locking?',
    options: [
      { id: 'a', text: 'MySQL InnoDB' },
      { id: 'b', text: 'A plain file system with no transactions' },
      { id: 'c', text: 'Any system that uses read-committed isolation' },
      { id: 'd', text: 'A system that never aborts a transaction' }
    ],
    correct: ['a'],
    explanation: 'InnoDB holds exclusive locks until the end of the transaction, which is strict 2PL. It is also the source of the well-known "deadlock found" error when two transactions upgrade locks in opposite order.',
    topic: 'Two-Phase Locking',
    subtopic: '2PL in practice',
    reference: 'Learn § 7 Real-World Use Cases'
  },

  /* ── Deadlock ────────────────────────────────────────────────── */
  {
    id: 'medium-21',
    prompt: 'T1 holds X(A) and requests X(B); T2 holds X(B) and requests X(A). What is the state of the system?',
    options: [
      { id: 'a', text: 'T1 simply waits for T2 and T2 waits for T1 — a deadlock' },
      { id: 'b', text: 'T1 is aborted, because it arrived first' },
      { id: 'c', text: 'One of the requests is granted and the system makes progress' },
      { id: 'd', text: 'The system is in a serial schedule, not a deadlock' }
    ],
    correct: ['a'],
    explanation: 'Each transaction holds the lock the other needs, so neither can proceed. The wait-for graph contains the cycle T1 → T2 → T1.',
    topic: 'Deadlock',
    subtopic: 'Deadlock detection',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-22',
    prompt: 'In the classic two-transaction deadlock (T1 waits for T2 and T2 waits for T1), how many edges does the wait-for graph contain?',
    options: [
      { id: 'a', text: 'One' },
      { id: 'b', text: 'Two' },
      { id: 'c', text: 'Three' },
      { id: 'd', text: 'Four' }
    ],
    correct: ['b'],
    explanation: 'Two edges: T1 → T2 (T1 waits for T2 to release B) and T2 → T1 (T2 waits for T1 to release A).',
    topic: 'Deadlock',
    subtopic: 'Wait-for graphs',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'medium-23',
    prompt: 'T1 holds an S-lock on A and T2 holds an S-lock on A. Both then request an X-lock on A. What is the result?',
    options: [
      { id: 'a', text: 'Both upgrades succeed because S-locks are compatible' },
      { id: 'b', text: 'Both upgrades are queued and the two transactions deadlock' },
      { id: 'c', text: 'The second upgrade is granted and the first is queued' },
      { id: 'd', text: 'Both transactions abort immediately without a deadlock' }
    ],
    correct: ['b'],
    explanation: 'Each transaction waits for the other to release its S-lock, so the wait-for graph contains the cycle T1 → T2 → T1. This is the classic lock-upgrade deadlock.',
    topic: 'Deadlock',
    subtopic: 'Lock upgrade deadlock',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-24',
    prompt: 'Which of the four necessary conditions of a deadlock is generally NOT present in a database lock manager?',
    options: [
      { id: 'a', text: 'Mutual exclusion' },
      { id: 'b', text: 'Hold and wait' },
      { id: 'c', text: 'Circular wait' },
      { id: 'd', text: 'No preemption' }
    ],
    correct: ['d'],
    explanation: 'A waiting transaction can be aborted, which preempts its locks. The simulator does exactly this when you choose a victim to resolve a deadlock, so "no preemption" need not hold.',
    topic: 'Deadlock',
    subtopic: 'Deadlock resolution',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-25',
    prompt: 'Which deadlock condition does Conservative 2PL eliminate?',
    options: [
      { id: 'a', text: 'Mutual exclusion' },
      { id: 'b', text: 'Hold and wait' },
      { id: 'c', text: 'Circular wait' },
      { id: 'd', text: 'No preemption' }
    ],
    correct: ['b'],
    explanation: 'A transaction either holds all of its locks or none of them, so it can never hold one lock while waiting for another. Hold-and-wait is therefore impossible and no cycle can form.',
    topic: 'Deadlock',
    subtopic: 'Deadlock prevention',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'medium-26',
    prompt: 'Which deadlock-prevention scheme uses transaction timestamps to decide which transaction has to wait?',
    options: [
      { id: 'a', text: 'Wait-Die and Wound-Wait' },
      { id: 'b', text: 'Two-phase locking' },
      { id: 'c', text: 'The graph-based protocol' },
      { id: 'd', text: 'Lock timeout' }
    ],
    correct: ['a'],
    explanation: 'In Wait-Die an older transaction waits and a younger one is aborted; in Wound-Wait an older transaction preempts (aborts) a younger one. Both compare timestamps instead of building a wait-for graph.',
    topic: 'Deadlock',
    subtopic: 'Deadlock prevention',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-27',
    prompt: 'In the Wait-Die scheme, T1 (older) and T2 (younger) both request a lock held by the other. Who is aborted?',
    options: [
      { id: 'a', text: 'T1, the older transaction' },
      { id: 'b', text: 'T2, the younger transaction' },
      { id: 'c', text: 'Neither — both wait' },
      { id: 'd', text: 'Both are aborted' }
    ],
    correct: ['b'],
    explanation: 'Wait-Die aborts the younger transaction whenever it is the requester, and lets the older one wait. Only the younger transaction can ever be a victim, so no transaction is aborted more than once.',
    topic: 'Deadlock',
    subtopic: 'Deadlock prevention',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-28',
    prompt: 'What happens to the wait-for graph when a transaction commits?',
    options: [
      { id: 'a', text: 'The edges pointing away from it are removed, because it no longer waits for anything' },
      { id: 'b', text: 'The graph is deleted completely' },
      { id: 'c', text: 'A new edge is added from the committed transaction to every other transaction' },
      { id: 'd', text: 'Nothing — the graph is only rebuilt when a deadlock occurs' }
    ],
    correct: ['a'],
    explanation: 'A committed transaction releases all of its locks and is no longer waiting, so its outgoing edges disappear. Any transaction that was waiting on it can now be granted its lock.',
    topic: 'Deadlock',
    subtopic: 'Wait-for graphs',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'medium-29',
    prompt: 'A transaction is waiting for a lock that is held by a transaction which is itself waiting for a third transaction. How is this situation represented?',
    options: [
      { id: 'a', text: 'As a path of length two in the wait-for graph' },
      { id: 'b', text: 'As a single edge between the first and the third transaction' },
      { id: 'c', text: 'It is not represented at all' },
      { id: 'd', text: 'As a special marker in the lock table' }
    ],
    correct: ['a'],
    explanation: 'The graph records one edge per waiting relationship, so the situation appears as T1 → T2 → T3. A deadlock only exists if that path eventually closes into a cycle.',
    topic: 'Deadlock',
    subtopic: 'Wait-for graphs',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'medium-30',
    prompt: 'Which statement about the difference between deadlock prevention, avoidance and detection is correct?',
    options: [
      { id: 'a', text: 'Prevention never allows a deadlock to occur, avoidance tries to stay in a safe state, and detection waits for a deadlock and then deals with it' },
      { id: 'b', text: 'They are three names for the same technique' },
      { id: 'c', text: 'Prevention is used by timestamp ordering, avoidance by 2PL and detection by the lock table' },
      { id: 'd', text: 'Avoidance is only possible in distributed databases' }
    ],
    correct: ['a'],
    explanation: 'Prevention removes a deadlock condition outright (for example conservative 2PL removes hold-and-wait), avoidance keeps the system in a state from which a deadlock cannot result, and detection allows deadlocks and then resolves them.',
    topic: 'Deadlock',
    subtopic: 'Prevention vs avoidance vs detection',
    reference: 'Learn § 5 Deadlock Theory'
  },

  /* ── Serializability ─────────────────────────────────────────── */
  {
    id: 'medium-31',
    prompt: 'How is the precedence graph of a schedule built?',
    options: [
      { id: 'a', text: 'One vertex per transaction and an edge Ti → Tj for every conflicting pair in which Ti operates before Tj' },
      { id: 'b', text: 'One vertex per data item and an edge between the items that are locked together' },
      { id: 'c', text: 'One vertex per lock request and an edge from the waiter to the holder' },
      { id: 'd', text: 'One vertex per operation and an edge for every pair of operations' }
    ],
    correct: ['a'],
    explanation: 'Each vertex represents a transaction. For every pair of conflicting operations from different transactions, an edge is drawn from the transaction that comes first to the one that comes second.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'medium-32',
    prompt: 'Consider the schedule: r1(A); w1(A); r2(A); w2(A). Is it conflict-serializable?',
    options: [
      { id: 'a', text: 'No — the precedence graph contains the cycle T1 → T2 → T1' },
      { id: 'b', text: 'Yes — the precedence graph is acyclic' },
      { id: 'c', text: 'Yes — because both transactions write the same item' },
      { id: 'd', text: 'No — because it produces a dirty read' }
    ],
    correct: ['b'],
    explanation: 'Every conflicting pair here is ordered T1 before T2: r1(A) before w2(A), w1(A) before r2(A) and w1(A) before w2(A). All three edges point the same way, so the graph is acyclic and the schedule is conflict-serializable — equivalent to running T1 completely and then T2.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 6 Wait-For Graph Theory'
  },
  {
    id: 'medium-33',
    prompt: 'Consider the schedule: r1(A); r2(A); w1(A); w2(A). Is it conflict-serializable?',
    options: [
      { id: 'a', text: 'Yes — the precedence graph is acyclic' },
      { id: 'b', text: 'No — the precedence graph contains the cycle T1 → T2 → T1' },
      { id: 'c', text: 'Yes — because both transactions write the same item' },
      { id: 'd', text: 'No — because it produces a dirty read' }
    ],
    correct: ['b'],
    explanation: 'r1(A) before w2(A) gives T1 → T2 and r2(A) before w1(A) gives T2 → T1, so the graph has a cycle and the schedule is not conflict-serializable. This is the classic "lost update" schedule.',
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-34',
    prompt: 'Does every conflict-serializable schedule also satisfy view-serializability?',
    options: [
      { id: 'a', text: 'Yes — conflict-serializability is the stronger property' },
      { id: 'b', text: 'No — view-serializability is the stronger property' },
      { id: 'c', text: 'They are completely unrelated' },
      { id: 'd', text: 'Only for schedules with a single transaction' }
    ],
    correct: ['a'],
    explanation: 'Conflict-serializable schedules are a subset of view-serializable ones. The reverse does not hold: there are view-serializable schedules that are not conflict-serializable, and testing view-serializability is NP-hard.',
    topic: 'Serializability',
    subtopic: 'View serializability',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-35',
    prompt: 'Why is conflict-serializability preferred over view-serializability in practice?',
    options: [
      { id: 'a', text: 'Because testing for conflict-serializability is polynomial, while testing for view-serializability is NP-hard' },
      { id: 'b', text: 'Because conflict-serializability allows more concurrency' },
      { id: 'c', text: 'Because view-serializability cannot be achieved by any locking protocol' },
      { id: 'd', text: 'Because conflict-serializability does not need a graph' }
    ],
    correct: ['a'],
    explanation: 'The precedence-graph test is polynomial, whereas checking all serial orders for view-serializability is exponential. The two-phase locking theorem is also stated in terms of conflict-serializability.',
    topic: 'Serializability',
    subtopic: 'View serializability',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-36',
    prompt: 'There are conflict-serializable schedules that no two-phase locking protocol can produce. Why is that possible?',
    options: [
      { id: 'a', text: 'Because serializability alone does not say anything about the order of the operations, and 2PL adds the extra restriction that locks are taken in a consistent order' },
      { id: 'b', text: 'Because 2PL only works for two transactions' },
      { id: 'c', text: 'Because serialisable schedules always need more than one lock per item' },
      { id: 'd', text: 'It is not possible — every conflict-serializable schedule is produced by 2PL' }
    ],
    correct: ['a'],
    explanation: 'Without extra information about the order in which the items are accessed, locking cannot reproduce every conflict-serializable schedule. This is why "in the absence of extra information, 2PL is necessary for conflict-serializability".',
    topic: 'Serializability',
    subtopic: 'Limits of 2PL',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'medium-37',
    prompt: 'In a schedule produced by two-phase locking, what determines the serial order of the transactions?',
    options: [
      { id: 'a', text: 'The order of their lock points' },
      { id: 'b', text: 'The order in which they commit' },
      { id: 'c', text: 'The alphabetical order of their identifiers' },
      { id: 'd', text: 'The number of locks each transaction holds' }
    ],
    correct: ['a'],
    explanation: 'A transaction that has reached its lock point holds all of its locks, so no other transaction can perform a conflicting operation until it releases them. Sorting by lock point therefore yields an equivalent serial schedule.',
    topic: 'Two-Phase Locking',
    subtopic: 'Correctness of 2PL',
    reference: 'Learn § 4.1 Basic Two-Phase Locking (2PL)'
  },
  {
    id: 'medium-38',
    prompt: 'Which statement about recoverability and conflict-serializability is correct?',
    options: [
      { id: 'a', text: 'They are independent properties: a schedule can be conflict-serializable but not recoverable, and vice versa' },
      { id: 'b', text: 'Every conflict-serializable schedule is automatically recoverable' },
      { id: 'c', text: 'Every recoverable schedule is automatically conflict-serializable' },
      { id: 'd', text: 'Recoverability implies view-serializability' }
    ],
    correct: ['a'],
    explanation: 'The two properties answer different questions — "is the result correct?" and "can the schedule be recovered after a failure?". A schedule can satisfy one and not the other; strict 2PL is what gives both at once.',
    topic: 'Transactions',
    subtopic: 'Recoverability',
    reference: 'Learn § 2.2 What is a Transaction?'
  },
  {
    id: 'medium-39',
    prompt: 'What is a "cascadeless" schedule?',
    options: [
      { id: 'a', text: 'A schedule in which no transaction ever reads data written by a transaction that has not yet committed' },
      { id: 'b', text: 'A schedule in which no transaction ever aborts' },
      { id: 'c', text: 'A schedule in which all transactions commit in the same order' },
      { id: 'd', text: 'A schedule that uses only shared locks' }
    ],
    correct: ['a'],
    explanation: 'Cascadelessness means no transaction may read uncommitted data. Together with conflict-serializability this makes the schedule recoverable without cascading rollbacks.',
    topic: 'Transactions',
    subtopic: 'Recoverability',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'medium-40',
    prompt: 'Which of the following isolation levels prevents every anomaly, including phantoms?',
    options: [
      { id: 'a', text: 'Read Uncommitted' },
      { id: 'b', text: 'Read Committed' },
      { id: 'c', text: 'Repeatable Read' },
      { id: 'd', text: 'Serializable' }
    ],
    correct: ['d'],
    explanation: 'Serializable makes the schedule behave as if the transactions ran one after another, so dirty reads, non-repeatable reads, phantoms and lost updates are all impossible.',
    topic: 'Concurrency Control',
    subtopic: 'Isolation levels',
    reference: 'Learn § 8 Limitations'
  },

  /* ── Transactions ────────────────────────────────────────────── */
  {
    id: 'medium-41',
    prompt: 'What does the "C" of the ACID properties stand for?',
    options: [
      { id: 'a', text: 'Concurrency' },
      { id: 'b', text: 'Consistency' },
      { id: 'c', text: 'Commit' },
      { id: 'd', text: 'Cascading' }
    ],
    correct: ['b'],
    explanation: 'Consistency means the transaction moves the database from one valid state to another, respecting all of its constraints.',
    topic: 'Transactions',
    subtopic: 'ACID properties',
    reference: 'Learn § 2.2 What is a Transaction?'
  },
  {
    id: 'medium-42',
    prompt: 'What is a "dirty write"?',
    options: [
      { id: 'a', text: 'Overwriting the value written by a transaction that has not yet committed' },
      { id: 'b', text: 'Writing a value that is later overwritten by another transaction' },
      { id: 'c', text: 'Writing to a page that is not in the buffer pool' },
      { id: 'd', text: 'Writing a value that violates a constraint' }
    ],
    correct: ['a'],
    explanation: 'A dirty write lets one transaction overwrite another transaction\'s uncommitted changes, so the database can end up with a value that no committed transaction ever wrote.',
    topic: 'Concurrency Control',
    subtopic: 'Isolation problems',
    reference: 'Learn § 3 Lock Compatibility Matrix'
  },
  {
    id: 'medium-43',
    prompt: 'What is the "non-repeatable read" anomaly?',
    options: [
      { id: 'a', text: 'A transaction reads the same item twice and gets different values' },
      { id: 'b', text: 'A transaction reads a value that another transaction has not committed' },
      { id: 'c', text: 'Two transactions update the same item and one update is lost' },
      { id: 'd', text: 'A query returns rows that were inserted by another transaction' }
    ],
    correct: ['a'],
    explanation: 'Non-repeatable read occurs under read-committed isolation, where the shared lock is released after each read, so another transaction can change the item in between. Phantoms are the row-version of the same idea.',
    topic: 'Concurrency Control',
    subtopic: 'Isolation problems',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'medium-44',
    prompt: 'Which mechanism prevents the lost update problem?',
    options: [
      { id: 'a', text: 'Holding an exclusive (X) lock on the item until the transaction commits' },
      { id: 'b', text: 'Reading the item only once' },
      { id: 'c', text: 'Using a read-only transaction' },
      { id: 'd', text: 'Committing more often' }
    ],
    correct: ['a'],
    explanation: 'The X-lock is held until commit, so the second transaction cannot read the old value and write over it before the first transaction finishes. Timestamps and validation solve the same problem in a different way.',
    topic: 'Concurrency Control',
    subtopic: 'Lost update problem',
    reference: 'Learn § 3 Lock Compatibility Matrix'
  },
  {
    id: 'medium-45',
    prompt: 'What does the "I" of the ACID properties stand for?',
    options: [
      { id: 'a', text: 'Independence' },
      { id: 'b', text: 'Isolation' },
      { id: 'c', text: 'Integrity' },
      { id: 'd', text: 'Immutability' }
    ],
    correct: ['b'],
    explanation: 'Isolation means the effect of a transaction is not visible to other concurrent transactions except in the way the isolation level allows.',
    topic: 'Transactions',
    subtopic: 'ACID properties',
    reference: 'Learn § 2.2 What is a Transaction?'
  },
  {
    id: 'medium-46',
    prompt: 'Which statement about the ACID property "A" is correct?',
    options: [
      { id: 'a', text: 'Atomicity means a transaction is either performed completely or not at all' },
      { id: 'b', text: 'Atomicity means a transaction always commits' },
      { id: 'c', text: 'Atomicity means transactions run one after another' },
      { id: 'd', text: 'Atomicity means all transactions have the same duration' }
    ],
    correct: ['a'],
    explanation: 'Atomicity is all-or-nothing: after a crash, the database is left in a state where the transaction either happened entirely or not at all. Aborting a transaction rolls back all of its partial effects.',
    topic: 'Transactions',
    subtopic: 'ACID properties',
    reference: 'Learn § 2.2 What is a Transaction?'
  },

  /* ── Concurrency Control ─────────────────────────────────────── */
  {
    id: 'medium-47',
    prompt: 'Under read-committed isolation, when is a shared (S) lock released?',
    options: [
      { id: 'a', text: 'Immediately after the item has been read' },
      { id: 'b', text: 'At the end of the transaction' },
      { id: 'c', text: 'When another transaction requests an X-lock on the item' },
      { id: 'd', text: 'Never — read-committed does not use shared locks' }
    ],
    correct: ['a'],
    explanation: 'Read-committed uses short-duration read locks: the S-lock is dropped as soon as the read is done, which gives more concurrency but allows non-repeatable reads.',
    topic: 'Concurrency Control',
    subtopic: 'Isolation levels',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'medium-48',
    prompt: 'Under repeatable-read isolation, when is a shared (S) lock released?',
    options: [
      { id: 'a', text: 'Immediately after the read' },
      { id: 'b', text: 'At the end of the transaction' },
      { id: 'c', text: 'As soon as the transaction has read the item twice' },
      { id: 'd', text: 'When the transaction writes the item' }
    ],
    correct: ['b'],
    explanation: 'Repeatable read keeps the S-lock until the transaction ends, so a repeated read of the same item can never see a different value. The cost is that readers block writers for longer.',
    topic: 'Concurrency Control',
    subtopic: 'Isolation levels',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'medium-49',
    prompt: 'Which of the following is the main advantage of multi-version concurrency control (MVCC)?',
    options: [
      { id: 'a', text: 'Readers do not block writers and writers do not block readers' },
      { id: 'b', text: 'It removes the need for any locks' },
      { id: 'c', text: 'It makes every schedule conflict-serializable' },
      { id: 'd', text: 'It removes the possibility of dirty reads' }
    ],
    correct: ['a'],
    explanation: 'MVCC keeps several versions of each row, so a reader can be served the version that was current when it started while a writer creates a new version. Writers never have to wait for readers.',
    topic: 'Concurrency Control',
    subtopic: 'MVCC',
    reference: 'Learn § 7 Real-World Use Cases'
  },
  {
    id: 'medium-50',
    prompt: 'How does timestamp ordering differ fundamentally from two-phase locking?',
    options: [
      { id: 'a', text: 'Timestamp ordering never makes a transaction wait, while 2PL blocks transactions that request conflicting locks' },
      { id: 'b', text: 'Timestamp ordering allows dirty reads, while 2PL does not' },
      { id: 'c', text: 'Timestamp ordering is a form of two-phase locking with different lock types' },
      { id: 'd', text: 'Timestamp ordering guarantees serializability, while 2PL does not' }
    ],
    correct: ['a'],
    explanation: 'Timestamp ordering aborts a transaction whose operation would violate the timestamp order instead of blocking it, so it is deadlock-free by construction. 2PL is serializable but can block and can deadlock.',
    topic: 'Concurrency Control',
    subtopic: 'Timestamp ordering',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  }
];
