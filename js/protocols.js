/**
 * protocols.js — The catalogue of locking protocols the simulator can run.
 *
 * The file is shared by the simulation engine (js/simulator.js) and by the
 * configuration panel (js/app.js), so the rules that are implemented and the
 * rules that are displayed can never drift apart.
 *
 * Every protocol declares an `engine` block. The engine only ever looks at
 * these flags — there is no hidden behaviour per protocol id.
 *
 *   twoPhase          enforce the two-phase rule (a new lock after a release
 *                     aborts the transaction)
 *   holdXUntilCommit  strict 2PL — exclusive locks are held until commit/abort
 *   holdAllUntilCommit rigorous 2PL — every lock is held until commit/abort
 *   conservative      static 2PL — all locks are taken before the transaction
 *                     starts and are held until it ends
 *   conversions       allow an X-lock to be downgraded to an S-lock
 *   updateLock        a read takes an update (U) lock instead of an S-lock
 *   granularity       hierarchical locking with intention locks (IS/IX/SIX)
 *   prevention        deadlock prevention policy: 'wait-die' | 'wound-wait'
 *   treeProtocol      tree protocol locking (hierarchical, no intention locks)
 */

const PROTOCOL_GROUPS = [
  { id: 'twopl', label: 'Two-Phase Locking Variants', hint: 'Protocols that guarantee conflict-serializability by splitting every transaction into a growing and a shrinking phase.' },
  { id: 'modes', label: 'Locking Modes & Granularity', hint: 'Different lock modes (S, X, U) and hierarchical locking with intention locks.' },
  { id: 'prevention', label: 'Deadlock Prevention Policies', hint: 'Timestamp based policies that are layered on top of two-phase locking to stop circular waits from ever forming.' }
];

