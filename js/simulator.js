/**
 * simulator.js — The locking protocol engine.
 *
 * The engine executes a transaction schedule step by step and keeps the live
 * state that every visualisation reads:
 *
 *   lockTable        item -> { holders:[{txId,lockType}], queue:[waiters] }
 *   heldLocks        txId -> [{ item, lockType }]
 *   waitForGraph     waiter -> [holders it waits for]
 *   transactionStates txId -> active | waiting | committed | aborted
 *   opStatus         opId -> per-operation execution state
 *
 * The behaviour of a run is driven entirely by the `rules` block of the
 * selected protocol (see js/protocols.js) — there is no per-protocol special
 * case hidden anywhere else in this file.
 */

/* ── Lock compatibility tables ──────────────────────────────────────────
 * A request may be granted while another transaction holds a lock when the
 * two modes are listed as compatible.
 */

/* Flat locking: S (shared), U (update) and X (exclusive). */
const FLAT_COMPATIBILITY = {
  S: { S: true, U: false, X: false },
  U: { S: false, U: false, X: false },
  X: { S: false, U: false, X: false }
};

/* Multiple granularity locking: IS, IX, S, SIX and X. */
const HIER_COMPATIBILITY = {
  IS: { IS: true, IX: true, S: true, SIX: true, X: false },
  IX: { IS: true, IX: false, S: false, SIX: false, X: false },
  S: { IS: true, IX: false, S: true, SIX: false, X: false },
  SIX: { IS: true, IX: false, S: false, SIX: false, X: false },
  X: { IS: false, IX: false, S: false, SIX: false, X: false }
};

const INTENTION_MODES = ['IS', 'IX', 'SIX'];

/** How often a transaction may be restarted by a prevention policy. */
const MAX_RESTARTS = 3;

class LockingSimulator {
  constructor(protocol = 'basic-2pl') {
    this.protocol = protocol;
    this.rules = LockingSimulator.rulesFor(protocol);
    this.reset();
  }

  /* ══════════════════════════════════════════════════════════════════
   * Protocol rules
   * ══════════════════════════════════════════════════════════════════ */

  static rulesFor(protocol) {
    const base = {
      twoPhase: false,
      holdXUntilCommit: false,
      holdAllUntilCommit: false,
      conservative: false,
      conversions: false,
      updateLock: false,
      granularity: false,
      prevention: null,
      treeProtocol: false
    };

    const catalogue = (typeof window !== 'undefined' && window.PROTOCOL_BY_ID) || null;
    if (catalogue && !catalogue[protocol]) {
      throw new Error(`Unknown locking protocol: "${protocol}"`);
    }
    const definition = catalogue ? catalogue[protocol] : null;
    return Object.assign(base, (definition && definition.engine) || {});
  }

  /* ══════════════════════════════════════════════════════════════════
   * Schedule handling
   * ══════════════════════════════════════════════════════════════════ */

  setSchedule(schedule) {
    this.schedule = JSON.parse(JSON.stringify(schedule)); // deep copy
    this._indexOperations();
    this.reset();
  }

  /**
   * Give every scheduled operation a stable identity and build the
   * per-transaction operation list used by the transaction-column view.
   * Each transaction keeps the order of its own operations, independent of
   * how the transactions are interleaved in the global schedule.
   */
  _indexOperations() {
    const perTx = {};
    const counters = {};

    for (const op of this.schedule) {
      const n = counters[op.txId] || 0;
      counters[op.txId] = n + 1;
      op.opId = `${op.txId}#${n}`;

      if (!perTx[op.txId]) perTx[op.txId] = [];
      perTx[op.txId].push({
        opId: op.opId,
        type: op.type,
        item: op.item
      });
    }

    this.txOperations = perTx;
  }

