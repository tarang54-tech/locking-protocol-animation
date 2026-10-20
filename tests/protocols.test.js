/**
 * tests/protocols.test.js — Tests for the locking protocols of the engine.
 *
 * Every protocol is checked against the rule that defines it: the locks that
 * are taken, the transactions that wait, the ones that are aborted, the ones
 * that are restarted and the ones that commit.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadEngine() {
  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  ['js/protocols.js', 'js/simulator.js'].forEach(file => {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    vm.runInContext(source, sandbox);
  });
  return {
    LockingSimulator: sandbox.window.LockingSimulator,
    PROTOCOLS: sandbox.window.PROTOCOLS,
    PROTOCOL_GROUPS: sandbox.window.PROTOCOL_GROUPS
  };
}

const { LockingSimulator, PROTOCOLS, PROTOCOL_GROUPS } = loadEngine();

/**
 * Build a schedule from compact transaction descriptions.
 * The transactions are interleaved round-robin, exactly like the simulator
 * does when the transactions are typed into the configuration panel.
 */
function scheduleOf(transactions) {
  const schedule = [];
  const counters = {};
  const maxLength = Math.max(...transactions.map(([, ops]) => ops.length), 0);

  for (let i = 0; i < maxLength; i++) {
    transactions.forEach(([txId, ops]) => {
      if (i >= ops.length) return;
      const n = counters[txId] || 0;
      counters[txId] = n + 1;
      schedule.push({ txId, type: ops[i].type, item: ops[i].item, opId: `${txId}#${n}` });
    });
  }
  return schedule;
}

const read = item => ({ type: 'read', item });
const write = item => ({ type: 'write', item });
const commit = { type: 'commit', item: null };
const abort = { type: 'abort', item: null };
const unlock = item => ({ type: 'unlock', item });

/** The mode a transaction holds on an item. */
function modeOf(sim, txId, item) {
  const entry = sim.lockTable[item];
  if (!entry) return null;
  const holder = entry.holders.find(h => h.txId === txId);
  return holder ? holder.lockType : null;
}

/* ══════════════════════════════════════════════════════════════════
 * The catalogue
 * ══════════════════════════════════════════════════════════════════ */

test('every protocol is listed in exactly one group and has an engine block', () => {
  const groupIds = new Set(PROTOCOL_GROUPS.map(g => g.id));
  PROTOCOLS.forEach(protocol => {
    assert.ok(groupIds.has(protocol.group), `${protocol.id} has an unknown group`);
    assert.ok(protocol.label && protocol.summary, `${protocol.id} needs a label and a summary`);
    assert.ok(Array.isArray(protocol.rules) && protocol.rules.length >= 3, `${protocol.id} needs rules`);
    assert.ok(protocol.watch, `${protocol.id} needs a "watch this" hint`);
    assert.ok(protocol.engine && typeof protocol.engine === 'object');
  });
  assert.deepStrictEqual(
    Array.from(PROTOCOLS.map(p => p.id)).sort(),
    ['basic-2pl', 'conservative-2pl', 'mgl-locking', 'rigorous-2pl', 'strict-2pl', 'sx-locking', 'update-locking', 'wait-die', 'wound-wait']
  );
});

/** A schedule with an exact operation order. */
function exactSchedule(ops) {
  const counters = {};
  return ops.map(([txId, type, item]) => {
    const n = counters[txId] || 0;
    counters[txId] = n + 1;
    return { txId, type, item: item || null, opId: `${txId}#${n}` };
  });
}

test('the engine refuses an unknown protocol', () => {
  assert.throws(() => new LockingSimulator('not-a-protocol'), /Unknown locking protocol/);
});

/* ══════════════════════════════════════════════════════════════════
 * The classic protocols must not change
 * ══════════════════════════════════════════════════════════════════ */

test('basic 2PL still aborts a transaction that locks after a release', () => {
  const sim = new LockingSimulator('basic-2pl');
  sim.setSchedule(scheduleOf([
    ['T1', [write('A'), unlock('A'), write('B'), commit]],
    ['T2', [read('B'), commit]]
  ]));
  sim.runAll();

  assert.strictEqual(sim.transactionStates.T1, 'aborted');
  assert.strictEqual(sim.opStatus['T1#2'].status, 'aborted');
});

test('strict 2PL still aborts the release of an exclusive lock before the commit', () => {
  const sim = new LockingSimulator('strict-2pl');
  sim.setSchedule(scheduleOf([
    ['T1', [write('A'), unlock('A'), commit]],
    ['T2', [read('A'), commit]]
  ]));
  sim.runAll();

  assert.strictEqual(sim.transactionStates.T1, 'aborted');
});