const PROTOCOLS = [
  /* ─────────────────── Two-Phase Locking Variants ─────────────────── */
  {
    id: 'basic-2pl',
    group: 'twopl',
    label: 'Basic Two-Phase Locking (2PL)',
    short: 'Basic 2PL',
    summary: 'A transaction may acquire locks until it releases its first one, but never acquire a new lock afterwards. Every schedule produced this way is conflict-serializable.',
    rules: [
      'Growing phase: locks may be acquired, none may be released.',
      'Shrinking phase: locks may be released, none may be acquired.',
      'Acquiring a lock after the first release aborts the transaction.',
      'Exclusive locks may be released before commit — cascading rollbacks are possible.'
    ],
    watch: 'Try a transaction that releases a lock and then asks for another one: the simulator aborts it.',
    engine: { twoPhase: true }
  },
  {
    id: 'strict-2pl',
    group: 'twopl',
    label: 'Strict Two-Phase Locking (Strict 2PL)',
    short: 'Strict 2PL',
    summary: 'Basic 2PL plus one extra rule: an exclusive lock is never released before the transaction commits or aborts. This makes the schedule recoverable and removes cascading rollbacks.',
    rules: [
      'Everything Basic 2PL does.',
      'Exclusive (X) locks are held until commit/abort.',
      'Shared (S) locks may still be released early.',
      'Releasing an X-lock before commit aborts the transaction.'
    ],
    watch: 'Load the "Lock Upgrade Conflict" example and watch T2 stay blocked until T1 commits.',
    engine: { twoPhase: true, holdXUntilCommit: true }
  },
  {
    id: 'rigorous-2pl',
    group: 'twopl',
    label: 'Rigorous Two-Phase Locking (Rigorous 2PL)',
    short: 'Rigorous 2PL',
    summary: 'The strictest 2PL variant: every lock — shared and exclusive — is held until the transaction ends, so transactions can be serialised in their commit order.',
    rules: [
      'Everything Basic 2PL does.',
      'All locks (S and X) are held until commit/abort.',
      'Releasing any lock before commit aborts the transaction.',
      'The commit order is a valid serial order.'
    ],
    watch: 'A shared lock released before the commit aborts the transaction here, unlike Strict 2PL.',
    engine: { twoPhase: true, holdXUntilCommit: true, holdAllUntilCommit: true }
  },
  {
    id: 'conservative-2pl',
    group: 'twopl',
    label: 'Conservative / Static Two-Phase Locking',
    short: 'Conservative 2PL',
    summary: 'A transaction declares every lock it will need and obtains all of them before it starts. If one cannot be granted it waits holding nothing at all, which removes the hold-and-wait condition and makes deadlocks impossible.',
    rules: [
      'The complete set of locks is computed from the schedule before the transaction starts.',
      'All locks are granted together or none of them are.',
      'A transaction that cannot get its whole set waits without holding any lock.',
      'Because no transaction ever holds one lock while waiting for another, no cycle can form.'
    ],
    watch: 'Load the "Deadlock Scenario" example: the same schedule that deadlocks under Basic 2PL now simply runs.',
    engine: { twoPhase: true, conservative: true, holdAllUntilCommit: true }
  },

  /* ─────────────────── Locking Modes & Granularity ─────────────────── */
  {
    id: 'sx-locking',
    group: 'modes',
    label: 'Shared & Exclusive Locking (S / X) with Conversions',
    short: 'S / X Locks',
    summary: 'The fundamental two lock modes on their own, without the two-phase rule. Reads take a shared lock, writes take an exclusive lock, and a transaction may convert a lock it already holds.',
    rules: [
      'read → S-lock, write → X-lock.',
      'S → X upgrade: a write on an item the transaction has read. It must wait if another transaction holds a conflicting lock.',
      'X → S downgrade: a read on an item the transaction has written; always granted.',
      'No two-phase rule: a lock may be released early and new locks may still be taken, so serializability is NOT guaranteed.'
    ],
    watch: 'Use U(A) to release a lock early and then write another item: here the transaction survives, while Basic 2PL aborts it.',
    engine: { conversions: true }
  },
  {
    id: 'update-locking',
    group: 'modes',
    label: 'Update Locking (U-Lock) — Read-then-Write',
    short: 'Update Locks',
    summary: 'A read that may be followed by a write takes an update lock instead of a shared lock. The update lock is compatible with shared locks only, so two transactions can no longer both read an item and then deadlock while upgrading.',
    rules: [
      'read → U-lock (compatible with S only).',
      'write → X-lock, converting a held U-lock into an X-lock.',
      'U is incompatible with S, U and X.',
      'The classic "read then write" upgrade deadlock cannot occur: the second reader is blocked by the first U-lock.'
    ],
    watch: 'Two transactions that read the same item: the second one is blocked immediately, instead of blocking later during the upgrade.',
    engine: { updateLock: true, holdAllUntilCommit: true }
  },
  {
    id: 'mgl-locking',
    group: 'modes',
    label: 'Multiple Granularity Locking (IS / IX / SIX)',
    short: 'Multiple Granularity',
    summary: 'Locks a tree of resources — database → table → page → record. A lock on a node is taken together with intention locks on its ancestors, and a lock on a node conflicts with every lock held below it.',
    rules: [
      'Items are hierarchical paths, e.g. db.accounts.p2.r7.',
      'A shared lock below a node also puts an IS-lock on every ancestor.',
      'An exclusive lock below a node puts an IX-lock on every ancestor.',
      'A node that holds both shared and exclusive locks below it carries a SIX-lock.',
      'A lock on a node conflicts with locks on that node, on its descendants and with strong locks on its ancestors.'
    ],
    watch: 'Load the "Multiple Granularity" example: a table-level write is blocked by a record-level read, while a record-level write of another record is not.',
    engine: { granularity: true, holdAllUntilCommit: true }
  },

  /* ─────────────────── Deadlock Prevention ─────────────────── */
  {
    id: 'wait-die',
    group: 'prevention',
    label: 'Wait-Die (Deadlock Prevention)',
    short: 'Wait-Die',
    summary: 'A timestamp based prevention policy layered on 2PL. An older transaction always waits; a younger transaction that meets an older holder is aborted and restarted with a new timestamp.',
    rules: [
      'Every transaction gets a timestamp when it first appears in the schedule.',
      'Requester is OLDER than the holder → the requester waits.',
      'Requester is YOUNGER than the holder → the requester dies: it is aborted and restarted with a fresh timestamp.',
      'Only the younger transaction is ever aborted, so no transaction is starved.'
    ],
    watch: 'Load the "Wait-Die Prevention" example: the younger transaction is aborted and restarted, so no deadlock is ever reported.',
    engine: { twoPhase: true, prevention: 'wait-die' }
  },
  {
    id: 'wound-wait',
    group: 'prevention',
    label: 'Wound-Wait (Deadlock Prevention)',
    short: 'Wound-Wait',
    summary: 'The mirror image of Wait-Die. An older transaction never waits: it wounds the younger holder, which is aborted and restarted, and the older transaction proceeds.',
    rules: [
      'Every transaction gets a timestamp when it first appears in the schedule.',
      'Requester is OLDER than the holder → the holder is wounded: aborted and restarted, and the requester proceeds.',
      'Requester is YOUNGER than the holder → the requester waits.',
      'Only the older transaction is ever aborted, so no transaction is starved.'
    ],
    watch: 'Load the "Wound-Wait Prevention" example: the younger transaction is wounded and restarted instead of deadlocking.',
    engine: { twoPhase: true, prevention: 'wound-wait' }
  }
];

const PROTOCOL_BY_ID = PROTOCOLS.reduce((map, protocol) => {
  map[protocol.id] = protocol;
  return map;
}, {});

const DEFAULT_PROTOCOL = 'basic-2pl';

window.PROTOCOL_GROUPS = PROTOCOL_GROUPS;
window.PROTOCOLS = PROTOCOLS;
window.PROTOCOL_BY_ID = PROTOCOL_BY_ID;
window.DEFAULT_PROTOCOL = DEFAULT_PROTOCOL;