  reset() {
    this.currentStepIndex = 0;
    this.lockTable = {};
    this.waitForGraph = {};
    this.transactionStates = {}; // 'active', 'waiting', 'committed', 'aborted'
    this.transactionPhases = {}; // 'growing', 'shrinking'
    this.heldLocks = {}; // txId -> [ {item, lockType} ]
    this.isDeadlocked = false;
    this.deadlockedTxns = [];
    this.timeline = [];
    this.history = []; // To store states for stepBack
    this.unblockedQueue = []; // Operations that got unblocked and need to be processed
    this.pendingOperations = {}; // txId -> [ operations ] for ops that arrive while tx is waiting
    this.opStatus = {}; // opId -> { opId, txId, type, item, status, lockType, stepNumber }
    if (!this.txOperations) this.txOperations = {};

    /* Protocol specific state */
    this.conservativeStarted = {}; // txId -> true once all its locks are held
    this.timestamps = {}; // txId -> timestamp used by the prevention policies
    this.timestampCounter = 0;
    this.restartCount = {}; // txId -> how often it was restarted

    // Pre-create a status record for every scheduled operation so that the
    // transaction-column view can show pending operations before they run.
    Object.keys(this.txOperations).forEach(txId => {
      this.txOperations[txId].forEach(op => {
        this.opStatus[op.opId] = {
          opId: op.opId,
          txId,
          type: op.type,
          item: op.item,
          status: 'pending',
          lockType: null,
          upgraded: false,
          stepNumber: null
        };
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════════
   * Operation status tracking
   * ══════════════════════════════════════════════════════════════════ */

  /** Make sure an operation has a status record (default: not executed yet). */
  _ensureOpStatus(op) {
    if (!op || !op.opId) return null;
    if (!this.opStatus[op.opId]) {
      this.opStatus[op.opId] = {
        opId: op.opId,
        txId: op.txId,
        type: op.type,
        item: op.item,
        status: 'pending',
        lockType: null,
        upgraded: false,
        stepNumber: null
      };
    }
    return this.opStatus[op.opId];
  }

  /** Update the status of an operation. */
  _setOpStatus(op, status, extra = {}) {
    const record = this._ensureOpStatus(op);
    if (!record) return;
    record.status = status;
    Object.assign(record, extra);
  }

  /** Is the transaction currently holding a lock of the given type on the item? */
  _holdsLock(txId, item, lockType) {
    const entry = this.lockTable[item];
    if (!entry) return false;
    return entry.holders.some(h => h.txId === txId && h.lockType === lockType);
  }

  /** The lock type a transaction currently holds on an item (or null). */
  _heldMode(txId, item) {
    const entry = this.lockTable[item];
    if (!entry) return null;
    const holder = entry.holders.find(h => h.txId === txId);
    return holder ? holder.lockType : null;
  }

  deepCopyState() {
    return {
      currentStepIndex: this.currentStepIndex,
      lockTable: JSON.parse(JSON.stringify(this.lockTable)),
      waitForGraph: JSON.parse(JSON.stringify(this.waitForGraph)),
      transactionStates: JSON.parse(JSON.stringify(this.transactionStates)),
      transactionPhases: JSON.parse(JSON.stringify(this.transactionPhases)),
      heldLocks: JSON.parse(JSON.stringify(this.heldLocks)),
      isDeadlocked: this.isDeadlocked,
      deadlockedTxns: JSON.parse(JSON.stringify(this.deadlockedTxns)),
      // The step results are immutable snapshots, so copying the list is enough.
      timeline: [...this.timeline],
      unblockedQueue: JSON.parse(JSON.stringify(this.unblockedQueue)),
      pendingOperations: JSON.parse(JSON.stringify(this.pendingOperations)),
      opStatus: JSON.parse(JSON.stringify(this.opStatus)),
      txOperations: JSON.parse(JSON.stringify(this.txOperations)),
      conservativeStarted: JSON.parse(JSON.stringify(this.conservativeStarted)),
      timestamps: JSON.parse(JSON.stringify(this.timestamps)),
      timestampCounter: this.timestampCounter,
      restartCount: JSON.parse(JSON.stringify(this.restartCount))
    };
  }

  restoreState(state) {
    this.currentStepIndex = state.currentStepIndex;
    this.lockTable = state.lockTable;
    this.waitForGraph = state.waitForGraph;
    this.transactionStates = state.transactionStates;
    this.transactionPhases = state.transactionPhases;
    this.heldLocks = state.heldLocks;
    this.isDeadlocked = state.isDeadlocked;
    this.deadlockedTxns = state.deadlockedTxns;
    this.timeline = state.timeline;
    this.unblockedQueue = state.unblockedQueue;
    this.pendingOperations = state.pendingOperations;
    this.opStatus = state.opStatus || {};
    this.txOperations = state.txOperations || {};
    this.conservativeStarted = state.conservativeStarted || {};
    this.timestamps = state.timestamps || {};
    this.timestampCounter = state.timestampCounter || 0;
    this.restartCount = state.restartCount || {};
  }

  isComplete() {
    return this.isDeadlocked || (this.currentStepIndex >= this.schedule.length && this.unblockedQueue.length === 0);
  }

  getCurrentStep() {
    return this.timeline.length;
  }

  getTotalSteps() {
    return this.schedule ? this.schedule.length : 0;
  }

  stepBack() {
    if (this.history.length > 0) {
      const prevState = this.history.pop();
      this.restoreState(prevState);
    }
  }

  getState() {
    return {
      stepNumber: this.getCurrentStep(),
      lockTable: JSON.parse(JSON.stringify(this.lockTable)),
      waitForGraph: JSON.parse(JSON.stringify(this.waitForGraph)),
      transactionStates: JSON.parse(JSON.stringify(this.transactionStates)),
      isDeadlocked: this.isDeadlocked,
      deadlockedTxns: [...this.deadlockedTxns],
      timeline: [...this.timeline],
      opStatus: JSON.parse(JSON.stringify(this.opStatus)),
      txOperations: JSON.parse(JSON.stringify(this.txOperations))
    };
  }

  /* ══════════════════════════════════════════════════════════════════
   * Deadlock detection
   * ══════════════════════════════════════════════════════════════════ */

  _detectDeadlock() {
    const visited = {};
    const recursionStack = {};
    let deadlocked = [];

    const dfs = (node, path) => {
      visited[node] = true;
      recursionStack[node] = true;
      path.push(node);

      if (this.waitForGraph[node]) {
        for (let neighbor of this.waitForGraph[node]) {
          if (!visited[neighbor]) {
            if (dfs(neighbor, path)) return true;
          } else if (recursionStack[neighbor]) {
            // Cycle detected
            const cycleStartIndex = path.indexOf(neighbor);
            deadlocked = path.slice(cycleStartIndex);
            return true;
          }
        }
      }
      recursionStack[node] = false;
      path.pop();
      return false;
    };

    for (let node in this.waitForGraph) {
      if (!visited[node]) {
        if (dfs(node, [])) {
          this.isDeadlocked = true;
          this.deadlockedTxns = [...new Set(deadlocked)];
          return true;
        }
      }
    }

    this.isDeadlocked = false;
    this.deadlockedTxns = [];
    return false;
  }

  _updateWaitForGraph() {
    this.waitForGraph = {};
    for (let item in this.lockTable) {
      const tableEntry = this.lockTable[item];
      for (let waiter of tableEntry.queue) {
        if (!this.waitForGraph[waiter.txId]) {
          this.waitForGraph[waiter.txId] = [];
        }
        for (let holder of tableEntry.holders) {
          if (waiter.txId !== holder.txId && !this.waitForGraph[waiter.txId].includes(holder.txId)) {
            this.waitForGraph[waiter.txId].push(holder.txId);
          }
        }
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════
   * Hierarchical (multiple granularity) helpers
   * ══════════════════════════════════════════════════════════════════ */

  _pathOf(item) {
    return String(item == null ? '' : item).split('.').map(s => s.trim()).filter(Boolean);
  }

  /** The proper ancestors of a path, closest first. */
  _ancestorsOf(path) {
    const ancestors = [];
    for (let i = path.length - 1; i > 0; i--) ancestors.push(path.slice(0, i).join('.'));
    return ancestors;
  }

  /** Is `node` a strict descendant of the given path? */
  _isDescendant(node, path) {
    const candidate = this._pathOf(node);
    if (candidate.length <= path.length) return false;
    return path.every((segment, index) => candidate[index] === segment);
  }

  /** The intention mode a transaction needs on an ancestor. */
  _intentModeFor(ancestor, txId, requestedType, planned) {
    const ancestorPath = this._pathOf(ancestor);
    let hasShared = false;
    let hasExclusive = false;

    const consider = mode => {
      if (mode === 'S' || mode === 'IS') hasShared = true;
      if (mode === 'X' || mode === 'IX' || mode === 'SIX') hasExclusive = true;
    };

    // Locks the transaction already holds below this ancestor.
    Object.keys(this.lockTable).forEach(node => {
      if (node === ancestor) return;
      if (!this._isDescendant(node, ancestorPath)) return;
      this.lockTable[node].holders.forEach(holder => {
        if (holder.txId === txId) consider(holder.lockType);
      });
    });

    // Intention locks that are going to be placed on the deeper ancestors.
    if (planned) {
      planned.forEach((mode, node) => {
        if (node === ancestor) return;
        if (!this._isDescendant(node, ancestorPath)) return;
        consider(mode);
      });
    }

    const wantsExclusive = requestedType === 'X' || requestedType === 'IX' || requestedType === 'SIX';

    if (wantsExclusive) {
      // An exclusive intention is needed below this ancestor; a shared lock
      // that is already held below it turns it into a SIX lock.
      if (hasShared) return 'SIX';
      return 'IX';
    }
    if (hasExclusive) return 'SIX';
    return 'IS';
  }

  /** Can the transaction hold `current` and move on to `needed`? */
  _upgradeMode(current, needed) {
    if (current === needed) return current;
    if (current === 'IS' && (needed === 'IX' || needed === 'SIX')) return needed;
    if (current === 'IX' && needed === 'SIX') return 'SIX';
    if (current === 'S' && needed === 'X') return 'X';
    if (current === 'U' && needed === 'X') return 'X'; // update lock → exclusive
    if (current === 'X' && needed === 'S') return 'S'; // downgrade
    return null;
  }

  /* ══════════════════════════════════════════════════════════════════
   * Lock granting
   * ══════════════════════════════════════════════════════════════════ */

  /** Is a request of `requested` compatible with a lock of `held`? */
  _compatible(requested, held) {
    if (this.rules.granularity) {
      const row = HIER_COMPATIBILITY[requested];
      return row ? !!row[held] : false;
    }
    const row = FLAT_COMPATIBILITY[requested];
    return row ? !!row[held] : false;
  }

  /** Does the mode exclude every other transaction from the item? */
  _isExclusiveMode(mode) {
    return mode === 'X' || mode === 'IX' || mode === 'SIX';
  }

  /**
   * May the transaction be granted `requestedType` on `item`?
   * Handles the flat case, the hierarchical case and the case where the
   * transaction already holds a lock on the item (upgrade / downgrade).
   */
  _canGrantLock(item, txId, requestedType) {
    if (this.rules.granularity) return this._canGrantHierarchical(item, txId, requestedType);

    const tableEntry = this.lockTable[item];
    if (!tableEntry || tableEntry.holders.length === 0) return true;

    const holders = tableEntry.holders;

    // The transaction already holds a lock on this item.
    const own = holders.find(h => h.txId === txId);
    if (own) {
      const effective = this._upgradeMode(own.lockType, requestedType);
      if (!effective) return false;
      if (effective === own.lockType) return true;
      if (effective === 'S') {
        // A downgrade: the shared lock only has to be compatible with the
        // other holders.
        return holders.every(h => h.txId === txId || this._compatible('S', h.lockType));
      }
      // An upgrade: the item has to belong to this transaction alone.
      return holders.every(h => h.txId === txId);
    }

    // Every other holder must be compatible with the request.
    return holders.every(h => this._compatible(requestedType, h.lockType));
  }

  /** Hierarchical granting: the node, its descendants and its ancestors. */
  _canGrantHierarchical(item, txId, requestedType) {
    const path = this._pathOf(item);
    const ancestors = this._ancestorsOf(path);

    // 1. The node itself and everything below it.
    for (const node of Object.keys(this.lockTable)) {
      if (node !== item && !this._isDescendant(node, path)) continue;
      for (const holder of this.lockTable[node].holders) {
        if (holder.txId === txId) continue;
        if (!this._compatible(requestedType, holder.lockType)) return false;
      }
    }

    // 2. Strong locks on an ancestor exclude the whole subtree.
    for (const ancestor of ancestors) {
      const entry = this.lockTable[ancestor];
      if (!entry) continue;
      for (const holder of entry.holders) {
        if (holder.txId === txId) continue;
        if (holder.lockType === 'S' && this._isExclusiveMode(requestedType)) return false;
        if (holder.lockType === 'IX' || holder.lockType === 'X' || holder.lockType === 'SIX') return false;
      }
    }

    // 3. The intention locks that are needed on the ancestors must be
    //    grantable as well.
    const plan = this._planIntentionLocks(item, txId, requestedType);
    for (const [ancestor, mode] of plan.entries()) {
      const entry = this.lockTable[ancestor];
      if (!entry) continue;
      const own = entry.holders.find(h => h.txId === txId);
      const effective = own ? this._upgradeMode(own.lockType, mode) : mode;
      if (!effective) return false;
      for (const holder of entry.holders) {
        if (holder.txId === txId) continue;
        if (!this._compatible(effective, holder.lockType)) return false;
      }
    }

    return true;
  }

  /** The intention locks a request needs on every ancestor, closest first. */
  _planIntentionLocks(item, txId, requestedType) {
    const plan = new Map();
    if (!this.rules.granularity) return plan;

    const ancestors = this._ancestorsOf(this._pathOf(item));
    ancestors.forEach(ancestor => {
      const mode = this._intentModeFor(ancestor, txId, requestedType, plan);
      plan.set(ancestor, mode);
    });
    return plan;
  }

  /** Record a granted lock (or upgrade an existing one). */
  _grantLock(item, txId, lockType) {
    if (this.rules.granularity) {
      const plan = this._planIntentionLocks(item, txId, lockType);
      plan.forEach((mode, ancestor) => this._grantMode(ancestor, txId, mode));
    }
    this._grantMode(item, txId, lockType);

    // Acquiring a lock means the transaction is in its growing phase.
    if (!this.transactionPhases[txId] || this.transactionPhases[txId] !== 'shrinking') {
      this.transactionPhases[txId] = 'growing';
    }
  }

  /** Put a single lock (or upgrade an existing one) into the lock table. */
  _grantMode(item, txId, lockType) {
    if (!this.lockTable[item]) {
      this.lockTable[item] = { holders: [], queue: [] };
    }
    const tableEntry = this.lockTable[item];

    const existing = tableEntry.holders.find(h => h.txId === txId);
    if (existing) {
      const effective = this._upgradeMode(existing.lockType, lockType) || existing.lockType;
      existing.lockType = effective;
      const txLocks = this.heldLocks[txId] || [];
      const txLock = txLocks.find(l => l.item === item);
      if (txLock) txLock.lockType = effective;
    } else {
      tableEntry.holders.push({ txId, lockType });
      if (!this.heldLocks[txId]) this.heldLocks[txId] = [];
      this.heldLocks[txId].push({ item, lockType });
    }
  }

  _processWaitQueues() {
    let unblockedSomething = false;
    for (let item in this.lockTable) {
      const tableEntry = this.lockTable[item];
      if (tableEntry.queue.length > 0) {
        const firstWaiter = tableEntry.queue[0];
        if (this._tryGrantWaiter(item, firstWaiter)) {
          unblockedSomething = true;
        }
      }
    }
    if (unblockedSomething) {
      this._updateWaitForGraph();
      this._detectDeadlock();
    }
  }

  /**
   * Try to serve the transaction at the head of a wait queue.
   * Conservative 2PL has to acquire the whole set at once, every other
   * protocol only needs the single item.
   */
  _tryGrantWaiter(item, waiter) {
    if (this.rules.conservative && !this.conservativeStarted[waiter.txId]) {
      return this._startConservative(waiter, item);
    }

    if (!this._canGrantLock(item, waiter.txId, waiter.lockType)) return false;

    const tableEntry = this.lockTable[item];
    tableEntry.queue.shift(); // remove from queue
    this._grantLock(item, waiter.txId, waiter.lockType);
    this.transactionStates[waiter.txId] = 'active';

    this.unblockedQueue.push({
      txId: waiter.txId,
      type: waiter.originalType,
      item: item,
      opId: waiter.opId || null,
      isUnblock: true,
      grantedLockType: waiter.lockType
    });

    // The lock is now held, but the operation itself has not run yet.
    if (waiter.opId && this.opStatus[waiter.opId]) {
      this.opStatus[waiter.opId].status = 'unblocked';
      this.opStatus[waiter.opId].lockType = waiter.lockType;
    }

    return true;
  }

  /* ══════════════════════════════════════════════════════════════════
   * Conservative (static) two-phase locking
   * ══════════════════════════════════════════════════════════════════ */

  /** Every item the transaction will read or write. */
  _requiredItems(txId) {
    const ops = this.txOperations[txId] || [];
    const items = new Set();
    ops.forEach(op => {
      if (op.type === 'read' || op.type === 'write') items.add(op.item);
    });
    return [...items];
  }

  /** The lock mode the transaction needs on each of its required items. */
  _conservativePlan(txId) {
    const ops = this.txOperations[txId] || [];
    const plan = new Map();
    ops.forEach(op => {
      if (op.type !== 'read' && op.type !== 'write') return;
      const mode = op.type === 'write' ? 'X' : 'S';
      const current = plan.get(op.item);
      if (current !== 'X') plan.set(op.item, mode);
    });
    return [...plan.entries()].map(([item, mode]) => ({ item, mode }));
  }

  /**
   * Conservative 2PL: grant the complete set of locks at once, or none.
   * Returns true when the transaction has started.
   */
  _startConservative(waiter, item) {
    const txId = waiter.txId;
    const plan = this._conservativePlan(txId);
    if (!plan.length) return false;

    // All or nothing: check every item before granting any of them.
    for (const entry of plan) {
      if (!this._canGrantLock(entry.item, txId, entry.mode)) return false;
    }

    // Grant the whole set and leave every wait queue.
    plan.forEach(entry => this._grantLock(entry.item, txId, entry.mode));
    this.conservativeStarted[txId] = true;

    for (const node in this.lockTable) {
      this.lockTable[node].queue = this.lockTable[node].queue.filter(q => q.txId !== txId);
    }

    this.transactionStates[txId] = 'active';

    this.unblockedQueue.push({
      txId,
      type: waiter.originalType,
      item: waiter.item,
      opId: waiter.opId || null,
      isUnblock: true,
      grantedLockType: waiter.lockType,
      conservative: true
    });

    if (waiter.opId && this.opStatus[waiter.opId]) {
      this.opStatus[waiter.opId].status = 'unblocked';
    }
    return true;
  }

  /* ══════════════════════════════════════════════════════════════════
   * Deadlock prevention (Wait-Die / Wound-Wait)
   * ══════════════════════════════════════════════════════════════════ */

  _timestampOf(txId) {
    if (this.timestamps[txId] === undefined) {
      this.timestampCounter += 1;
      this.timestamps[txId] = this.timestampCounter;
    }
    return this.timestamps[txId];
  }

  /**
   * Decide what happens when a request conflicts with the current holders.
   * Returns one of: 'wait', 'abort-requester' or 'abort-holder'.
   */
  _preventionDecision(requester, holders) {
    const policy = this.rules.prevention;
    if (!policy) return 'wait';

    const others = holders.filter(h => h.txId !== requester);
    if (!others.length) return 'wait';

    const ts = this._timestampOf(requester);
    const timeOf = holder => this._timestampOf(holder.txId);

    if (policy === 'wait-die') {
      // The requester dies when it is younger than one of the holders.
      const isYoungerThanHolder = others.some(holder => ts > timeOf(holder));
      return isYoungerThanHolder ? 'abort-requester' : 'wait';
    }

    // Wound-Wait: the requester wounds every holder that is younger than it.
    const isOlderThanHolder = others.some(holder => ts < timeOf(holder));
    return isOlderThanHolder ? 'abort-holder' : 'wait';
  }

  /**
   * Abort a transaction and put its work back at the END of the schedule, so
   * that it is retried once the other transactions have made progress. A
   * restarted transaction becomes the youngest one and gets a fresh timestamp.
   *
   * A transaction that keeps dying is given up after MAX_RESTARTS attempts —
   * the starvation problem that the prevention policies are known for.
   */
  _restartTransaction(txId, failedOp, reason) {
    this.restartCount[txId] = (this.restartCount[txId] || 0) + 1;

    const consumed = this.schedule.slice(0, this.currentStepIndex);
    const tail = this.schedule.slice(this.currentStepIndex);
    const mine = tail.filter(op => op.txId === txId);
    const buffered = this.pendingOperations[txId] || [];

    // The failed operation moves back into the future ...
    const wasConsumed = failedOp ? consumed.indexOf(failedOp) !== -1 : false;
    const consumedClean = wasConsumed ? consumed.filter(op => op !== failedOp) : consumed;
    // ... and the transaction's remaining work is re-queued at the end.
    this.schedule = consumedClean.concat(tail.filter(op => op.txId !== txId));
    this.currentStepIndex = consumedClean.length;

    const restartOps = [];
    if (failedOp) restartOps.push(failedOp);
    restartOps.push(...mine, ...buffered);

    this.pendingOperations[txId] = [];

    if (this.restartCount[txId] > MAX_RESTARTS) {
      // The transaction keeps losing — give it up instead of looping.
      this._releaseLocks(txId, 'all');
      this.transactionStates[txId] = 'aborted';
      restartOps.forEach(op => this._setOpStatus(op, 'ignored'));
      return false;
    }

    this.schedule = this.schedule.concat(restartOps);

    restartOps.forEach(op => {
      const record = this.opStatus[op.opId];
      if (record) {
        record.status = 'pending';
        record.lockType = null;
        record.upgraded = false;
      }
    });

    this._releaseLocks(txId, 'all');
    this.transactionStates[txId] = 'active';
    this.transactionPhases[txId] = 'growing';

    // A restarted transaction becomes the youngest one.
    this.timestampCounter += 1;
    this.timestamps[txId] = this.timestampCounter;

    return true;
  }

  /* ══════════════════════════════════════════════════════════════════
   * Lock releasing
   * ══════════════════════════════════════════════════════════════════ */

  _releaseLocks(txId, type = 'all') { // type can be 'all' or 'S'
    let releasedCount = 0;
    if (this.heldLocks[txId]) {
      const remainingLocks = [];
      for (let lock of this.heldLocks[txId]) {
        if (type === 'all' || (type === 'S' && lock.lockType === 'S')) {
          const item = lock.item;
          if (this.lockTable[item]) {
            this.lockTable[item].holders = this.lockTable[item].holders.filter(h => h.txId !== txId);
          }
          releasedCount++;
        } else {
          remainingLocks.push(lock);
        }
      }
      this.heldLocks[txId] = remainingLocks;

      if (releasedCount > 0) {
        this.transactionPhases[txId] = 'shrinking';
      }
    }
    return releasedCount;
  }

  /* ══════════════════════════════════════════════════════════════════
   * Step execution
   * ══════════════════════════════════════════════════════════════════ */

  step() {
    if (this.isComplete()) return null;

    // Save history for step back
    this.history.push(this.deepCopyState());

    let operation;
    let isFromUnblock = false;

    // Prioritize unblocked operations
    if (this.unblockedQueue.length > 0) {
      operation = this.unblockedQueue.shift();
      isFromUnblock = true;
    } else {
      operation = this.schedule[this.currentStepIndex];
      this.currentStepIndex++;

      const txId = operation.txId;
      this._ensureOpStatus(operation);

      if (!this.transactionStates[txId]) {
        this.transactionStates[txId] = 'active';
        this.pendingOperations[txId] = [];
      }
      this._timestampOf(txId);

      // If tx is waiting, queue its operations
      if (this.transactionStates[txId] === 'waiting') {
        this.pendingOperations[txId].push(operation);
        this._setOpStatus(operation, 'buffered');
        // We'll process a dummy step to show it's buffered
        const stepResult = this._createResult(operation, null, 'buffered', `Transaction ${txId} is waiting. Operation buffered.`);
        this.timeline.push(stepResult);
        return stepResult;
      }

      // If tx is aborted or committed, ignore
      if (this.transactionStates[txId] === 'aborted' || this.transactionStates[txId] === 'committed') {
        this._setOpStatus(operation, 'ignored');
        const stepResult = this._createResult(operation, null, 'ignored', `Transaction ${txId} is already ${this.transactionStates[txId]}. Operation ignored.`);
        this.timeline.push(stepResult);
        return stepResult;
      }
    }

    const { txId, type, item } = operation;
    let lockRequested = null;
    let result = '';
    let explanation = '';

    if (type === 'read' || type === 'write') {
      const handled = this._handleDataOperation(operation, isFromUnblock);
      lockRequested = handled.lockRequested;
      result = handled.result;
      explanation = handled.explanation;
    } else if (type === 'commit' || type === 'abort') {
      this.transactionStates[txId] = type === 'commit' ? 'committed' : 'aborted';
      this._releaseLocks(txId, 'all');
      result = type === 'commit' ? 'committed' : 'aborted';
      this._setOpStatus(operation, result);
      explanation = `${txId} ${type}. All held locks released.`;
      this._updateWaitForGraph();
      this._processWaitQueues();
    } else if (type === 'unlock') {
      const handled = this._handleUnlock(operation);
      result = handled.result;
      explanation = handled.explanation;
    }

    const stepResult = this._createResult(operation, lockRequested, result, explanation);
    this.timeline.push(stepResult);
    return stepResult;
  }

  /**
   * A read or a write: work out the requested mode, check the protocol
   * rules, then grant the lock or make the transaction wait.
   */
  _handleDataOperation(operation, isFromUnblock) {
    const { txId, type, item } = operation;

    /* ── 1. Which mode does this operation need? ─────────────────── */
    const heldMode = this._heldMode(txId, item);
    let lockRequested;
    let conversion = null;

    if (type === 'write') {
      lockRequested = 'X';
      if (heldMode === 'S') conversion = 'S→X';
      else if (heldMode === 'U') conversion = 'U→X';
    } else {
      // A read
      if (heldMode === 'X' && this.rules.conversions) {
        // The protocol supports conversions: the exclusive lock is downgraded.
        lockRequested = 'S';
        conversion = 'X→S';
      } else if (heldMode === 'X') {
        // The transaction already holds an exclusive lock — the read simply
        // runs under that lock, no new lock is needed.
        lockRequested = null;
      } else if (this.rules.updateLock) {
        lockRequested = 'U';
      } else {
        lockRequested = 'S';
      }
    }

    /* ── 2. Protocol rules that can abort the transaction ─────────── */
    const violation = this._checkProtocolRules(txId, operation, lockRequested, conversion);
    if (violation) {
      this.transactionStates[txId] = 'aborted';
      this._setOpStatus(operation, 'aborted', { lockType: lockRequested });
      this._releaseLocks(txId, 'all');
      this._updateWaitForGraph();
      this._processWaitQueues();
      return { lockRequested, result: 'aborted', explanation: violation };
    }

    /* ── 3. Conservative 2PL: the whole set is taken before the start ─ */
    if (this.rules.conservative && !this.conservativeStarted[txId] && !isFromUnblock) {
      const plan = this._conservativePlan(txId);
      const blockedBy = plan.find(entry => !this._canGrantLock(entry.item, txId, entry.mode));

      if (blockedBy) {
        // The transaction waits without holding a single lock.
        this.transactionStates[txId] = 'waiting';
        this._setOpStatus(operation, 'waiting', { lockType: lockRequested });
        const holders = this.lockTable[blockedBy.item]
          ? this.lockTable[blockedBy.item].holders.filter(h => h.txId !== txId)
          : [];

        for (const entry of plan) {
          if (!this.lockTable[entry.item]) this.lockTable[entry.item] = { holders: [], queue: [] };
          if (!this.lockTable[entry.item].queue.some(q => q.txId === txId)) {
            this.lockTable[entry.item].queue.push({
              txId,
              lockType: entry.mode,
              originalType: type,
              item: entry.item,
              opId: operation.opId || null,
              op: operation
            });
          }
        }

        this._updateWaitForGraph();
        const holdersText = holders.map(h => h.txId).join(', ') || 'another transaction';
        let explanation = `Conservative 2PL: ${txId} needs ${plan.length} lock(s) (${plan.map(p => `${p.mode}(${p.item})`).join(', ')}) before it may start, but ${holdersText} holds ${blockedBy.mode}(${blockedBy.item}). ${txId} waits without holding any lock.`;

        if (this._detectDeadlock()) {
          explanation += ` Deadlock detected involving: ${this.deadlockedTxns.join(', ')}.`;
        }
        return { lockRequested, result: this.isDeadlocked ? 'deadlock' : 'waiting', explanation };
      }

      // Everything can be granted — start the transaction with its full set.
      plan.forEach(entry => this._grantLock(entry.item, txId, entry.mode));
      this.conservativeStarted[txId] = true;
      const held = plan.map(p => `${p.mode}(${p.item})`).join(', ');
      this._setOpStatus(operation, 'granted', { lockType: lockRequested });
      return {
        lockRequested,
        result: 'granted',
        explanation: `Conservative 2PL: ${txId} acquired all of its locks up front (${held}) and may now execute.`
      };
    }

    /* ── 4. No new lock is needed (read under an existing X-lock) ─── */
    if (lockRequested === null) {
      this._setOpStatus(operation, 'granted', { lockType: 'X', upgraded: false });
      return {
        lockRequested: 'X',
        result: 'granted',
        explanation: `${txId} already holds an X-lock on ${item}, so the read is executed under that lock — no new lock is requested.`
      };
    }

    /* ── 5. Grant or wait ────────────────────────────────────────── */
    if (this._canGrantLock(item, txId, lockRequested)) {
      this._grantLock(item, txId, lockRequested);
      this._setOpStatus(operation, 'granted', {
        lockType: lockRequested,
        upgraded: !!conversion && conversion.endsWith('X')
      });

      let explanation;
      if (conversion) {
        explanation = `${txId} converted its lock on ${item} (${conversion}) and the request was granted.`;
      } else if (isFromUnblock) {
        explanation = `${txId} unblocked and was granted the ${lockRequested}-lock on ${item}. Executed ${type}.`;
      } else {
        explanation = `${txId} requested and was granted the ${lockRequested}-lock on ${item}. Executed ${type}.`;
      }

      // Process any pending operations for this tx if it just got unblocked
      if (isFromUnblock && this.pendingOperations[txId] && this.pendingOperations[txId].length > 0) {
        // Re-insert pending ops at the front of the schedule
        this.schedule.splice(this.currentStepIndex, 0, ...this.pendingOperations[txId]);
        this.pendingOperations[txId] = [];
      }

      return { lockRequested, result: 'granted', explanation };
    }

    /* ── 6. The request conflicts with the current holders ────────── */
    const holders = this.lockTable[item]
      ? this.lockTable[item].holders.filter(h => h.txId !== txId)
      : [];

    const decision = this._preventionDecision(txId, holders);

    if (decision === 'abort-requester') {
      // Wait-Die: the younger requester dies and is restarted.
      const ts = this._timestampOf(txId);
      const older = holders.filter(h => this._timestampOf(h.txId) > ts);
      const restarted = this._restartTransaction(txId, operation, 'wait-die');

      if (!restarted) {
        this._setOpStatus(operation, 'aborted', { lockType: lockRequested });
        return {
          lockRequested,
          result: 'aborted',
          explanation: `Wait-Die: ${txId} (timestamp ${ts}) is younger than ${older.map(h => `${h.txId} (timestamp ${this._timestampOf(h.txId)})`).join(', ')}, so it dies. It has already been restarted ${MAX_RESTARTS} times and is given up.`
        };
      }

      this._setOpStatus(operation, 'restarted', { lockType: lockRequested });
      return {
        lockRequested,
        result: 'restarted',
        explanation: `Wait-Die: ${txId} (timestamp ${ts}) is younger than ${older.map(h => `${h.txId} (timestamp ${this._timestampOf(h.txId)})`).join(', ')}, so it dies. ${txId} is aborted and restarted at the end of the schedule with a new timestamp (${this.timestamps[txId]}).`
      };
    }

    if (decision === 'abort-holder') {
      // Wound-Wait: the older requester wounds the younger holder.
      const ts = this._timestampOf(txId);
      const younger = holders.filter(h => this._timestampOf(h.txId) > ts);
      const victim = younger[0];

      const victimWaiter = this._findWaiter(victim.txId);
      const restarted = this._restartTransaction(victim.txId, victimWaiter ? victimWaiter.op : null, 'wound-wait');

      if (victimWaiter) {
        // The wounded transaction no longer waits in the queue.
        Object.keys(this.lockTable).forEach(node => {
          this.lockTable[node].queue = this.lockTable[node].queue.filter(q => q.txId !== victim.txId);
        });
      }

      this._updateWaitForGraph();

      if (!restarted) {
        this._setOpStatus(operation, 'aborted', { lockType: lockRequested });
        return {
          lockRequested,
          result: 'aborted',
          explanation: `Wound-Wait: ${txId} (timestamp ${ts}) wounds ${victim.txId}, but ${victim.txId} has already been restarted ${MAX_RESTARTS} times and is given up. ${txId} still has to wait.`
        };
      }

      // The request can now be granted.
      this._grantLock(item, txId, lockRequested);
      this._setOpStatus(operation, 'granted', { lockType: lockRequested });
      return {
        lockRequested,
        result: 'granted',
        explanation: `Wound-Wait: ${txId} (timestamp ${ts}) is older than ${victim.txId} (timestamp ${this._timestampOf(victim.txId)}), so it wounds ${victim.txId}: ${victim.txId} is aborted and restarted at the end of the schedule with a new timestamp (${this.timestamps[victim.txId]}). ${txId} takes the ${lockRequested}-lock on ${item}.`
      };
    }

    /* Ordinary waiting. */
    this.transactionStates[txId] = 'waiting';
    this._setOpStatus(operation, 'waiting', { lockType: lockRequested });
    if (!this.lockTable[item]) this.lockTable[item] = { holders: [], queue: [] };
    this.lockTable[item].queue.push({
      txId,
      lockType: lockRequested,
      originalType: type,
      item: item,
      opId: operation.opId || null,
      op: operation
    });
    this._updateWaitForGraph();

    let explanation = `${txId} requested the ${lockRequested}-lock on ${item} but it is incompatible with the current holders (${holders.map(h => `${h.txId} holds ${h.lockType}(${item})`).join(', ')}). Added to the wait queue.`;
    if (conversion) {
      explanation = `${txId} wants to convert its lock on ${item} (${conversion}), but ${holders.map(h => `${h.txId} holds ${h.lockType}(${item})`).join(', ')} blocks the conversion. ${txId} waits in the queue.`;
    }
    if (this._detectDeadlock()) {
      this._setOpStatus(operation, 'deadlock', { lockType: lockRequested });
      explanation += ` Deadlock detected involving: ${this.deadlockedTxns.join(', ')}.`;
    }

    return { lockRequested, result: this.isDeadlocked ? 'deadlock' : 'waiting', explanation };
  }

  /** Find the queue entry a transaction is currently waiting on. */
  _findWaiter(txId) {
    for (const node in this.lockTable) {
      const waiter = this.lockTable[node].queue.find(q => q.txId === txId);
      if (waiter) return waiter;
    }
    return null;
  }

  /**
   * The protocol rules that abort a transaction.
   * Returns the explanation when the transaction has to be aborted.
   */
  _checkProtocolRules(txId, operation, lockRequested, conversion) {
    const { type, item } = operation;
    const phase = this.transactionPhases[txId];

    // Two-phase rule: no new lock after the first release.
    if (this.rules.twoPhase && lockRequested && phase === 'shrinking') {
      return `Two-phase locking violation: ${txId} tried to acquire a ${lockRequested}-lock on ${item} during its shrinking phase. The transaction is aborted.`;
    }

    // A downgrade releases the exclusive lock and then acquires a shared one.
    // That is a release followed by an acquisition, so it breaks the
    // two-phase rule of every 2PL variant. Only the protocols that support
    // conversions explicitly allow it.
    if (conversion === 'X→S' && this.rules.twoPhase) {
      return `Two-phase locking violation: ${txId} downgraded its X-lock on ${item} to a shared lock. A downgrade is a release followed by an acquisition, which breaks the two-phase rule. The transaction is aborted.`;
    }

    return null;
  }

  /** An explicit unlock operation. */
  _handleUnlock(operation) {
    const { txId, item } = operation;
    const lockData = (this.heldLocks[txId] || []).find(l => l.item === item);

    if (!lockData) {
      this._setOpStatus(operation, 'ignored');
      return { result: 'ignored', explanation: `${txId} tried to unlock ${item} but does not hold a lock on it.` };
    }

    // Rigorous 2PL and conservative 2PL keep every lock until the end.
    if (this.rules.holdAllUntilCommit) {
      this.transactionStates[txId] = 'aborted';
      this._setOpStatus(operation, 'aborted');
      this._releaseLocks(txId, 'all');
      this._updateWaitForGraph();
      this._processWaitQueues();
      return {
        result: 'aborted',
        explanation: `${this.protocol === 'conservative-2pl' ? 'Conservative 2PL' : 'Rigorous 2PL'} violation: ${txId} tried to release its ${lockData.lockType}-lock on ${item} before commit/abort. The transaction is aborted.`
      };
    }

    // Strict 2PL keeps the exclusive locks until the end.
    if (this.rules.holdXUntilCommit && lockData.lockType === 'X') {
      this.transactionStates[txId] = 'aborted';
      this._setOpStatus(operation, 'aborted');
      this._releaseLocks(txId, 'all');
      this._updateWaitForGraph();
      this._processWaitQueues();
      return {
        result: 'aborted',
        explanation: `Strict 2PL violation: ${txId} tried to release its X-lock on ${item} before commit/abort. The transaction is aborted.`
      };
    }

    // Otherwise the release is allowed.
    this.lockTable[item].holders = this.lockTable[item].holders.filter(h => h.txId !== txId);
    this.heldLocks[txId] = this.heldLocks[txId].filter(l => l.item !== item);
    this.transactionPhases[txId] = 'shrinking';
    this._setOpStatus(operation, 'released', { lockType: lockData.lockType });
    this._updateWaitForGraph();
    this._processWaitQueues();

    return {
      result: 'released',
      explanation: `${txId} released its ${lockData.lockType}-lock on ${item}.${this.rules.twoPhase ? ' The transaction is now in its shrinking phase and may not acquire any new lock.' : ''}`
    };
  }

  _createResult(operation, lockRequested, result, explanation) {
    // Stamp the step number onto every operation record touched by this step.
    const stepNumber = this.getCurrentStep() + 1;
    if (operation && operation.opId && this.opStatus[operation.opId]) {
      this.opStatus[operation.opId].stepNumber = stepNumber;
    }

    // NOTE: the per-operation bookkeeping (opStatus / txOperations) lives on
    // the simulator itself and is read directly by the visualiser. Keeping it
    // out of the step results stops the history payload from growing with the
    // square of the number of steps. The step results do not embed a copy of
    // the timeline either — a nested copy would make the payload grow
    // exponentially with the number of steps. The simulator keeps the list of
    // steps itself and the UI renders the timeline from them.
    return {
      stepNumber,
      operation: { ...operation },
      lockRequested,
      result,
      explanation,
      lockTable: JSON.parse(JSON.stringify(this.lockTable)),
      waitForGraph: JSON.parse(JSON.stringify(this.waitForGraph)),
      transactionStates: JSON.parse(JSON.stringify(this.transactionStates)),
      isDeadlocked: this.isDeadlocked,
      deadlockedTxns: [...this.deadlockedTxns]
    };
  }

  runAll() {
    const results = [];
    while (!this.isComplete()) {
      const res = this.step();
      if (res) results.push(res);
    }
    return results;
  }
}

window.LockingSimulator = LockingSimulator;
