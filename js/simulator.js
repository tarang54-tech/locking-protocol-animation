class LockingSimulator {
  constructor(protocol = 'basic-2pl') {
    this.protocol = protocol;
    this.reset();
  }

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

  /* ───────────────── Operation status tracking ───────────────── */

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
      txOperations: JSON.parse(JSON.stringify(this.txOperations))
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

  _canGrantLock(item, txId, requestedType) {
    const tableEntry = this.lockTable[item];
    if (!tableEntry || tableEntry.holders.length === 0) return true;

    const holders = tableEntry.holders;
    
    // If this tx is the only holder, it can upgrade S to X
    if (holders.length === 1 && holders[0].txId === txId) {
      return true;
    }
    
    // If it already holds the requested lock, grant it
    const existingLock = holders.find(h => h.txId === txId);
    if (existingLock && (existingLock.lockType === requestedType || existingLock.lockType === 'X')) {
      return true; // Already has it or has stronger
    }

    if (requestedType === 'S') {
      // S is compatible with S, incompatible with X
      return holders.every(h => h.lockType === 'S' || h.txId === txId);
    } else {
      // X is incompatible with everything else
      return holders.every(h => h.txId === txId);
    }
  }

  _grantLock(item, txId, lockType) {
    if (!this.lockTable[item]) {
      this.lockTable[item] = { holders: [], queue: [] };
    }
    const tableEntry = this.lockTable[item];
    
    const existing = tableEntry.holders.find(h => h.txId === txId);
    if (existing) {
      if (existing.lockType === 'S' && lockType === 'X') {
        existing.lockType = 'X'; // Upgrade
        const txLocks = this.heldLocks[txId];
        const txLock = txLocks.find(l => l.item === item);
        if (txLock) txLock.lockType = 'X';
      }
    } else {
      tableEntry.holders.push({ txId, lockType });
      if (!this.heldLocks[txId]) this.heldLocks[txId] = [];
      this.heldLocks[txId].push({ item, lockType });
    }
    
    // Basic 2PL rule: acquiring lock means we are in growing phase
    if (!this.transactionPhases[txId] || this.transactionPhases[txId] !== 'shrinking') {
      this.transactionPhases[txId] = 'growing';
    }
  }

  _processWaitQueues() {
    let unblockedSomething = false;
    for (let item in this.lockTable) {
      const tableEntry = this.lockTable[item];
      if (tableEntry.queue.length > 0) {
        const firstWaiter = tableEntry.queue[0];
        if (this._canGrantLock(item, firstWaiter.txId, firstWaiter.lockType)) {
          // Unblock!
          tableEntry.queue.shift(); // remove from queue
          this._grantLock(item, firstWaiter.txId, firstWaiter.lockType);
          this.transactionStates[firstWaiter.txId] = 'active';

          this.unblockedQueue.push({
            txId: firstWaiter.txId,
            type: firstWaiter.originalType,
            item: item,
            opId: firstWaiter.opId || null,
            isUnblock: true,
            grantedLockType: firstWaiter.lockType
          });

          // The lock is now held, but the operation itself has not run yet.
          if (firstWaiter.opId && this.opStatus[firstWaiter.opId]) {
            this.opStatus[firstWaiter.opId].status = 'unblocked';
            this.opStatus[firstWaiter.opId].lockType = firstWaiter.lockType;
          }

          unblockedSomething = true;
        }
      }
    }
    if (unblockedSomething) {
      this._updateWaitForGraph();
      this._detectDeadlock();
    }
  }

  _releaseLocks(txId, type = 'all') { // type can be 'all' or 'S'
    let releasedCount = 0;
    if (this.heldLocks[txId]) {
      const remainingLocks = [];
      for (let lock of this.heldLocks[txId]) {
        if (type === 'all' || (type === 'S' && lock.lockType === 'S')) {
          const item = lock.item;
          this.lockTable[item].holders = this.lockTable[item].holders.filter(h => h.txId !== txId);
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
      lockRequested = type === 'read' ? 'S' : 'X';

      // Did the transaction already hold a shared lock on this item? (upgrade)
      const hadShared = type === 'write' && this._holdsLock(txId, item, 'S');

      // Basic 2PL rule check
      if (this.protocol === 'basic-2pl' && this.transactionPhases[txId] === 'shrinking') {
        result = 'aborted';
        explanation = `Basic 2PL violation: ${txId} tried to acquire ${lockRequested}-lock on ${item} during shrinking phase. Transaction aborted.`;
        this.transactionStates[txId] = 'aborted';
        this._setOpStatus(operation, 'aborted', { lockType: lockRequested });
        this._releaseLocks(txId, 'all');
        this._processWaitQueues();
      } else {
        if (this._canGrantLock(item, txId, lockRequested)) {
          this._grantLock(item, txId, lockRequested);
          result = 'granted';
          this._setOpStatus(operation, 'granted', {
            lockType: lockRequested,
            upgraded: hadShared && lockRequested === 'X'
          });
          explanation = isFromUnblock
            ? `${txId} unblocked and granted ${lockRequested}-lock on ${item}. Executed ${type}.`
            : `${txId} requested and was granted ${lockRequested}-lock on ${item}. Executed ${type}.`;

          // Process any pending operations for this tx if it just got unblocked
          if (isFromUnblock && this.pendingOperations[txId] && this.pendingOperations[txId].length > 0) {
            // Re-insert pending ops at the front of the schedule
            this.schedule.splice(this.currentStepIndex, 0, ...this.pendingOperations[txId]);
            this.pendingOperations[txId] = [];
          }

        } else {
          result = 'waiting';
          explanation = `${txId} requested ${lockRequested}-lock on ${item} but it is incompatible with current holders. Added to wait queue.`;
          this.transactionStates[txId] = 'waiting';
          this._setOpStatus(operation, 'waiting', { lockType: lockRequested });
          if (!this.lockTable[item]) this.lockTable[item] = { holders: [], queue: [] };
          this.lockTable[item].queue.push({ txId, lockType: lockRequested, originalType: type, opId: operation.opId || null });
          this._updateWaitForGraph();
          if (this._detectDeadlock()) {
            result = 'deadlock';
            this._setOpStatus(operation, 'deadlock', { lockType: lockRequested });
            explanation += ` Deadlock detected involving: ${this.deadlockedTxns.join(', ')}.`;
          }
        }
      }
    } else if (type === 'commit' || type === 'abort') {
      this.transactionStates[txId] = type === 'commit' ? 'committed' : 'aborted';
      this._releaseLocks(txId, 'all');
      result = type === 'commit' ? 'committed' : 'aborted';
      this._setOpStatus(operation, result);
      explanation = `${txId} ${type}. All held locks released.`;
      this._updateWaitForGraph();
      this._processWaitQueues();
    } else if (type === 'unlock') {
      // Manual unlock, allowed in basic-2pl, sometimes strict-2pl (for S locks)
      const lockData = (this.heldLocks[txId] || []).find(l => l.item === item);
      if (!lockData) {
        result = 'ignored';
        this._setOpStatus(operation, 'ignored');
        explanation = `${txId} tried to unlock ${item} but does not hold a lock.`;
      } else {
        if (this.protocol === 'rigorous-2pl') {
          result = 'aborted';
          explanation = `Rigorous 2PL violation: ${txId} tried to release lock on ${item} before commit/abort. Transaction aborted.`;
          this.transactionStates[txId] = 'aborted';
          this._setOpStatus(operation, 'aborted');
          this._releaseLocks(txId, 'all');
        } else if (this.protocol === 'strict-2pl' && lockData.lockType === 'X') {
          result = 'aborted';
          explanation = `Strict 2PL violation: ${txId} tried to release X-lock on ${item} before commit/abort. Transaction aborted.`;
          this.transactionStates[txId] = 'aborted';
          this._setOpStatus(operation, 'aborted');
          this._releaseLocks(txId, 'all');
        } else {
          // Allowed
          this.lockTable[item].holders = this.lockTable[item].holders.filter(h => h.txId !== txId);
          this.heldLocks[txId] = this.heldLocks[txId].filter(l => l.item !== item);
          this.transactionPhases[txId] = 'shrinking';
          result = 'released';
          this._setOpStatus(operation, 'released', { lockType: lockData.lockType });
          explanation = `${txId} released ${lockData.lockType}-lock on ${item}.`;
        }
        this._updateWaitForGraph();
        this._processWaitQueues();
      }
    }

    const stepResult = this._createResult(operation, lockRequested, result, explanation);
    this.timeline.push(stepResult);
    return stepResult;
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
