/**
 * Tests for the per-transaction operation tracking used by the
 * transaction-columns view (T1 | T2 | T3 ...).
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Load the browser scripts into a tiny sandbox so we can unit-test the engine.
function loadSimulator() {
  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  ['js/protocols.js', 'js/simulator.js'].forEach(file => {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    vm.runInContext(source, sandbox);
  });
  return sandbox.window.LockingSimulator;
}

const LockingSimulator = loadSimulator();

test('every scheduled operation gets a stable id and a per-transaction list', () => {
  const sim = new LockingSimulator('basic-2pl');
  sim.setSchedule([
    { txId: 'T1', type: 'read', item: 'A' },
    { txId: 'T2', type: 'read', item: 'B' },
    { txId: 'T1', type: 'write', item: 'A' },
    { txId: 'T2', type: 'commit', item: null }
  ]);

  assert.deepStrictEqual(Object.keys(sim.txOperations).sort(), ['T1', 'T2']);
  assert.strictEqual(sim.txOperations.T1.length, 2);
  assert.strictEqual(sim.txOperations.T2.length, 2);
  assert.strictEqual(sim.txOperations.T1[0].opId, 'T1#0');
  assert.strictEqual(sim.txOperations.T1[1].opId, 'T1#1');
  assert.strictEqual(sim.txOperations.T2[0].opId, 'T2#0');
});

test('operation status tracks granted / committed states', () => {
  const sim = new LockingSimulator('basic-2pl');
  sim.setSchedule([
    { txId: 'T1', type: 'read', item: 'A' },
    { txId: 'T1', type: 'commit', item: null }
  ]);
  sim.runAll();

  assert.strictEqual(sim.opStatus['T1#0'].status, 'granted');
  assert.strictEqual(sim.opStatus['T1#0'].lockType, 'S');
  assert.strictEqual(sim.opStatus['T1#1'].status, 'committed');
});

test('a blocked operation is reported as waiting and later as unblocked', () => {
  const sim = new LockingSimulator('strict-2pl');
  sim.setSchedule([
    { txId: 'T1', type: 'write', item: 'A' },
    { txId: 'T2', type: 'read', item: 'A' },
    { txId: 'T1', type: 'commit', item: null },
    { txId: 'T2', type: 'commit', item: null }
  ]);

  let sawWaiting = false;
  let sawUnblocked = false;
  while (!sim.isComplete()) {
    const step = sim.step();
    if (step.result === 'waiting' && sim.opStatus['T2#0'].status === 'waiting') sawWaiting = true;
    if (sawWaiting && sim.opStatus['T2#0'].status === 'unblocked') sawUnblocked = true;
  }

  assert.ok(sawWaiting, 'T2 should wait for the X-lock on A');
  assert.ok(sawUnblocked, 'T2 should be unblocked once T1 commits');
  assert.strictEqual(sim.opStatus['T2#0'].status, 'granted');
  assert.strictEqual(sim.transactionStates.T2, 'committed');
});

test('lock upgrades are flagged on the operation record', () => {
  const sim = new LockingSimulator('basic-2pl');
  sim.setSchedule([
    { txId: 'T1', type: 'read', item: 'A' },
    { txId: 'T1', type: 'write', item: 'A' },
    { txId: 'T1', type: 'commit', item: null }
  ]);
  sim.runAll();

  assert.strictEqual(sim.opStatus['T1#0'].upgraded, false);
  assert.strictEqual(sim.opStatus['T1#1'].upgraded, true);
  assert.strictEqual(sim.opStatus['T1#1'].lockType, 'X');
});

test('deadlock scenario marks the waiting operation as deadlocked', () => {
  const sim = new LockingSimulator('basic-2pl');
  sim.setSchedule([
    { txId: 'T1', type: 'write', item: 'A' },
    { txId: 'T2', type: 'write', item: 'B' },
    { txId: 'T1', type: 'write', item: 'B' },
    { txId: 'T2', type: 'write', item: 'A' }
  ]);
  const steps = sim.runAll();
  const last = steps[steps.length - 1];

  assert.ok(last.isDeadlocked, 'deadlock should be detected');
  assert.deepStrictEqual(Array.from(last.deadlockedTxns).sort(), ['T1', 'T2']);
  assert.strictEqual(sim.opStatus['T2#1'].status, 'deadlock');
  assert.strictEqual(sim.opStatus['T1#1'].status, 'waiting');
});

test('a step result stays small — the timeline is not nested inside every step', () => {
  const sim = new LockingSimulator('basic-2pl');
  const schedule = [];
  for (let i = 0; i < 30; i++) {
    schedule.push({ txId: 'T1', type: 'read', item: `I${i}` });
    schedule.push({ txId: 'T2', type: 'read', item: `I${i}` });
  }
  sim.setSchedule(schedule);
  const steps = sim.runAll();

  assert.strictEqual(steps.length, 60);
  // The payload must stay linear in the number of steps.
  const payload = JSON.stringify(steps);
  assert.ok(payload.length < 400 * 1024, `payload too large: ${payload.length} bytes`);
  assert.strictEqual(steps[0].timeline, undefined, 'steps must not embed a timeline copy');
});

test('step back restores the operation status snapshot', () => {
  const sim = new LockingSimulator('basic-2pl');
  sim.setSchedule([
    { txId: 'T1', type: 'read', item: 'A' },
    { txId: 'T1', type: 'commit', item: null }
  ]);
  sim.step();
  sim.step();
  assert.strictEqual(sim.opStatus['T1#1'].status, 'committed');

  sim.stepBack();
  assert.strictEqual(sim.opStatus['T1#1'].status, 'pending');
  assert.strictEqual(sim.opStatus['T1#0'].status, 'granted');
});

test('an unlock operation is reported as released', () => {
  const sim = new LockingSimulator('basic-2pl');
  sim.setSchedule([
    { txId: 'T1', type: 'write', item: 'A' },
    { txId: 'T1', type: 'unlock', item: 'A' },
    { txId: 'T1', type: 'commit', item: null }
  ]);
  sim.runAll();

  assert.strictEqual(sim.opStatus['T1#0'].status, 'granted');
  assert.strictEqual(sim.opStatus['T1#1'].status, 'released');
  assert.strictEqual(sim.opStatus['T1#1'].lockType, 'X');
  assert.strictEqual(sim.opStatus['T1#2'].status, 'committed');
});

test('a strict 2PL violation aborts the transaction and its operations', () => {
  const sim = new LockingSimulator('strict-2pl');
  sim.setSchedule([
    { txId: 'T1', type: 'write', item: 'A' },
    { txId: 'T1', type: 'unlock', item: 'A' },
    { txId: 'T1', type: 'commit', item: null }
  ]);
  sim.runAll();

  assert.strictEqual(sim.transactionStates.T1, 'aborted');
  assert.strictEqual(sim.opStatus['T1#1'].status, 'aborted');
  // Operations after the abort are ignored
  assert.strictEqual(sim.opStatus['T1#2'].status, 'ignored');
});

test('a basic 2PL violation aborts the transaction when a lock is taken after a release', () => {
  const sim = new LockingSimulator('basic-2pl');
  sim.setSchedule([
    { txId: 'T1', type: 'write', item: 'A' },
    { txId: 'T1', type: 'unlock', item: 'A' },
    { txId: 'T1', type: 'write', item: 'B' },
    { txId: 'T1', type: 'commit', item: null }
  ]);
  sim.runAll();

  assert.strictEqual(sim.transactionStates.T1, 'aborted');
  assert.strictEqual(sim.opStatus['T1#2'].status, 'aborted');
});
