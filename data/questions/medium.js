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
  },
  {
    id: 'medium-51',
    prompt: "Consider two transactions T1 and T2 concurrently requesting locks on data item A:\nT1 holds S(A), T2 requests S(A)\nT1 requests X(A)\nWhat will happen in a standard lock manager?",
    options: [
      {
            "id": "a",
            "text": "T2's S(A) is granted; T1's upgrade to X(A) must wait until T2 releases S(A)"
      },
      {
            "id": "b",
            "text": "T1's upgrade to X(A) is granted immediately, revoking T2's S(A)"
      },
      {
            "id": "c",
            "text": "T1 and T2 are both immediately aborted due to protocol violation"
      },
      {
            "id": "d",
            "text": "T2 is converted to X(A) automatically"
      }
],
    correct: ["a"],
    explanation: "Multiple transactions can hold S-locks concurrently. However, when T1 requests an upgrade to an Exclusive (X) lock, X is incompatible with T2's S-lock, so T1 must wait until T2 unlocks A.",
    topic: 'Lock Basics',
    subtopic: 'Lock upgrades and downgrades',
    reference: 'Learn § 2.4 Shared Lock (S-Lock)'
  },
  {
    id: 'medium-52',
    prompt: "Both transaction T1 and transaction T2 hold Shared (S) locks on item Q. Both simultaneously attempt to upgrade their lock to Exclusive (X) on Q. What is the outcome?",
    options: [
      {
            "id": "a",
            "text": "A conversion deadlock occurs as each transaction waits for the other to release its S lock"
      },
      {
            "id": "b",
            "text": "One transaction is randomly chosen and granted X while the other remains S"
      },
      {
            "id": "c",
            "text": "Both upgrades are granted simultaneously without waiting"
      },
      {
            "id": "d",
            "text": "The lock manager merges the two into a single SIX lock"
      }
],
    correct: ["a"],
    explanation: "This is the classic lock conversion deadlock: T1 holds S and waits for T2 to release S so T1 can get X; meanwhile T2 holds S and waits for T1 to release S. Neither can proceed.",
    topic: 'Deadlock',
    subtopic: 'Lock upgrade deadlock',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-53',
    prompt: "How does the introduction of Update (U) locks eliminate the conversion deadlock where two transactions read and later update the same record?",
    options: [
      {
            "id": "a",
            "text": "Because U locks are mutually incompatible: only one transaction can acquire a U lock initially"
      },
      {
            "id": "b",
            "text": "Because U locks automatically abort any transaction that requests an S lock"
      },
      {
            "id": "c",
            "text": "Because U locks bypass the Two-Phase Locking rule completely"
      },
      {
            "id": "d",
            "text": "Because U locks convert the database to an in-memory single-threaded queue"
      }
],
    correct: ["a"],
    explanation: "An Update lock is compatible with S locks but incompatible with another U lock. Therefore, only one transaction can acquire U on the item; the second updater must wait before reading, preventing two holders from attempting simultaneous upgrades.",
    topic: 'Lock Basics',
    subtopic: 'Update locks',
    reference: 'Learn § 2 Lock Types'
  },
  {
    id: 'medium-54',
    prompt: "A transaction executes the following sequence: Lock-S(A), Read(A), Unlock(A), Lock-S(B), Read(B), Unlock(B). Does this schedule satisfy basic 2PL?",
    options: [
      {
            "id": "a",
            "text": "No, because it acquires a lock on B after releasing its lock on A"
      },
      {
            "id": "b",
            "text": "Yes, because it releases locks before committing"
      },
      {
            "id": "c",
            "text": "Yes, because only Shared locks were requested"
      },
      {
            "id": "d",
            "text": "No, because transactions must never unlock data items"
      }
],
    correct: ["a"],
    explanation: "Under 2PL, once a transaction releases any lock (Unlock A), it enters its shrinking phase and can never acquire any subsequent lock. Acquiring Lock-S(B) after Unlock(A) is a 2PL violation.",
    topic: 'Two-Phase Locking',
    subtopic: 'Protocol violations',
    reference: 'Learn § 4.1 Basic Two-Phase Locking'
  },
  {
    id: 'medium-55',
    prompt: "Why does Strict 2PL avoid cascading rollbacks whereas basic 2PL may suffer from them?",
    options: [
      {
            "id": "a",
            "text": "Strict 2PL holds exclusive locks until commit, ensuring other transactions never read uncommitted writes"
      },
      {
            "id": "b",
            "text": "Strict 2PL forbids transactions from performing write operations"
      },
      {
            "id": "c",
            "text": "Strict 2PL disallows concurrency by running transactions sequentially"
      },
      {
            "id": "d",
            "text": "Basic 2PL does not use a lock table, while Strict 2PL does"
      }
],
    correct: ["a"],
    explanation: "In basic 2PL, an X-lock can be released during the shrinking phase before commit. If another transaction reads that modified value and the first transaction later aborts, a cascading rollback is required. Strict 2PL prevents this by holding X locks until commit.",
    topic: 'Two-Phase Locking',
    subtopic: 'Strict 2PL',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'medium-56',
    prompt: "In Multiple Granularity Locking, what lock must a transaction acquire on a Table before acquiring an Exclusive (X) lock on an individual Record in that table?",
    options: [
      {
            "id": "a",
            "text": "Intention Exclusive (IX) or SIX lock"
      },
      {
            "id": "b",
            "text": "Intention Shared (IS) lock only"
      },
      {
            "id": "c",
            "text": "Exclusive (X) lock on the entire database"
      },
      {
            "id": "d",
            "text": "No lock is needed on the parent table"
      }
],
    correct: ["a"],
    explanation: "In MGL protocol, to lock a child node in X mode, the transaction must hold at least an IX (or SIX) lock on all ancestor nodes in the hierarchy up to the root.",
    topic: 'Multiple Granularity Locking',
    subtopic: 'Intention locks',
    reference: 'Learn § 6 Multiple Granularity'
  },
  {
    id: 'medium-57',
    prompt: "Transaction T1 holds an Exclusive (X) lock on Table T. Transaction T2 requests an Intention Shared (IS) lock on Table T. What happens to T2?",
    options: [
      {
            "id": "a",
            "text": "T2's request is blocked and must wait because X and IS are incompatible"
      },
      {
            "id": "b",
            "text": "T2 is granted IS because intention locks ignore table locks"
      },
      {
            "id": "c",
            "text": "T1 is immediately forced to downgrade to Shared mode"
      },
      {
            "id": "d",
            "text": "T2 is aborted and restarted under conservative locking"
      }
],
    correct: ["a"],
    explanation: "An Exclusive (X) lock is incompatible with all other lock modes, including Intention Shared (IS). Therefore, T2 must wait until T1 releases its X lock on the table.",
    topic: 'Multiple Granularity Locking',
    subtopic: 'Lock compatibility matrix',
    reference: 'Learn § 6 Multiple Granularity'
  },
  {
    id: 'medium-58',
    prompt: "What lock compatibility exists between two Intention Exclusive (IX) locks requested by different transactions on the same Table?",
    options: [
      {
            "id": "a",
            "text": "Compatible: both transactions can hold IX on the same table simultaneously"
      },
      {
            "id": "b",
            "text": "Incompatible: IX conflicts with IX on the same node"
      },
      {
            "id": "c",
            "text": "Compatible only if the table has no index"
      },
      {
            "id": "d",
            "text": "Incompatible unless both are in the shrinking phase"
      }
],
    correct: ["a"],
    explanation: "IX and IX are compatible on the parent node. Both transactions intend to modify records in the table; conflict checking will take place at the finer record/row level.",
    topic: 'Multiple Granularity Locking',
    subtopic: 'Intention locks',
    reference: 'Learn § 6 Multiple Granularity'
  },
  {
    id: 'medium-59',
    prompt: "Which of the following describes the Tree Protocol (a graph-based locking protocol on tree-structured databases)?",
    options: [
      {
            "id": "a",
            "text": "The first lock can be on any node; subsequent locks can only be acquired if the transaction holds a lock on the parent node"
      },
      {
            "id": "b",
            "text": "All nodes in the tree must be locked simultaneously before execution begins"
      },
      {
            "id": "c",
            "text": "Locks can only be acquired starting strictly from the root node"
      },
      {
            "id": "d",
            "text": "Locks must be held until the transaction reaches the leaf nodes and commits"
      }
],
    correct: ["a"],
    explanation: "In the tree protocol: only exclusive locks are used; the first lock may be on any node; subsequently, a node Q can be locked only if the parent of Q is currently locked by the transaction. Unlocking can happen at any time.",
    topic: 'Two-Phase Locking',
    subtopic: 'Tree-based locking protocols',
    reference: 'Learn § 4 Protocol Variants'
  },
  {
    id: 'medium-60',
    prompt: "What is an important advantage of the Tree Locking Protocol over Two-Phase Locking (2PL)?",
    options: [
      {
            "id": "a",
            "text": "The tree protocol is inherently deadlock-free and locks can be released earlier"
      },
      {
            "id": "b",
            "text": "The tree protocol guarantees cascadeless rollbacks without holding locks to commit"
      },
      {
            "id": "c",
            "text": "The tree protocol supports arbitrary cyclic network graphs"
      },
      {
            "id": "d",
            "text": "The tree protocol eliminates the need for exclusive locks"
      }
],
    correct: ["a"],
    explanation: "The tree protocol ensures conflict serializability and is completely free from deadlocks, without requiring transactions to be two-phase (locks can be released before all locks are acquired).",
    topic: 'Two-Phase Locking',
    subtopic: 'Tree-based locking protocols',
    reference: 'Learn § 4 Protocol Variants'
  },
  {
    id: 'medium-61',
    prompt: "What is a major disadvantage of the Tree Locking Protocol?",
    options: [
      {
            "id": "a",
            "text": "Schedules may not be recoverable and cascading aborts can occur unless extra precautions are taken"
      },
      {
            "id": "b",
            "text": "It can lead to catastrophic circular deadlocks"
      },
      {
            "id": "c",
            "text": "Precedence graphs of tree-locked schedules are always cyclic"
      },
      {
            "id": "d",
            "text": "It cannot be implemented on B+ trees or hierarchical directories"
      }
],
    correct: ["a"],
    explanation: "Because locks may be released early before transaction completion, a transaction might read uncommitted data, meaning tree protocol schedules are not necessarily recoverable without additional commit dependencies.",
    topic: 'Two-Phase Locking',
    subtopic: 'Tree-based locking protocols',
    reference: 'Learn § 4 Protocol Variants'
  },
  {
    id: 'medium-62',
    prompt: "Consider a schedule S with transactions T1 and T2: r1(X), w2(X), r2(Y), w1(Y), commit1, commit2. What does the precedence graph show?",
    options: [
      {
            "id": "a",
            "text": "A cycle between T1 and T2 (T1 \u2192 T2 and T2 \u2192 T1), so S is NOT conflict-serializable"
      },
      {
            "id": "b",
            "text": "Only a single edge T1 \u2192 T2, so S is serializable"
      },
      {
            "id": "c",
            "text": "No edges because operations are on different variables"
      },
      {
            "id": "d",
            "text": "A self-loop on T1"
      }
],
    correct: ["a"],
    explanation: "On item X: r1(X) precedes w2(X), producing edge T1 \u2192 T2. On item Y: w1(Y) and r2(Y) conflict; r2(Y) precedes w1(Y), producing edge T2 \u2192 T1. The resulting cycle T1 \u21c4 T2 means S is not conflict-serializable.",
    topic: 'Serializability',
    subtopic: 'Precedence graphs',
    reference: 'Learn § 3 Serializability'
  },
  {
    id: 'medium-63',
    prompt: "Under Wound-Wait deadlock prevention, if T_old (timestamp 10) requests a lock held by T_young (timestamp 25), what action is taken?",
    options: [
      {
            "id": "a",
            "text": "T_old wounds T_young: T_young is aborted, rolled back, and restarted"
      },
      {
            "id": "b",
            "text": "T_old is forced to wait until T_young commits"
      },
      {
            "id": "c",
            "text": "T_old is aborted and discarded"
      },
      {
            "id": "d",
            "text": "Both transactions proceed with shared access"
      }
],
    correct: ["a"],
    explanation: "In Wound-Wait: when an older transaction requests a lock held by a younger transaction, the older transaction preempts ('wounds') the younger transaction, causing it to abort and roll back.",
    topic: 'Deadlock',
    subtopic: 'Wait-Die and Wound-Wait',
    reference: 'Learn § 5.2 Prevention'
  },
  {
    id: 'medium-64',
    prompt: "Under Wait-Die deadlock prevention, if T_young (timestamp 40) requests a lock held by T_old (timestamp 15), what happens?",
    options: [
      {
            "id": "a",
            "text": "T_young dies: it is aborted, rolled back, and restarted with timestamp 40"
      },
      {
            "id": "b",
            "text": "T_young is placed in the wait queue behind T_old"
      },
      {
            "id": "c",
            "text": "T_old is preempted and rolled back"
      },
      {
            "id": "d",
            "text": "T_young is assigned a timestamp of 10"
      }
],
    correct: ["a"],
    explanation: "In Wait-Die: when a younger transaction requests a resource held by an older transaction, the younger transaction is not permitted to wait; it 'dies' (is aborted and restarted with its original timestamp).",
    topic: 'Deadlock',
    subtopic: 'Wait-Die and Wound-Wait',
    reference: 'Learn § 5.2 Prevention'
  },
  {
    id: 'medium-65',
    prompt: "Why does Wound-Wait generally cause fewer transaction aborts and restarts than Wait-Die?",
    options: [
      {
            "id": "a",
            "text": "In Wound-Wait, younger transactions wait for older ones and older ones preempt younger ones only when necessary"
      },
      {
            "id": "b",
            "text": "Wound-Wait disables rollbacks completely"
      },
      {
            "id": "c",
            "text": "Wait-Die only works on single-processor systems"
      },
      {
            "id": "d",
            "text": "Wound-Wait uses optimistic concurrency control instead of locks"
      }
],
    correct: ["a"],
    explanation: "In Wound-Wait, an older transaction wounds a younger one, but if the younger transaction is already in the process of committing or finishes quickly, abort can be minimized. Also, younger transactions wait for older ones rather than dying immediately upon conflict.",
    topic: 'Deadlock',
    subtopic: 'Wait-Die and Wound-Wait',
    reference: 'Learn § 5.2 Prevention'
  },
  {
    id: 'medium-66',
    prompt: "What is the key condition for a schedule to be classified as 'Strict' in transaction recovery theory?",
    options: [
      {
            "id": "a",
            "text": "No transaction can read or write a data item until all previous transactions that wrote that item have committed or aborted"
      },
      {
            "id": "b",
            "text": "Transactions must never write to items that have been read by another transaction"
      },
      {
            "id": "c",
            "text": "All transactions must execute in ascending order of their start times"
      },
      {
            "id": "d",
            "text": "Every transaction must contain at least two SQL operations"
      }
],
    correct: ["a"],
    explanation: "A schedule is Strict if any data item written by a transaction T is neither read NOR overwritten by any other transaction until T has committed or aborted. This makes rollback as simple as restoring before-images.",
    topic: 'Transactions',
    subtopic: 'Recoverability',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'medium-67',
    prompt: "What is the relationship between the sets of Recoverable (RC), Avoids Cascading Aborts (ACA), and Strict (ST) schedules?",
    options: [
      {
            "id": "a",
            "text": "Strict \u2282 ACA \u2282 Recoverable"
      },
      {
            "id": "b",
            "text": "Recoverable \u2282 ACA \u2282 Strict"
      },
      {
            "id": "c",
            "text": "ACA \u2282 Strict \u2282 Recoverable"
      },
      {
            "id": "d",
            "text": "Strict = ACA = Recoverable"
      }
],
    correct: ["a"],
    explanation: "Every Strict schedule avoids cascading aborts (ACA), and every ACA schedule is Recoverable (RC). Thus, Strict \u2282 ACA \u2282 Recoverable is the proper subset hierarchy.",
    topic: 'Transactions',
    subtopic: 'Recoverability',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'medium-68',
    prompt: "In deadlock detection, what criteria are typically used to select a 'victim' transaction to abort and roll back?",
    options: [
      {
            "id": "a",
            "text": "Incurring the minimum rollback cost based on computation done, remaining steps, and updates made"
      },
      {
            "id": "b",
            "text": "Always choosing the transaction that holds the largest number of shared locks"
      },
      {
            "id": "c",
            "text": "Selecting the transaction that started earliest in the system"
      },
      {
            "id": "d",
            "text": "Aborting all transactions currently executing in the database"
      }
],
    correct: ["a"],
    explanation: "Deadlock victim selection evaluates cost factors: how long the transaction has run, how many updates it has made, how many data items it has locked, and how close it is to completion, aiming to minimize wasted work.",
    topic: 'Deadlock',
    subtopic: 'Deadlock resolution',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-69',
    prompt: "How does the system prevent starvation when a transaction is repeatedly selected as a deadlock victim?",
    options: [
      {
            "id": "a",
            "text": "By incorporating the number of past aborts into the victim selection cost metric"
      },
      {
            "id": "b",
            "text": "By permanently deleting the transaction from the database"
      },
      {
            "id": "c",
            "text": "By locking the entire database in exclusive mode for one hour"
      },
      {
            "id": "d",
            "text": "By giving the victim transaction a new timestamp far in the future"
      }
],
    correct: ["a"],
    explanation: "If a transaction is repeatedly picked as a victim, starvation occurs. To prevent this, systems track the number of times a transaction has been aborted and ensure high-abort transactions are not picked as victims.",
    topic: 'Deadlock',
    subtopic: 'Deadlock resolution',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-70',
    prompt: "What distinguishes View Serializability from Conflict Serializability?",
    options: [
      {
            "id": "a",
            "text": "Every conflict-serializable schedule is view-serializable, but some view-serializable schedules with blind writes are not conflict-serializable"
      },
      {
            "id": "b",
            "text": "Conflict serializability is NP-complete to test, while view serializability is polynomial"
      },
      {
            "id": "c",
            "text": "View serializability requires locking, whereas conflict serializability does not"
      },
      {
            "id": "d",
            "text": "They are identical mathematical definitions under all conditions"
      }
],
    correct: ["a"],
    explanation: "Conflict serializability is a strict subset of view serializability (CSR \u2282 VSR). View serializability allows certain schedules containing blind writes (writes without preceding reads) that have cycles in their conflict graphs.",
    topic: 'Serializability',
    subtopic: 'View serializability',
    reference: 'Learn § 3 Serializability'
  },
  {
    id: 'medium-71',
    prompt: "What is a 'blind write' in transaction processing?",
    options: [
      {
            "id": "a",
            "text": "Writing a data item without first reading that data item in the same transaction"
      },
      {
            "id": "b",
            "text": "Writing data directly to disk without updating the log buffer"
      },
      {
            "id": "c",
            "text": "Writing an uncommitted record during recovery"
      },
      {
            "id": "d",
            "text": "An update executed without acquiring an exclusive lock"
      }
],
    correct: ["a"],
    explanation: "A blind write occurs when a transaction writes a new value to a data item without first reading the item's previous value. Blind writes are crucial in distinguishing view serializability from conflict serializability.",
    topic: 'Transactions',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 3 Serializability'
  },
  {
    id: 'medium-72',
    prompt: "In Rigorous 2PL, if T1 has finished all its operations and is waiting for a two-phase commit response across a network, what locks does T1 hold?",
    options: [
      {
            "id": "a",
            "text": "All shared and exclusive locks acquired during its entire execution"
      },
      {
            "id": "b",
            "text": "Only exclusive locks, having released shared locks earlier"
      },
      {
            "id": "c",
            "text": "No locks, because its execution phase completed"
      },
      {
            "id": "d",
            "text": "Only intention locks on database roots"
      }
],
    correct: ["a"],
    explanation: "Rigorous 2PL requires that ALL locks (both S and X) must be held until the transaction terminates (commits or aborts). Thus, during two-phase commit, all locks remain held.",
    topic: 'Two-Phase Locking',
    subtopic: 'Rigorous 2PL',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'medium-73',
    prompt: "What happens if a transaction in Conservative 2PL cannot acquire all its requested locks at once?",
    options: [
      {
            "id": "a",
            "text": "It releases any acquired locks and waits to acquire all required locks atomically"
      },
      {
            "id": "b",
            "text": "It holds the locks it acquired and waits for the remaining ones"
      },
      {
            "id": "c",
            "text": "It starts execution anyway and requests the remaining locks later"
      },
      {
            "id": "d",
            "text": "It aborts and is banned from re-entering the system"
      }
],
    correct: ["a"],
    explanation: "To prevent hold-and-wait (the root cause of deadlock), Conservative 2PL does not hold partial locks while waiting. It must acquire all locks together, or release whatever it holds and wait.",
    topic: 'Two-Phase Locking',
    subtopic: 'Conservative 2PL',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'medium-74',
    prompt: "Why is Conservative 2PL difficult to implement in real-world interactive database systems?",
    options: [
      {
            "id": "a",
            "text": "It is difficult to predict all data items a transaction will read or write before it executes"
      },
      {
            "id": "b",
            "text": "It causes frequent circular deadlocks in the lock table"
      },
      {
            "id": "c",
            "text": "It is incompatible with SQL standard SELECT queries"
      },
      {
            "id": "d",
            "text": "It requires infinite memory for the lock manager"
      }
],
    correct: ["a"],
    explanation: "In real-world applications with conditional logic (e.g. IF-THEN statements) and ad-hoc queries, the set of records to be read or modified depends on data values evaluated during execution, making upfront lock prediction nearly impossible.",
    topic: 'Two-Phase Locking',
    subtopic: 'Conservative 2PL',
    reference: 'Learn § 4.3 Conservative Two-Phase Locking'
  },
  {
    id: 'medium-75',
    prompt: "If transaction T downgrades an Exclusive (X) lock on item X to a Shared (S) lock, when is this downgrade permitted under 2PL?",
    options: [
      {
            "id": "a",
            "text": "Only during the shrinking phase, because downgrading releases exclusive privilege"
      },
      {
            "id": "b",
            "text": "Only during the growing phase"
      },
      {
            "id": "c",
            "text": "At any time, because downgrades do not count as lock modifications"
      },
      {
            "id": "d",
            "text": "Downgrades are strictly forbidden in all variants of 2PL"
      }
],
    correct: ["a"],
    explanation: "Downgrading a lock (from X to S) is equivalent to releasing part of the lock rights. Therefore, downgrades are permitted only during the shrinking phase of Two-Phase Locking.",
    topic: 'Two-Phase Locking',
    subtopic: 'Lock upgrades and downgrades',
    reference: 'Learn § 4.1 Basic Two-Phase Locking'
  },
  {
    id: 'medium-76',
    prompt: "Conversely, when is a lock upgrade (from Shared S to Exclusive X) permitted under 2PL?",
    options: [
      {
            "id": "a",
            "text": "Only during the growing phase, because upgrading acquires additional lock privilege"
      },
      {
            "id": "b",
            "text": "Only during the shrinking phase"
      },
      {
            "id": "c",
            "text": "After the transaction has committed"
      },
      {
            "id": "d",
            "text": "Whenever no other transaction is holding a lock on any item"
      }
],
    correct: ["a"],
    explanation: "Upgrading a lock (S to X) acquires stronger privileges, which counts as acquiring a new lock. Under 2PL, acquiring locks is only permitted in the growing phase.",
    topic: 'Two-Phase Locking',
    subtopic: 'Lock upgrades and downgrades',
    reference: 'Learn § 4.1 Basic Two-Phase Locking'
  },
  {
    id: 'medium-77',
    prompt: "In a database lock table, how is information about an item and its requesting transactions typically structured?",
    options: [
      {
            "id": "a",
            "text": "A hash table on data item IDs pointing to a list of lock holders and a FIFO queue of waiting requests"
      },
      {
            "id": "b",
            "text": "An unsorted text file scanned linearly on every SQL statement"
      },
      {
            "id": "c",
            "text": "A single boolean flag per table indicating whether it is locked"
      },
      {
            "id": "d",
            "text": "A stack of transaction IDs popped in reverse chronological order"
      }
],
    correct: ["a"],
    explanation: "Lock tables use hash indexing by resource/item identifier. Each hash bucket points to a lock head containing the granted lock mode, list of holding transactions, and a wait queue for blocked transactions.",
    topic: 'Lock Basics',
    subtopic: 'Lock table structure',
    reference: 'Learn § 2 Lock Types'
  },
  {
    id: 'medium-78',
    prompt: "What is the Phantom Read anomaly in concurrent transaction execution?",
    options: [
      {
            "id": "a",
            "text": "A transaction queries a range of rows twice and sees new rows inserted by another committed transaction in between"
      },
      {
            "id": "b",
            "text": "A transaction reads an uncommitted row that is subsequently rolled back"
      },
      {
            "id": "c",
            "text": "A transaction reads two different values for the same primary key row"
      },
      {
            "id": "d",
            "text": "A write operation is lost due to an unacknowledged lock release"
      }
],
    correct: ["a"],
    explanation: "Phantom reads occur when transaction T1 executes a query that selects a set of rows satisfying a condition, and transaction T2 inserts new rows satisfying that condition and commits, causing T1's repeat query to see 'phantom' rows.",
    topic: 'Concurrency Control',
    subtopic: 'Isolation levels',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'medium-79',
    prompt: "Why cannot simple row-level 2PL prevent the phantom read problem?",
    options: [
      {
            "id": "a",
            "text": "Because the phantom row did not exist when the initial select query acquired its row locks"
      },
      {
            "id": "b",
            "text": "Because row-level locks only support exclusive mode"
      },
      {
            "id": "c",
            "text": "Because 2PL only locks tables and never rows"
      },
      {
            "id": "d",
            "text": "Because phantom reads only occur in single-user databases"
      }
],
    correct: ["a"],
    explanation: "Row-level locks can only be placed on records that already exist in the database. A newly inserted record that matches the query predicate cannot be locked prior to its insertion, requiring predicate or index-gap locking.",
    topic: 'Concurrency Control',
    subtopic: 'Isolation levels',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'medium-80',
    prompt: "What locking mechanism is used in modern DBMS (like InnoDB) to prevent phantom reads at the Serializable isolation level?",
    options: [
      {
            "id": "a",
            "text": "Index gap locking and next-key locking"
      },
      {
            "id": "b",
            "text": "Disabling indexes on all tables"
      },
      {
            "id": "c",
            "text": "Restarting the database server on every insert"
      },
      {
            "id": "d",
            "text": "Read uncommitted locking"
      }
],
    correct: ["a"],
    explanation: "Next-key locking combines an index-record lock on the index row with a gap lock on the gap preceding that index record, preventing other transactions from inserting rows into the gap.",
    topic: 'Concurrency Control',
    subtopic: 'Isolation levels',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'medium-81',
    prompt: "Which isolation level in the SQL standard allows Non-Repeatable Reads but prevents Dirty Reads?",
    options: [
      {
            "id": "a",
            "text": "Read Committed"
      },
      {
            "id": "b",
            "text": "Read Uncommitted"
      },
      {
            "id": "c",
            "text": "Repeatable Read"
      },
      {
            "id": "d",
            "text": "Serializable"
      }
],
    correct: ["a"],
    explanation: "Under Read Committed, transactions only read committed data (no dirty reads), but long-term shared locks are not held on read data, so subsequent reads may encounter updated values committed by other transactions.",
    topic: 'Concurrency Control',
    subtopic: 'Isolation levels',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'medium-82',
    prompt: "How does 2PL ensure serializability mathematically?",
    options: [
      {
            "id": "a",
            "text": "Transactions can be ordered by their lock points in an equivalent serial schedule without conflict cycles"
      },
      {
            "id": "b",
            "text": "By ensuring all transactions start at the exact same physical clock millisecond"
      },
      {
            "id": "c",
            "text": "By executing transactions exclusively in alphabetical order of their names"
      },
      {
            "id": "d",
            "text": "By rolling back all transactions that write to more than one table"
      }
],
    correct: ["a"],
    explanation: "In 2PL, if an edge Ti \u2192 Tj exists in the precedence graph, then Ti must have released a lock before Tj acquired a conflicting lock, meaning Ti's lock point precedes Tj's lock point. Hence, the graph is a DAG orderable by lock points.",
    topic: 'Two-Phase Locking',
    subtopic: 'Correctness of 2PL',
    reference: 'Learn § 4.1 Basic Two-Phase Locking'
  },
  {
    id: 'medium-83',
    prompt: "Suppose T1: Lock-X(A), Write(A), Unlock(A), Commit. T2: Lock-X(A), Write(A), Unlock(A), Commit. Does the interleaved schedule satisfy Strict 2PL?",
    options: [
      {
            "id": "a",
            "text": "Yes, because each transaction holds its exclusive lock until after its write and releases it at or immediately upon completion"
      },
      {
            "id": "b",
            "text": "No, because transactions can never commit in Strict 2PL"
      },
      {
            "id": "c",
            "text": "No, because T2 accessed item A which was previously locked by T1"
      },
      {
            "id": "d",
            "text": "Only if T1 and T2 executed in reverse order"
      }
],
    correct: ["a"],
    explanation: "In both transactions, the exclusive lock is held until the transaction finishes and commits. T2 only acquires the lock on A after T1 has committed, perfectly adhering to Strict 2PL.",
    topic: 'Two-Phase Locking',
    subtopic: 'Strict 2PL',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'medium-84',
    prompt: "What is the Dirty Read anomaly?",
    options: [
      {
            "id": "a",
            "text": "A transaction reads data written by another concurrent transaction that has not yet committed"
      },
      {
            "id": "b",
            "text": "A transaction reads old data from cache because disk sectors are damaged"
      },
      {
            "id": "c",
            "text": "A transaction overwrites data without checking primary key uniqueness"
      },
      {
            "id": "d",
            "text": "Two transactions read the same data item concurrently"
      }
],
    correct: ["a"],
    explanation: "A dirty read occurs when transaction T1 reads data modified by transaction T2 while T2 has not yet committed. If T2 later aborts, T1 has read a state that never legitimately existed.",
    topic: 'Concurrency Control',
    subtopic: 'Isolation problems',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'medium-85',
    prompt: "What is the Lost Update anomaly?",
    options: [
      {
            "id": "a",
            "text": "Two transactions read the same data item and subsequently both write an updated value, overwriting one update without incorporating it"
      },
      {
            "id": "b",
            "text": "A transaction's write is deleted by the operating system due to power failure"
      },
      {
            "id": "c",
            "text": "A transaction commits but the log record is lost"
      },
      {
            "id": "d",
            "text": "An update lock is automatically upgraded to a shared lock"
      }
],
    correct: ["a"],
    explanation: "Lost update occurs when two transactions T1 and T2 both read value X, compute modifications based on that value, and write back. The latter write overwrites the earlier write without incorporating its calculation.",
    topic: 'Concurrency Control',
    subtopic: 'Lost update problem',
    reference: 'Learn § 8 Limitations'
  },
  {
    id: 'medium-86',
    prompt: "In an operating lock manager, what happens when a transaction's lock request cannot be granted immediately?",
    options: [
      {
            "id": "a",
            "text": "The transaction is suspended and an entry is placed in the wait queue for that lock resource"
      },
      {
            "id": "b",
            "text": "The transaction immediately commits whatever work it did so far"
      },
      {
            "id": "c",
            "text": "The entire database is restarted in recovery mode"
      },
      {
            "id": "d",
            "text": "The lock manager drops the conflicting table from disk"
      }
],
    correct: ["a"],
    explanation: "When a requested lock is incompatible with currently granted locks, the calling transaction is blocked (suspended) and placed on the wait queue for that specific resource until it is granted.",
    topic: 'Lock Basics',
    subtopic: 'Wait queues',
    reference: 'Learn § 2 Lock Types'
  },
  {
    id: 'medium-87',
    prompt: "If transaction T holds an S-lock on row R and requests an X-lock on row R, what kind of lock transition is this?",
    options: [
      {
            "id": "a",
            "text": "Lock upgrade"
      },
      {
            "id": "b",
            "text": "Lock downgrade"
      },
      {
            "id": "c",
            "text": "Lock escalation"
      },
      {
            "id": "d",
            "text": "Lock de-escalation"
      }
],
    correct: ["a"],
    explanation: "Converting an existing lock on a resource to a more restrictive lock (such as from Shared to Exclusive) is called a lock upgrade.",
    topic: 'Lock Basics',
    subtopic: 'Lock upgrades and downgrades',
    reference: 'Learn § 2 Lock Types'
  },
  {
    id: 'medium-88',
    prompt: "If transaction T holds an X-lock on row R and changes its lock to an S-lock on row R, what kind of lock transition is this?",
    options: [
      {
            "id": "a",
            "text": "Lock downgrade"
      },
      {
            "id": "b",
            "text": "Lock upgrade"
      },
      {
            "id": "c",
            "text": "Lock escalation"
      },
      {
            "id": "d",
            "text": "Intention escalation"
      }
],
    correct: ["a"],
    explanation: "Converting an existing lock on a resource to a less restrictive lock mode (such as from Exclusive to Shared) is known as a lock downgrade.",
    topic: 'Lock Basics',
    subtopic: 'Lock upgrades and downgrades',
    reference: 'Learn § 2 Lock Types'
  },
  {
    id: 'medium-89',
    prompt: "Consider transactions T1 and T2. Under what condition can both hold an Intent Shared (IS) lock on Database D concurrently?",
    options: [
      {
            "id": "a",
            "text": "Always, because IS is fully compatible with IS"
      },
      {
            "id": "b",
            "text": "Never, because intention locks are strictly exclusive at the root"
      },
      {
            "id": "c",
            "text": "Only if T1 and T2 access different database tables"
      },
      {
            "id": "d",
            "text": "Only if neither transaction reads any records"
      }
],
    correct: ["a"],
    explanation: "IS is compatible with IS. Multiple transactions can concurrently intend to read lower-level items within the same database.",
    topic: 'Multiple Granularity Locking',
    subtopic: 'Intention locks',
    reference: 'Learn § 6 Multiple Granularity'
  },
  {
    id: 'medium-90',
    prompt: "Can a transaction hold an Exclusive (X) lock on a Table if another transaction holds an Intent Exclusive (IX) lock on that Table?",
    options: [
      {
            "id": "a",
            "text": "No, X is incompatible with IX"
      },
      {
            "id": "b",
            "text": "Yes, because intention locks do not conflict with exclusive locks"
      },
      {
            "id": "c",
            "text": "Yes, if both transactions belong to the same session"
      },
      {
            "id": "d",
            "text": "Only on weekends during database maintenance"
      }
],
    correct: ["a"],
    explanation: "IX indicates that lower-level modifications are occurring. Granting an X lock on the whole table would conflict with those lower-level writes, so X and IX conflict.",
    topic: 'Multiple Granularity Locking',
    subtopic: 'Lock compatibility matrix',
    reference: 'Learn § 6 Multiple Granularity'
  },
  {
    id: 'medium-91',
    prompt: "How does the wait-for graph cycle detection algorithm typically operate?",
    options: [
      {
            "id": "a",
            "text": "It constructs a directed graph of transactions and runs cycle-finding algorithms (e.g., Depth-First Search / Tarjan's algorithm) periodically"
      },
      {
            "id": "b",
            "text": "It sums up transaction IDs and checks if the sum is even"
      },
      {
            "id": "c",
            "text": "It counts how many times the user clicks the refresh button"
      },
      {
            "id": "d",
            "text": "It checks whether all transactions are using identical SQL keywords"
      }
],
    correct: ["a"],
    explanation: "Deadlock detection maintains or periodically constructs the Wait-For Graph (WFG) from the lock table and uses graph cycle detection algorithms (such as DFS) to identify closed loops.",
    topic: 'Deadlock',
    subtopic: 'Deadlock detection',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-92',
    prompt: "What is the timeout-based deadlock handling mechanism?",
    options: [
      {
            "id": "a",
            "text": "A transaction that waits for a lock longer than a configured threshold time is assumed to be in deadlock and aborted"
      },
      {
            "id": "b",
            "text": "All transactions are aborted after running for 5 milliseconds"
      },
      {
            "id": "c",
            "text": "The lock manager sleeps for 10 minutes when a conflict occurs"
      },
      {
            "id": "d",
            "text": "Transactions only execute during scheduled server maintenance windows"
      }
],
    correct: ["a"],
    explanation: "In timeout-based detection, if a transaction is blocked waiting for a lock longer than a specified timeout period (e.g. innodb_lock_wait_timeout), the DBMS assumes a deadlock or excessive contention and aborts it.",
    topic: 'Deadlock',
    subtopic: 'Deadlock detection',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-93',
    prompt: "What is an advantage of timeout-based deadlock resolution over wait-for graph cycle detection?",
    options: [
      {
            "id": "a",
            "text": "Simplicity of implementation and low overhead, especially in distributed databases"
      },
      {
            "id": "b",
            "text": "It never aborts transactions unnecessarily"
      },
      {
            "id": "c",
            "text": "It guarantees 100% CPU utilization at all times"
      },
      {
            "id": "d",
            "text": "It eliminates the need for transaction rollbacks"
      }
],
    correct: ["a"],
    explanation: "Timeout requires no complex global graph construction across distributed nodes, making it cheap and easy to implement, though setting the timeout value is tricky and can abort non-deadlocked transactions.",
    topic: 'Deadlock',
    subtopic: 'Deadlock detection',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-94',
    prompt: "What is a schedule called if its transactions execute strictly one after another without any operation interleaving?",
    options: [
      {
            "id": "a",
            "text": "A Serial schedule"
      },
      {
            "id": "b",
            "text": "A Concurrent schedule"
      },
      {
            "id": "c",
            "text": "An Interleaved schedule"
      },
      {
            "id": "d",
            "text": "A Rigorous schedule"
      }
],
    correct: ["a"],
    explanation: "A serial schedule is one where for each transaction, all of its operations are executed consecutively from beginning to end before any other transaction begins.",
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 3 Serializability'
  },
  {
    id: 'medium-95',
    prompt: "If a schedule S of n transactions is conflict-equivalent to a serial schedule S', then:",
    options: [
      {
            "id": "a",
            "text": "S is conflict-serializable and leaves the database in the same final state as S'"
      },
      {
            "id": "b",
            "text": "S must have taken longer to execute than S'"
      },
      {
            "id": "c",
            "text": "S contains no write operations"
      },
      {
            "id": "d",
            "text": "S cannot contain any shared locks"
      }
],
    correct: ["a"],
    explanation: "By definition, conflict-equivalent schedules order all pairs of conflicting operations identically. Therefore, the effect of executing S is identical to executing the serial schedule S'.",
    topic: 'Serializability',
    subtopic: 'Conflict serializability',
    reference: 'Learn § 3 Serializability'
  },
  {
    id: 'medium-96',
    prompt: "Can a schedule produced by Strict Two-Phase Locking ever be non-serializable?",
    options: [
      {
            "id": "a",
            "text": "No, because Strict 2PL is a restricted form of 2PL, which guarantees conflict serializability"
      },
      {
            "id": "b",
            "text": "Yes, if more than three transactions are running concurrently"
      },
      {
            "id": "c",
            "text": "Yes, whenever a deadlock occurs"
      },
      {
            "id": "d",
            "text": "Only if transactions read unindexed records"
      }
],
    correct: ["a"],
    explanation: "Strict 2PL enforces all conditions of basic 2PL plus holding X-locks until commit. Since basic 2PL guarantees conflict serializability, Strict 2PL also guarantees conflict serializability.",
    topic: 'Two-Phase Locking',
    subtopic: 'Strict 2PL',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'medium-97',
    prompt: "In a distributed transaction system, what is a Global Deadlock?",
    options: [
      {
            "id": "a",
            "text": "A deadlock cycle spanning across two or more independent database nodes"
      },
      {
            "id": "b",
            "text": "A deadlock caused by an internet cable disconnection"
      },
      {
            "id": "c",
            "text": "A deadlock that freezes all computers in the entire city"
      },
      {
            "id": "d",
            "text": "A deadlock occurring within a single database page"
      }
],
    correct: ["a"],
    explanation: "In distributed databases, each local node may have an acyclic local wait-for graph, but the union of wait dependencies across multiple nodes forms a cycle (global deadlock).",
    topic: 'Deadlock',
    subtopic: 'Deadlock detection',
    reference: 'Learn § 5 Deadlock Theory'
  },
  {
    id: 'medium-98',
    prompt: "Why does Rigorous 2PL yield an equivalent serial execution order that matches the transaction commit order?",
    options: [
      {
            "id": "a",
            "text": "Because all locks are held until commit, the serialization point of every transaction is its commit point"
      },
      {
            "id": "b",
            "text": "Because Rigorous 2PL only permits one transaction to commit per hour"
      },
      {
            "id": "c",
            "text": "Because Rigorous 2PL disables concurrency"
      },
      {
            "id": "d",
            "text": "Because commit statements are executed in alphabetical order"
      }
],
    correct: ["a"],
    explanation: "Since Rigorous 2PL holds all locks until end-of-transaction, its lock point coincides exactly with its commit point. Hence, the transaction serialization order matches the commit order.",
    topic: 'Two-Phase Locking',
    subtopic: 'Rigorous 2PL',
    reference: 'Learn § 4.2 Strict Two-Phase Locking'
  },
  {
    id: 'medium-99',
    prompt: "What is the primary trade-off between fine-grained locking (e.g. row locking) and coarse-grained locking (e.g. table locking)?",
    options: [
      {
            "id": "a",
            "text": "Fine-grained locking increases concurrency but requires more lock manager memory and overhead"
      },
      {
            "id": "b",
            "text": "Fine-grained locking eliminates deadlocks, while coarse-grained locking causes deadlocks"
      },
      {
            "id": "c",
            "text": "Coarse-grained locking provides higher concurrency for OLTP transactions"
      },
      {
            "id": "d",
            "text": "There is no performance difference between row and table locking"
      }
],
    correct: ["a"],
    explanation: "Row-level locking enables high concurrency because transactions touch different rows without blocking, but tracking thousands of locks consumes memory and CPU. Table-level locking has minimal overhead but severely restricts concurrency.",
    topic: 'Multiple Granularity Locking',
    subtopic: 'Lock escalation',
    reference: 'Learn § 6 Multiple Granularity'
  },
  {
    id: 'medium-100',
    prompt: "What is latching in a DBMS, and how does a latch differ from a lock?",
    options: [
      {
            "id": "a",
            "text": "Latches are short-term, low-overhead sync primitives protecting in-memory data structures, held for microseconds without deadlock detection"
      },
      {
            "id": "b",
            "text": "Latches are transaction-level logical locks held until commit and recorded in the user SQL log"
      },
      {
            "id": "c",
            "text": "Latches are only used on magnetic tapes, whereas locks are used on flash SSDs"
      },
      {
            "id": "d",
            "text": "Latches and locks are completely identical in DBMS terminology"
      }
],
    correct: ["a"],
    explanation: "In DBMS architecture, locks protect logical database contents (tables, rows) across transactions and follow 2PL; latches protect physical in-memory structures (buffer pool pages, B-tree nodes) for the duration of a single critical section.",
    topic: 'Lock Basics',
    subtopic: 'Lock table structure',
    reference: 'Learn § 2 Lock Types'
  }
];