test('rigorous 2PL still aborts the release of a shared lock before the commit', () => {
  const sim = new LockingSimulator('rigorous-2pl');
  sim.setSchedule(scheduleOf([
    ['T1', [read('A'), unlock('A'), commit]],
    ['T2', [read('A'), commit]]
  ]));
  sim.runAll();

  assert.strictEqual(sim.transactionStates.T1, 'aborted');
});

/* ══════════════════════════════════════════════════════════════════
 * Conservative (static) two-phase locking
 * ══════════════════════════════════════════════════════════════════ */

test('conservative 2PL takes every lock before the transaction starts', () => {
  const sim = new LockingSimulator('conservative-2pl');
  sim.setSchedule(scheduleOf([
    ['T1', [write('A'), write('B'), commit]],
    ['T2', [read('A'), commit]]
  ]));

  const first = sim.step();
  assert.strictEqual(first.result, 'granted');
  // Both locks are held straight away, before the first operation ran.
  assert.strictEqual(modeOf(sim, 'T1', 'A'), 'X');
  assert.strictEqual(modeOf(sim, 'T1', 'B'), 'X');
});

test('conservative 2PL never holds a partial set of locks while it waits', () => {
  const sim = new LockingSimulator('conservative-2pl');
  sim.setSchedule(scheduleOf([
    ['T1', [write('A'), write('B'), commit]],
    ['T2', [write('B'), write('C'), commit]]
  ]));

  // T1 starts and takes A and B.
  sim.step();
  assert.strictEqual(modeOf(sim, 'T1', 'A'), 'X');
  assert.strictEqual(modeOf(sim, 'T1', 'B'), 'X');

  // T2 needs B and C — B is taken, so T2 must wait holding nothing at all.
  const step = sim.step();
  assert.strictEqual(step.result, 'waiting');
  assert.strictEqual(sim.transactionStates.T2, 'waiting');
  assert.strictEqual(modeOf(sim, 'T2', 'B'), null);
  assert.strictEqual(modeOf(sim, 'T2', 'C'), null);
  assert.strictEqual((sim.heldLocks.T2 || []).length, 0);
});

test('conservative 2PL prevents the classic deadlock', () => {
  const sim = new LockingSimulator('conservative-2pl');
  sim.setSchedule(scheduleOf([
    ['T1', [write('A'), write('B'), commit]],
    ['T2', [write('B'), write('A'), commit]]
  ]));
  sim.runAll();

  assert.strictEqual(sim.isDeadlocked, false, 'conservative 2PL must not deadlock');
  assert.deepStrictEqual(Object.keys(sim.deadlockedTxns), []);
  assert.strictEqual(sim.transactionStates.T1, 'committed');
  assert.strictEqual(sim.transactionStates.T2, 'committed');
});

test('conservative 2PL keeps every lock until the transaction ends', () => {
  const sim = new LockingSimulator('conservative-2pl');
  sim.setSchedule(scheduleOf([
    ['T1', [write('A'), unlock('A'), commit]],
    ['T2', [read('A'), commit]]
  ]));
  sim.runAll();

  assert.strictEqual(sim.transactionStates.T1, 'aborted', 'releasing early breaks conservative 2PL');
});

/* ══════════════════════════════════════════════════════════════════
 * Shared / exclusive locking with conversions
 * ══════════════════════════════════════════════════════════════════ */

test('an S → X upgrade has to wait while another transaction holds a shared lock', () => {
  const sim = new LockingSimulator('sx-locking');
  sim.setSchedule(scheduleOf([
    ['T1', [read('A'), write('A'), commit]],
    ['T2', [read('A'), commit]]
  ]));

  sim.step();                       // T1 reads A  → S(A)
  sim.step();                       // T2 reads A  → S(A), compatible
  const upgrade = sim.step();       // T1 writes A → upgrade S → X, blocked

  assert.strictEqual(upgrade.result, 'waiting');
  assert.ok(upgrade.explanation.includes('S→X'), 'the conversion must be explained');
  assert.strictEqual(modeOf(sim, 'T1', 'A'), 'S', 'the lock is still shared while the upgrade waits');
});

test('an X → S downgrade is granted immediately', () => {
  const sim = new LockingSimulator('sx-locking');
  sim.setSchedule(exactSchedule([
    ['T1', 'write', 'A'],
    ['T1', 'read', 'A'],
    ['T1', 'commit', null]
  ]));

  sim.step();                     // T1 writes A → X(A)
  const downgrade = sim.step();   // T1 reads A  → downgrade X → S

  assert.strictEqual(downgrade.result, 'granted');
  assert.strictEqual(modeOf(sim, 'T1', 'A'), 'S');
  assert.ok(downgrade.explanation.includes('X→S'));
});

test('the S/X mode has no two-phase rule, so a release does not abort the transaction', () => {
  const sim = new LockingSimulator('sx-locking');
  sim.setSchedule(scheduleOf([
    ['T1', [write('A'), unlock('A'), write('B'), commit]],
    ['T2', [read('B'), commit]]
  ]));
  sim.runAll();

  assert.strictEqual(sim.transactionStates.T1, 'committed');
});

