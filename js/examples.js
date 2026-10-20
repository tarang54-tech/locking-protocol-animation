window.EXAMPLES = [
  {
    id: 1,
    name: "Basic 2PL — No Conflict",
    description: "T1 reads/writes A, T2 reads/writes B. No conflicts, both complete.",
    protocol: 'basic-2pl',
    transactions: [
      { txId: 'T1', operations: [{type: 'read', item: 'A'}, {type: 'write', item: 'A'}] },
      { txId: 'T2', operations: [{type: 'read', item: 'B'}, {type: 'write', item: 'B'}] }
    ],
    schedule: [
      { txId: 'T1', type: 'read', item: 'A' },
      { txId: 'T2', type: 'read', item: 'B' },
      { txId: 'T1', type: 'write', item: 'A' },
      { txId: 'T2', type: 'write', item: 'B' },
      { txId: 'T1', type: 'commit', item: null },
      { txId: 'T2', type: 'commit', item: null }
    ],
    expectedOutcome: "Both transactions execute and commit without waiting."
  },
  {
    id: 2,
    name: "Shared Lock Compatibility",
    description: "T1 reads A, T2 reads A, then both write different items and commit. Shows S-locks are compatible.",
    protocol: 'basic-2pl',
    transactions: [
      { txId: 'T1', operations: [{type: 'read', item: 'A'}, {type: 'write', item: 'B'}] },
      { txId: 'T2', operations: [{type: 'read', item: 'A'}, {type: 'write', item: 'C'}] }
    ],
    schedule: [
      { txId: 'T1', type: 'read', item: 'A' },
      { txId: 'T2', type: 'read', item: 'A' },
      { txId: 'T1', type: 'write', item: 'B' },
      { txId: 'T2', type: 'write', item: 'C' },
      { txId: 'T1', type: 'commit', item: null },
      { txId: 'T2', type: 'commit', item: null }
    ],
    expectedOutcome: "T2 successfully gets an S-lock on A while T1 also holds an S-lock on A."
  },
  {
    id: 3,
    name: "Lock Conflict & Waiting",
    description: "T1 writes A, T2 tries to read A (must wait for T1 to release). T1 commits, then T2 proceeds.",
    protocol: 'strict-2pl',
    transactions: [
      { txId: 'T1', operations: [{type: 'write', item: 'A'}] },
      { txId: 'T2', operations: [{type: 'read', item: 'A'}] }
    ],
    schedule: [
      { txId: 'T1', type: 'write', item: 'A' },
      { txId: 'T2', type: 'read', item: 'A' },
      { txId: 'T1', type: 'commit', item: null },
      { txId: 'T2', type: 'commit', item: null }
    ],
    expectedOutcome: "T2 is blocked when trying to read A. Unblocked after T1 commits."
  },
  {
    id: 4,
    name: "Lock Upgrade Conflict",
    description: "T1 reads A (gets S-lock), T2 reads A (gets S-lock), T1 tries to write A (upgrade blocked by T2's S-lock). Shows upgrade conflict.",
    protocol: 'strict-2pl',
    transactions: [
      { txId: 'T1', operations: [{type: 'read', item: 'A'}, {type: 'write', item: 'A'}] },
      { txId: 'T2', operations: [{type: 'read', item: 'A'}] }
    ],
    schedule: [
      { txId: 'T1', type: 'read', item: 'A' },
      { txId: 'T2', type: 'read', item: 'A' },
      { txId: 'T1', type: 'write', item: 'A' },
      { txId: 'T2', type: 'commit', item: null },
      { txId: 'T1', type: 'commit', item: null }
    ],
    expectedOutcome: "T1 is blocked when trying to upgrade its S-lock to an X-lock because T2 holds an S-lock. T1 unblocks after T2 commits."
  },
  {
    id: 5,
    name: "Deadlock Scenario",
    description: "T1 locks A then requests B, T2 locks B then requests A. Classic circular wait deadlock.",
    protocol: 'basic-2pl',
    transactions: [
      { txId: 'T1', operations: [{type: 'write', item: 'A'}, {type: 'write', item: 'B'}] },
      { txId: 'T2', operations: [{type: 'write', item: 'B'}, {type: 'write', item: 'A'}] }
    ],
    schedule: [
      { txId: 'T1', type: 'write', item: 'A' },
      { txId: 'T2', type: 'write', item: 'B' },
      { txId: 'T1', type: 'write', item: 'B' },
      { txId: 'T2', type: 'write', item: 'A' }
    ],
    expectedOutcome: "A deadlock is detected after T2 requests a write on A. Simulation halts."
  },
  {
    id: 6,
    name: "Rigorous 2PL Demo",
    description: "T1 and T2 interleave reads and writes. All locks held until commit, showing stricter protocol prevents cascading aborts.",
    protocol: 'rigorous-2pl',
    transactions: [
      { txId: 'T1', operations: [{type: 'read', item: 'A'}, {type: 'write', item: 'B'}] },
      { txId: 'T2', operations: [{type: 'read', item: 'B'}, {type: 'write', item: 'C'}] }
    ],
    schedule: [
      { txId: 'T1', type: 'read', item: 'A' },
      { txId: 'T2', type: 'read', item: 'B' },
      { txId: 'T1', type: 'write', item: 'B' },
      { txId: 'T2', type: 'write', item: 'C' },
      { txId: 'T1', type: 'commit', item: null },
      { txId: 'T2', type: 'commit', item: null }
    ],
    expectedOutcome: "T1 blocks waiting to write B since T2 has an S-lock on B. Unblocks when T2 commits."
  },
  {
    id: 7,
    name: "Conservative 2PL — Deadlock Prevented",
    description: "The classic circular wait: T1 needs A and B, T2 needs B and A. Conservative 2PL takes the whole set up front, so T2 waits holding nothing and no deadlock can form.",
    protocol: 'conservative-2pl',
    transactions: [
      { txId: 'T1', operations: [{type: 'write', item: 'A'}, {type: 'write', item: 'B'}] },
      { txId: 'T2', operations: [{type: 'write', item: 'B'}, {type: 'write', item: 'A'}] }
    ],
    schedule: [
      { txId: 'T1', type: 'write', item: 'A' },
      { txId: 'T2', type: 'write', item: 'B' },
      { txId: 'T1', type: 'write', item: 'B' },
      { txId: 'T2', type: 'write', item: 'A' },
      { txId: 'T1', type: 'commit', item: null },
      { txId: 'T2', type: 'commit', item: null }
    ],
    expectedOutcome: "T1 takes X(A) and X(B) in one go. T2 cannot get its two locks, so it waits without holding anything. When T1 commits, T2 starts and finishes — no deadlock."
  },
  {
    id: 8,
    name: "Multiple Granularity Locking",
    description: "A database → table → record hierarchy. T1 reads a record, T2 writes a different record and T3 wants to lock the whole table.",
    protocol: 'mgl-locking',
    transactions: [
      { txId: 'T1', operations: [{type: 'read', item: 'db.accounts.r1'}] },
      { txId: 'T2', operations: [{type: 'write', item: 'db.accounts.r2'}] },
      { txId: 'T3', operations: [{type: 'write', item: 'db.accounts'}] }
    ],
    schedule: [
      { txId: 'T1', type: 'read', item: 'db.accounts.r1' },
      { txId: 'T2', type: 'write', item: 'db.accounts.r2' },
      { txId: 'T3', type: 'write', item: 'db.accounts' },
      { txId: 'T1', type: 'commit', item: null },
      { txId: 'T2', type: 'commit', item: null },
      { txId: 'T3', type: 'commit', item: null }
    ],
    expectedOutcome: "T1 takes S(record) with IS locks on the table and the database. T2 writes another record and only needs IX on the table, so it is granted. T3 wants to lock the whole table, which is blocked by the locks below it."
  },
  {
    id: 9,
    name: "Update Locks — Read-then-Write",
    description: "Both transactions read A and then write it. With update locks the second reader is blocked immediately, so the classic upgrade deadlock cannot happen.",
    protocol: 'update-locking',
    transactions: [
      { txId: 'T1', operations: [{type: 'read', item: 'A'}, {type: 'write', item: 'A'}] },
      { txId: 'T2', operations: [{type: 'read', item: 'A'}, {type: 'write', item: 'A'}] }
    ],
    schedule: [
      { txId: 'T1', type: 'read', item: 'A' },
      { txId: 'T2', type: 'read', item: 'A' },
      { txId: 'T1', type: 'write', item: 'A' },
      { txId: 'T2', type: 'write', item: 'A' },
      { txId: 'T1', type: 'commit', item: null },
      { txId: 'T2', type: 'commit', item: null }
    ],
    expectedOutcome: "T1 reads A and takes an update lock. T2's read is blocked at once because an update lock is incompatible with a shared lock. T1 converts its update lock to X and writes; T2 runs afterwards. No deadlock — try the same schedule under Basic 2PL."
  },
  {
    id: 10,
    name: "Lock Conversion — S → X Upgrade",
    description: "T1 reads A and then writes it while T2 is reading A. The upgrade from S to X has to wait for T2.",
    protocol: 'sx-locking',
    transactions: [
      { txId: 'T1', operations: [{type: 'read', item: 'A'}, {type: 'write', item: 'A'}] },
      { txId: 'T2', operations: [{type: 'read', item: 'A'}] }
    ],
    schedule: [
      { txId: 'T1', type: 'read', item: 'A' },
      { txId: 'T2', type: 'read', item: 'A' },
      { txId: 'T1', type: 'write', item: 'A' },
      { txId: 'T1', type: 'commit', item: null },
      { txId: 'T2', type: 'commit', item: null }
    ],
    expectedOutcome: "Both transactions hold a shared lock on A. T1 asks for an exclusive lock, the S → X conversion must wait for T2 to release its shared lock, and it is granted as soon as T2 commits."
  },
  {
    id: 11,
    name: "Wait-Die — the Younger Transaction Dies",
    description: "T1 (older) holds an exclusive lock on A, T2 (younger) asks for it. Under Wait-Die the younger transaction is aborted and restarted instead of waiting.",
    protocol: 'wait-die',
    transactions: [
      { txId: 'T1', operations: [{type: 'write', item: 'A'}] },
      { txId: 'T2', operations: [{type: 'write', item: 'A'}] }
    ],
    schedule: [
      { txId: 'T1', type: 'write', item: 'A' },
      { txId: 'T2', type: 'write', item: 'A' },
      { txId: 'T1', type: 'commit', item: null },
      { txId: 'T2', type: 'commit', item: null }
    ],
    expectedOutcome: "T2 is younger than T1, so it dies: it is aborted, restarted at the end of the schedule with a new timestamp and succeeds after T1 has committed. No deadlock is ever reported."
  },
  {
    id: 12,
    name: "Wound-Wait — the Older Transaction Wounds",
    description: "T1 (older) wants an exclusive lock that the younger T2 already holds. Under Wound-Wait the older transaction wounds the younger one, which is aborted and restarted.",
    protocol: 'wound-wait',
    transactions: [
      { txId: 'T1', operations: [{type: 'write', item: 'B'}, {type: 'write', item: 'A'}] },
      { txId: 'T2', operations: [{type: 'write', item: 'A'}] }
    ],
    schedule: [
      { txId: 'T1', type: 'write', item: 'B' },
      { txId: 'T2', type: 'write', item: 'A' },
      { txId: 'T1', type: 'write', item: 'A' },
      { txId: 'T1', type: 'commit', item: null },
      { txId: 'T2', type: 'commit', item: null }
    ],
    expectedOutcome: "T2 holds X(A) and T1 is older, so T1 wounds T2: T2 is aborted and restarted with a new timestamp while T1 takes the lock. No deadlock is ever reported."
  }
];
