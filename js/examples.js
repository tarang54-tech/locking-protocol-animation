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
  }
];