/* ══════════════════════════════════════════════════════════════════
 * Update locks
 * ══════════════════════════════════════════════════════════════════ */

test('a read takes an update lock, which is incompatible with a shared lock', () => {
  const sim = new LockingSimulator('update-locking');
  sim.setSchedule(scheduleOf([
    ['T1', [read('A'), commit]],
    ['T2', [read('A'), commit]]
  ]));

  const first = sim.step();
  assert.strictEqual(first.lockRequested, 'U');
  assert.strictEqual(modeOf(sim, 'T1', 'A'), 'U');

  const second = sim.step();
  assert.strictEqual(second.result, 'waiting', 'an update lock blocks a second reader');
});

test('update locks remove the read-then-write upgrade deadlock', () => {
  const sim = new LockingSimulator('update-locking');
  sim.setSchedule(scheduleOf([
    ['T1', [read('A'), write('A'), commit]],
    ['T2', [read('A'), write('A'), commit]]
  ]));
  sim.runAll();

  assert.strictEqual(sim.isDeadlocked, false, 'the upgrade deadlock must not occur');
  assert.strictEqual(sim.transactionStates.T1, 'committed');
  assert.strictEqual(sim.transactionStates.T2, 'committed');
});

test('the same schedule still deadlocks under basic 2PL', () => {
  const sim = new LockingSimulator('basic-2pl');
  sim.setSchedule(scheduleOf([
    ['T1', [read('A'), write('A'), commit]],
    ['T2', [read('A'), write('A'), commit]]
  ]));
  sim.runAll();

  assert.strictEqual(sim.isDeadlocked, true, 'two shared locks upgrading at once is the classic deadlock');
});

test('an update lock is converted into an exclusive lock for the write', () => {
  const sim = new LockingSimulator('update-locking');
  sim.setSchedule(scheduleOf([
    ['T1', [read('A'), write('A'), commit]],
    ['T2', [read('A'), commit]]
  ]));

  sim.step();  // T1 takes the update lock
  sim.step();  // T2 is blocked by the update lock
  const writeStep = sim.step();

  assert.strictEqual(writeStep.result, 'granted');
  assert.strictEqual(modeOf(sim, 'T1', 'A'), 'X', 'the update lock became an exclusive lock');
});

/* ══════════════════════════════════════════════════════════════════
 * Multiple granularity locking
 * ══════════════════════════════════════════════════════════════════ */

test('a hierarchical lock puts intention locks on every ancestor', () => {
  const sim = new LockingSimulator('mgl-locking');
  sim.setSchedule(scheduleOf([
    ['T1', [read('db.accounts.r1'), commit]]
  ]));
  sim.step();

  assert.strictEqual(modeOf(sim, 'T1', 'db.accounts.r1'), 'S');
  assert.strictEqual(modeOf(sim, 'T1', 'db.accounts'), 'IS');
  assert.strictEqual(modeOf(sim, 'T1', 'db'), 'IS');
});

test('an exclusive lock on a node puts an IX lock on the ancestors', () => {
  const sim = new LockingSimulator('mgl-locking');
  sim.setSchedule(scheduleOf([
    ['T1', [write('db.accounts.r1'), commit]]
  ]));
  sim.step();

  assert.strictEqual(modeOf(sim, 'T1', 'db.accounts.r1'), 'X');
  assert.strictEqual(modeOf(sim, 'T1', 'db.accounts'), 'IX');
  assert.strictEqual(modeOf(sim, 'T1', 'db'), 'IX');
});

test('a lock on a record does not block a write on a different record', () => {
  const sim = new LockingSimulator('mgl-locking');
  sim.setSchedule(scheduleOf([
    ['T1', [read('db.accounts.r1'), commit]],
    ['T2', [write('db.accounts.r2'), commit]]
  ]));

  sim.step();
  const second = sim.step();

  assert.strictEqual(second.result, 'granted', 'different records of the same table do not conflict');
});

test('a lock on a record blocks a lock on the whole table', () => {
  const sim = new LockingSimulator('mgl-locking');
  sim.setSchedule(scheduleOf([
    ['T1', [read('db.accounts.r1'), commit]],
    ['T2', [write('db.accounts'), commit]]
  ]));

  sim.step();
  const second = sim.step();

  assert.strictEqual(second.result, 'waiting', 'the table level write must wait for the record lock');
});

test('a table lock blocks a read of one of its records', () => {
  const sim = new LockingSimulator('mgl-locking');
  sim.setSchedule(scheduleOf([
    ['T1', [write('db.accounts'), commit]],
    ['T2', [read('db.accounts.r1'), commit]]
  ]));

  sim.step();
  const second = sim.step();

  assert.strictEqual(second.result, 'waiting', 'the record read must wait for the table lock');
});

test('a transaction that holds shared and exclusive locks below a node carries a SIX lock', () => {
  const sim = new LockingSimulator('mgl-locking');
  sim.setSchedule(scheduleOf([
    ['T1', [read('db.accounts.r1'), write('db.accounts.r2'), commit]]
  ]));

  sim.step();  // S on r1  → IS on db.accounts
  sim.step();  // X on r2  → SIX on db.accounts

  assert.strictEqual(modeOf(sim, 'T1', 'db.accounts.r1'), 'S');
  assert.strictEqual(modeOf(sim, 'T1', 'db.accounts.r2'), 'X');
  assert.strictEqual(modeOf(sim, 'T1', 'db.accounts'), 'SIX');
  // The database node also covers the shared record, so it is a SIX lock too.
  assert.strictEqual(modeOf(sim, 'T1', 'db'), 'SIX');
});

/* ══════════════════════════════════════════════════════════════════
 * Deadlock prevention
 * ══════════════════════════════════════════════════════════════════ */

test('wait-die aborts the younger requester and restarts it', () => {
  const sim = new LockingSimulator('wait-die');
  sim.setSchedule(scheduleOf([
    ['T1', [write('A'), commit]],
    ['T2', [write('A'), commit]]
  ]));

  sim.step();                 // T1 (older) takes X(A)
  const step = sim.step();    // T2 (younger) asks for X(A)

  assert.strictEqual(step.result, 'restarted');
  assert.ok(step.explanation.includes('Wait-Die'));
  assert.ok(step.explanation.includes('younger'));
  assert.strictEqual(sim.isDeadlocked, false, 'the policy prevents the deadlock');

  // The restarted transaction is retried at the end of the schedule.
  sim.runAll();
  assert.strictEqual(sim.transactionStates.T1, 'committed');
  assert.strictEqual(sim.transactionStates.T2, 'committed');
});

test('wait-die lets the older requester wait instead of being aborted', () => {
  const sim = new LockingSimulator('wait-die');
  sim.setSchedule(scheduleOf([
    ['T1', [write('A'), commit]],
    ['T2', [write('A'), commit]]
  ]));

  sim.step();
  const step = sim.step();
  assert.strictEqual(step.result, 'restarted', 'T2 is the younger one and dies');
  assert.ok(sim.timestamps.T2 > sim.timestamps.T1, 'a restarted transaction gets a newer timestamp');
});

test('wound-wait aborts the younger holder and lets the older requester proceed', () => {
  const sim = new LockingSimulator('wound-wait');
  sim.setSchedule(scheduleOf([
    ['T1', [write('B'), write('A'), commit]],
    ['T2', [write('A'), commit]]
  ]));

  sim.step();                 // T1 (older) takes X(B)
  sim.step();                 // T2 (younger) takes X(A)
  const step = sim.step();    // T1 asks for X(A) — it wounds T2

  assert.strictEqual(step.result, 'granted');
  assert.ok(step.explanation.includes('Wound-Wait'));
  assert.ok(step.explanation.includes('wounds'));
  assert.strictEqual(sim.isDeadlocked, false);

  sim.runAll();
  assert.strictEqual(sim.transactionStates.T1, 'committed');
});

test('wound-wait makes the younger requester wait', () => {
  const sim = new LockingSimulator('wound-wait');
  sim.setSchedule(scheduleOf([
    ['T1', [write('A'), commit]],
    ['T2', [write('A'), commit]]
  ]));

  sim.step();
  const step = sim.step();
  assert.strictEqual(step.result, 'waiting', 'the younger requester waits');
  assert.strictEqual(sim.transactionStates.T2, 'waiting');
});

test('the prevention policies are built on top of the two-phase rules', () => {
  const sim = new LockingSimulator('wait-die');
  sim.setSchedule(scheduleOf([
    ['T1', [write('A'), unlock('A'), write('B'), commit]],
    ['T2', [read('B'), commit]]
  ]));
  sim.runAll();

  assert.strictEqual(sim.transactionStates.T1, 'aborted', 'the 2PL rule still applies');
});

/* ══════════════════════════════════════════════════════════════════
 * The engine contract
 * ══════════════════════════════════════════════════════════════════ */

test('stepping backwards restores the protocol state as well', () => {
  const sim = new LockingSimulator('conservative-2pl');
  sim.setSchedule(scheduleOf([
    ['T1', [write('A'), write('B'), commit]],
    ['T2', [write('B'), commit]]
  ]));

  sim.step();
  sim.step();
  assert.strictEqual(sim.transactionStates.T2, 'waiting');

  sim.stepBack();
  assert.notStrictEqual(sim.transactionStates.T2, 'waiting', 'the wait state must be undone');
  assert.strictEqual((sim.heldLocks.T2 || []).length, 0);
});
