/**
 * app.js — Main Application Controller
 * Ties together: LockingSimulator, LockVisualizer, StepExplainer,
 * EXAMPLES, HistoryManager, ExportManager
 */
class App {
  constructor() {
    this.simulator = null;
    this.visualizer = null;
    this.explainer = null;
    this.historyManager = null;

    this.currentSteps = [];
    this.currentSchedule = [];
    this.autoPlayInterval = null;
    this.speed = 1;
    this.isAutoPlaying = false;
  }

  /* ───────────────────────── Initialization ───────────────────────── */

  init() {
    // Instantiate dependencies
    this.visualizer = window.LockVisualizer ? new window.LockVisualizer() : null;
    this.explainer  = window.StepExplainer  ? new window.StepExplainer()  : null;
    this.historyManager = window.HistoryManager ? new window.HistoryManager() : null;

    // Initialize navigation
    if (window.Navigation) {
      this.navigation = new window.Navigation();
      this.navigation.init();
    }

    // Initialize chatbot
    if (window.Chatbot) {
      this.chatbot = new window.Chatbot();
      this.chatbot.init();
    }

    // Initialize speech engine
    if (window.SpeechEngine) {
      this.speech = new window.SpeechEngine();
    }

    this.loadTheme();
    this.setupEventListeners();
    this.populateExamples();
    this.loadTheory();
    this.loadHistory();

    if (this.explainer) {
      this.explainer.showValidation('Welcome! Select an example or type your own transactions to begin.', 'info');
    }
  }

  /* ────────────────────────── Event Listeners ─────────────────────── */

  setupEventListeners() {
    // Theme
    document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());

    // Example & Protocol selectors
    document.getElementById('example-select')?.addEventListener('change', (e) => {
      if (e.target.value !== '') this.loadExample(parseInt(e.target.value));
    });
    document.getElementById('protocol-select')?.addEventListener('change', () => this.resetSimulation());

    // Custom schedule toggle
    document.getElementById('custom-schedule-toggle')?.addEventListener('change', (e) => {
      const el = document.getElementById('custom-schedule-editor');
      if (el) el.style.display = e.target.checked ? 'block' : 'none';
    });

    // Simulation controls
    document.getElementById('btn-run')?.addEventListener('click', () => this.runSimulation());
    document.getElementById('btn-step')?.addEventListener('click', () => this.stepForward());
    document.getElementById('btn-step-back')?.addEventListener('click', () => this.stepBack());
    document.getElementById('btn-reset')?.addEventListener('click', () => this.resetSimulation());

    // Auto-play
    document.getElementById('btn-auto-play')?.addEventListener('click', () => {
      this.isAutoPlaying ? this.stopAutoPlay() : this.startAutoPlay();
    });
    document.getElementById('speed-slider')?.addEventListener('input', (e) => {
      this.setSpeed(parseFloat(e.target.value));
    });

    // Theory
    document.getElementById('theory-toggle')?.addEventListener('click', () => this.toggleTheory());

    // Speech
    document.getElementById('btn-speech-toggle')?.addEventListener('click', () => {
      if (this.speech) this.speech.toggle();
    });

    // Export
    document.getElementById('btn-export-json')?.addEventListener('click', () => this.exportJSON());
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => this.exportPDF());

    // History
    document.getElementById('btn-clear-history')?.addEventListener('click', () => this.clearHistory());

    // Visualization tabs
    this.setupTabs();
  }

  setupTabs() {
    const tabs = ['lock-table', 'wait-graph', 'timeline'];
    tabs.forEach(tab => {
      document.getElementById(`tab-${tab}`)?.addEventListener('click', () => {
        // Deactivate all
        tabs.forEach(t => {
          document.getElementById(`tab-${t}`)?.classList.remove('tab-active');
          const panel = document.getElementById(`viz-${t}`);
          if (panel) {
            panel.classList.remove('tab-panel-active');
            panel.style.display = 'none';
          }
        });
        // Activate clicked
        document.getElementById(`tab-${tab}`)?.classList.add('tab-active');
        const activePanel = document.getElementById(`viz-${tab}`);
        if (activePanel) {
          activePanel.classList.add('tab-panel-active');
          activePanel.style.display = 'block';
        }
      });
    });

    // Initialize: only first tab visible
    document.getElementById('viz-wait-graph') && (document.getElementById('viz-wait-graph').style.display = 'none');
    document.getElementById('viz-timeline') && (document.getElementById('viz-timeline').style.display = 'none');
  }

  /* ──────────────────────────── Theme ─────────────────────────────── */

  toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);

    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
      icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  loadTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
      icon.className = saved === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  /* ──────────────────────────── Theory ────────────────────────────── */

  loadTheory() {
    const container = document.getElementById('theory-content');
    if (container && this.explainer) {
      container.innerHTML = this.explainer.getTheoryHTML();
    }
  }

  toggleTheory() {
    const container = document.getElementById('theory-content');
    if (container) {
      const isHidden = container.style.display === 'none';
      container.style.display = isHidden ? 'block' : 'none';
      const btn = document.getElementById('theory-toggle');
      if (btn) {
        btn.innerHTML = isHidden
          ? '<i class="fas fa-book-open"></i> Hide Theory'
          : '<i class="fas fa-book"></i> Background Theory';
      }
    }
  }

  /* ───────────────────────── Transaction Status ───────────────────────── */

  updateTransactionStatus() {
    const statusBar = document.getElementById('tx-status-bar');
    if (!statusBar) return;
    
    if (!this.simulator || this.currentSteps.length === 0) {
      statusBar.innerHTML = '';
      return;
    }
    
    const lastStep = this.currentSteps[this.currentSteps.length - 1];
    const states = lastStep.transactionStates || {};
    
    const statusIcons = {
      'active': '🟢',
      'waiting': '🟡',
      'committed': '🔵',
      'aborted': '🔴'
    };
    
    const statusClasses = {
      'active': 'tx-status-active',
      'waiting': 'tx-status-waiting',
      'committed': 'tx-status-committed',
      'aborted': 'tx-status-aborted'
    };
    
    // Check for deadlocked transactions
    const deadlocked = lastStep.deadlockedTxns || [];
    
    statusBar.innerHTML = Object.entries(states).map(([txId, state]) => {
      const isDeadlocked = deadlocked.includes(txId);
      const displayState = isDeadlocked ? 'Deadlocked' : state.charAt(0).toUpperCase() + state.slice(1);
      const icon = isDeadlocked ? '💀' : (statusIcons[state] || '⚪');
      const cls = isDeadlocked ? 'tx-status-deadlocked' : (statusClasses[state] || '');
      return `<span class="tx-status-badge ${cls}">${icon} ${txId}: ${displayState}</span>`;
    }).join('');
  }

  /* ─────────────────────────── Examples ───────────────────────────── */

  populateExamples() {
    const select = document.getElementById('example-select');
    if (!select || !window.EXAMPLES) return;

    window.EXAMPLES.forEach((example, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${index + 1}. ${example.name}`;
      select.appendChild(option);
    });

    // Auto-load first example
    if (window.EXAMPLES.length > 0) {
      select.value = '0';
      this.loadExample(0);
    }
  }

  loadExample(index) {
    const example = window.EXAMPLES[index];
    if (!example) return;

    // Set protocol
    const protocolSelect = document.getElementById('protocol-select');
    if (protocolSelect) protocolSelect.value = example.protocol;

    // Build text representation for the transaction editor
    const txMap = {};
    example.schedule.forEach(op => {
      if (!txMap[op.txId]) txMap[op.txId] = [];
      if (op.type === 'read') txMap[op.txId].push(`R(${op.item})`);
      else if (op.type === 'write') txMap[op.txId].push(`W(${op.item})`);
      else if (op.type === 'commit') txMap[op.txId].push('C');
      else if (op.type === 'abort') txMap[op.txId].push('A');
    });
    const text = Object.entries(txMap).map(([txId, ops]) => `${txId}: ${ops.join(', ')}`).join('\n');

    const editor = document.getElementById('transaction-editor');
    if (editor) editor.value = text;

    // Also store the schedule directly
    this.currentSchedule = JSON.parse(JSON.stringify(example.schedule));

    // Build custom schedule text
    const customText = example.schedule.map(op => {
      if (op.type === 'read') return `${op.txId}:R(${op.item})`;
      if (op.type === 'write') return `${op.txId}:W(${op.item})`;
      if (op.type === 'commit') return `${op.txId}:C`;
      if (op.type === 'abort') return `${op.txId}:A`;
      return '';
    }).join(', ');
    const customEditor = document.getElementById('custom-schedule-editor');
    if (customEditor) customEditor.value = customText;

    // Reset simulation state
    this.resetSimulation(true); // quiet reset

    if (this.explainer) {
      this.explainer.showValidation(`Loaded: ${example.name} — ${example.description}`, 'info');
    }
  }

  /* ──────────────────────── Input Parsing ─────────────────────────── */

  parseScheduleFromInput() {
    const isCustom = document.getElementById('custom-schedule-toggle')?.checked;

    if (isCustom) {
      return this.parseCustomSchedule();
    } else {
      return this.parseRoundRobinSchedule();
    }
  }

  parseCustomSchedule() {
    const text = document.getElementById('custom-schedule-editor')?.value || '';
    if (!text.trim()) return [];

    const schedule = [];
    const parts = text.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;

      const txId = trimmed.substring(0, colonIdx).trim();
      const opStr = trimmed.substring(colonIdx + 1).trim().toUpperCase();

      const op = this.parseOperation(txId, opStr);
      if (op) schedule.push(op);
    }

    return schedule;
  }

  parseRoundRobinSchedule() {
    const text = document.getElementById('transaction-editor')?.value || '';
    if (!text.trim()) return [];

    const lines = text.split('\n');
    const txOps = {}; // txId -> [operations]

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;

      const txId = trimmed.substring(0, colonIdx).trim();
      const opsStr = trimmed.substring(colonIdx + 1).trim();

      txOps[txId] = [];
      for (const opPart of opsStr.split(',')) {
        const opStr = opPart.trim().toUpperCase();
        if (!opStr) continue;
        const op = this.parseOperation(txId, opStr);
        if (op) txOps[txId].push(op);
      }
    }

    // Interleave round-robin
    const txIds = Object.keys(txOps);
    const schedule = [];
    let maxLen = Math.max(...txIds.map(id => txOps[id].length), 0);

    for (let i = 0; i < maxLen; i++) {
      for (const txId of txIds) {
        if (i < txOps[txId].length) {
          schedule.push(txOps[txId][i]);
        }
      }
    }

    return schedule;
  }

  parseOperation(txId, opStr) {
    if (opStr === 'C') return { txId, type: 'commit', item: null };
    if (opStr === 'A') return { txId, type: 'abort', item: null };

    const readMatch = opStr.match(/^R\((\w+)\)$/);
    if (readMatch) return { txId, type: 'read', item: readMatch[1] };

    const writeMatch = opStr.match(/^W\((\w+)\)$/);
    if (writeMatch) return { txId, type: 'write', item: writeMatch[1] };

    return null;
  }

  validateInput() {
    const text = document.getElementById('transaction-editor')?.value || '';
    const errors = [];
    
    // Check empty input
    if (!text.trim()) {
      errors.push('❌ Please enter at least one transaction.');
      return { valid: false, errors, schedule: [] };
    }
    
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Check for colon separator
      if (!trimmed.includes(':')) {
        errors.push(`❌ Invalid transaction format: "${trimmed}". Expected format: T1: R(A), W(B), C`);
        continue;
      }
      
      const [txPart, opsPart] = [trimmed.substring(0, trimmed.indexOf(':')).trim(), trimmed.substring(trimmed.indexOf(':') + 1).trim()];
      
      // Validate transaction name
      if (!/^T\d+$/i.test(txPart)) {
        errors.push(`❌ Invalid transaction name: "${txPart}". Expected format: T1, T2, T3, etc.`);
      }
      
      // Validate each operation
      if (opsPart) {
        const ops = opsPart.split(',');
        for (const op of ops) {
          const o = op.trim().toUpperCase();
          if (!o) continue;
          if (o === 'C' || o === 'A') continue; // Commit or Abort
          
          const readMatch = o.match(/^R\((.*)\)$/);
          const writeMatch = o.match(/^W\((.*)\)$/);
          
          if (readMatch) {
            if (!readMatch[1] || !readMatch[1].trim()) {
              errors.push(`❌ Invalid syntax in ${txPart}: "${op.trim()}" — data item name is required. Use R(A), R(B), etc.`);
            }
          } else if (writeMatch) {
            if (!writeMatch[1] || !writeMatch[1].trim()) {
              errors.push(`❌ Invalid syntax in ${txPart}: "${op.trim()}" — data item name is required. Use W(A), W(B), etc.`);
            }
          } else {
            errors.push(`❌ Invalid operation in ${txPart}: "${op.trim()}". Valid operations: R(item), W(item), C, A`);
          }
        }
      }
    }
    
    const schedule = this.parseScheduleFromInput();
    
    // Warning for missing commit
    if (schedule.length > 0) {
      const txIds = [...new Set(schedule.map(op => op.txId))];
      for (const txId of txIds) {
        const txOps = schedule.filter(op => op.txId === txId);
        const lastOp = txOps[txOps.length - 1];
        if (lastOp && lastOp.type !== 'commit' && lastOp.type !== 'abort') {
          errors.push(`⚠️ Warning: ${txId} has no COMMIT or ABORT at the end.`);
        }
      }
    }
    
    const hardErrors = errors.filter(e => e.startsWith('❌'));
    return { valid: hardErrors.length === 0, errors, schedule };
  }

  /* ────────────────────── Deadlock Resolution ────────────────────── */

  showDeadlockResolution() {
    const lastStep = this.currentSteps[this.currentSteps.length - 1];
    if (!lastStep || !lastStep.isDeadlocked) return;
    
    const modal = document.getElementById('deadlock-modal');
    const txnsDiv = document.getElementById('deadlock-modal-txns');
    const buttonsDiv = document.getElementById('deadlock-modal-buttons');
    
    if (!modal || !txnsDiv || !buttonsDiv) return;
    
    txnsDiv.innerHTML = lastStep.deadlockedTxns.map(txId => 
      `<span class="deadlock-txn-badge">${txId}</span>`
    ).join('');
    
    buttonsDiv.innerHTML = lastStep.deadlockedTxns.map(txId => 
      `<button class="btn btn-danger" onclick="window.app.resolveDeadlock('${txId}')">
        <i class="fas fa-skull-crossbones"></i> Abort ${txId}
      </button>`
    ).join('');
    
    modal.style.display = 'flex';
  }

  resolveDeadlock(txIdToAbort) {
    if (!this.simulator) return;
    
    // Close the modal
    const modal = document.getElementById('deadlock-modal');
    if (modal) modal.style.display = 'none';
    
    // Abort the selected transaction by manipulating the simulator state
    const sim = this.simulator;
    
    // Save state for undo
    sim.history.push(sim.deepCopyState());
    
    // Set state to aborted
    sim.transactionStates[txIdToAbort] = 'aborted';
    
    // Release all locks
    sim._releaseLocks(txIdToAbort, 'all');
    
    // Remove from all wait queues
    for (const item in sim.lockTable) {
      sim.lockTable[item].queue = sim.lockTable[item].queue.filter(q => q.txId !== txIdToAbort);
    }
    
    // Clear deadlock
    sim.isDeadlocked = false;
    sim.deadlockedTxns = [];
    
    // Rebuild wait-for graph
    sim._updateWaitForGraph();
    
    // Process wait queues — let blocked transactions proceed
    sim._processWaitQueues();
    
    // Create a step result for this resolution
    const resolutionStep = {
      stepNumber: this.currentSteps.length + 1,
      operation: { txId: txIdToAbort, type: 'abort', item: null },
      lockRequested: null,
      result: 'aborted',
      explanation: `⚡ Deadlock Resolution: ${txIdToAbort} was aborted to resolve the deadlock. All locks held by ${txIdToAbort} have been released. Waiting transactions may now proceed.`,
      lockTable: JSON.parse(JSON.stringify(sim.lockTable)),
      waitForGraph: JSON.parse(JSON.stringify(sim.waitForGraph)),
      transactionStates: JSON.parse(JSON.stringify(sim.transactionStates)),
      isDeadlocked: sim.isDeadlocked,
      deadlockedTxns: [...sim.deadlockedTxns],
      timeline: [...sim.timeline]
    };
    
    this.currentSteps.push(resolutionStep);
    
    // Update all visualizations
    this.updateAllVisualizations();
    this.updateStepCounter();
    
    if (this.explainer) {
      this.explainer.showValidation(`⚡ ${txIdToAbort} aborted. Deadlock resolved! Other transactions can now continue.`, 'success');
    }
  }

  /* ────────────────────── Simulation Controls ────────────────────── */

  initSimulator() {
    const protocol = document.getElementById('protocol-select')?.value || 'basic-2pl';
    this.simulator = new window.LockingSimulator(protocol);

    const schedule = this.parseScheduleFromInput();
    if (schedule.length === 0) {
      if (this.explainer) this.explainer.showValidation('No valid operations to simulate.', 'error');
      return false;
    }

    this.simulator.setSchedule(schedule);
    this.currentSteps = [];
    return true;
  }

  runSimulation() {
    this.resetSimulation(true);

    if (!this.initSimulator()) return;

    const validation = this.validateInput();
    validation.errors.forEach(err => {
      if (this.explainer) this.explainer.showValidation(err, err.startsWith('⚠️') ? 'warning' : 'error');
    });

    if (!validation.valid) return;

    // Run all steps
    const results = this.simulator.runAll();
    this.currentSteps = results;

    // Update all visualizations
    this.updateAllVisualizations();
    this.updateStepCounter();

    // Save to history
    this.saveToHistory();

    const lastStep = results[results.length - 1];
    if (lastStep && lastStep.isDeadlocked) {
      this.showDeadlockResolution();
      if (this.explainer) this.explainer.showValidation(
        `🔴 Deadlock detected! Transactions involved: ${lastStep.deadlockedTxns.join(', ')}`, 'error'
      );
    } else {
      if (this.explainer) this.explainer.showValidation('✅ Simulation completed successfully!', 'success');
    }
  }

  stepForward() {
    // Initialize simulator on first step if needed
    if (!this.simulator || this.simulator.isComplete()) {
      if (!this.simulator) {
        if (!this.initSimulator()) return;
      } else {
        if (this.explainer) this.explainer.showValidation('Simulation is complete. Reset to start over.', 'warning');
        this.stopAutoPlay();
        return;
      }
    }

    const result = this.simulator.step();
    if (result) {
      this.currentSteps.push(result);
      this.updateAllVisualizations();
      this.updateStepCounter();

      // Auto-speak the step if speech is active
      if (this.speech && this.speech.isSpeaking) {
        const opStr = result.operation
          ? `${result.operation.txId}: ${result.operation.type.toUpperCase()}${result.operation.item ? '(' + result.operation.item + ')' : ''}`
          : '';
        this.speech.speakStep({ operation: opStr, result: result.result, explanation: result.explanation, isDeadlocked: result.isDeadlocked, deadlockedTxns: result.deadlockedTxns });
      }

      if (result.isDeadlocked) {
        this.showDeadlockResolution();
        if (this.explainer) this.explainer.showValidation(
          `🔴 Deadlock detected! Transactions: ${result.deadlockedTxns.join(', ')}`, 'error'
        );
        this.stopAutoPlay();
      }
    }

    if (this.simulator.isComplete()) {
      this.stopAutoPlay();
      this.saveToHistory();
      if (!this.simulator.isDeadlocked) {
        if (this.explainer) this.explainer.showValidation('✅ Simulation complete.', 'success');
      }
    }
  }

  stepBack() {
    if (!this.simulator) return;

    this.simulator.stepBack();
    if (this.currentSteps.length > 0) {
      this.currentSteps.pop();
    }

    this.updateAllVisualizations();
    this.updateStepCounter();

    if (this.explainer) this.explainer.showValidation('⏪ Stepped back.', 'info');
  }

  resetSimulation(quiet = false) {
    this.stopAutoPlay();
    if (this.speech) this.speech.stop();
    this.simulator = null;
    this.currentSteps = [];

    if (this.visualizer) this.visualizer.clearAll();
    if (this.explainer) this.explainer.clear();

    this.updateStepCounter();
    this.updateTransactionStatus();

    if (!quiet && this.explainer) {
      this.explainer.showValidation('🔄 Simulation reset.', 'info');
    }
  }

  /* ──────────────────────── Auto-Play ────────────────────────────── */

  startAutoPlay() {
    if (!this.simulator) {
      if (!this.initSimulator()) return;
    }

    this.isAutoPlaying = true;
    const btn = document.getElementById('btn-auto-play');
    if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> Pause';

    const interval = Math.max(200, 1000 / this.speed);
    this.autoPlayInterval = setInterval(() => {
      if (this.simulator && !this.simulator.isComplete()) {
        this.stepForward();
      } else {
        this.stopAutoPlay();
      }
    }, interval);
  }

  stopAutoPlay() {
    this.isAutoPlaying = false;
    const btn = document.getElementById('btn-auto-play');
    if (btn) btn.innerHTML = '<i class="fas fa-play"></i> Auto Play';

    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  setSpeed(speed) {
    this.speed = speed;
    const label = document.getElementById('speed-label');
    if (label) label.textContent = `${speed}x`;

    // Restart auto-play with new speed if running
    if (this.isAutoPlaying) {
      this.stopAutoPlay();
      this.startAutoPlay();
    }
  }

  /* ──────────────────── Visualization Updates ────────────────────── */

  updateAllVisualizations() {
    if (!this.visualizer || this.currentSteps.length === 0) return;

    const lastStep = this.currentSteps[this.currentSteps.length - 1];

    // Lock Table
    this.visualizer.renderLockTable(lastStep.lockTable || {});

    // Wait-For Graph
    this.visualizer.renderWaitForGraph(
      lastStep.waitForGraph || {},
      lastStep.deadlockedTxns || []
    );

    // Timeline — build from all steps
    const timelineData = this.currentSteps.map(s => ({
      stepNumber: s.stepNumber,
      txId: s.operation?.txId || '',
      type: s.operation?.type || '',
      item: s.operation?.item || '',
      lockType: s.lockRequested || '',
      result: s.result
    }));
    this.visualizer.renderTimeline(timelineData);

    // Explanation panel
    if (this.explainer) {
      const explainableSteps = this.currentSteps.map(s => ({
        stepNumber: s.stepNumber,
        operation: s.operation
          ? `${s.operation.txId}: ${s.operation.type.toUpperCase()}${s.operation.item ? '(' + s.operation.item + ')' : ''}`
          : '',
        lockRequested: s.lockRequested ? `Requesting ${s.lockRequested}-lock${s.operation?.item ? ' on ' + s.operation.item : ''}` : '',
        result: s.result,
        explanation: s.explanation,
        isDeadlocked: s.isDeadlocked,
        deadlockedTxns: s.deadlockedTxns || []
      }));
      this.explainer.renderSteps(explainableSteps);
    }
    
    // Update Transaction Status
    this.updateTransactionStatus();
  }

  updateStepCounter() {
    const counter = document.getElementById('step-counter');
    if (counter) {
      const current = this.currentSteps.length;
      const total = this.simulator ? this.simulator.getTotalSteps() : 0;
      counter.textContent = `Step ${current} of ${total}`;
    }
  }

  /* ──────────────────────── History ───────────────────────────────── */

  async loadHistory() {
    if (!this.historyManager) return;

    const entries = await this.historyManager.getAll();
    const listEl = document.getElementById('history-list');
    const countEl = document.getElementById('history-count');

    if (countEl) countEl.textContent = entries.length;
    if (!listEl) return;

    if (entries.length === 0) {
      listEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;padding:8px;">No history yet.</div>';
      return;
    }

    listEl.innerHTML = entries.map(entry => `
      <div class="history-item" data-id="${entry.id}" onclick="window.app.replayFromHistory('${entry.id}')">
        <div style="font-weight:600;display:flex;justify-content:space-between;">
          <span>${entry.exampleName || 'Custom'}</span>
          <span style="font-size:0.75rem;">${entry.result || ''}</span>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);">
          ${entry.protocol || ''} • ${entry.transactions || ''} • ${new Date(entry.timestamp).toLocaleString()}
        </div>
      </div>
    `).join('');
  }

  async saveToHistory() {
    if (!this.historyManager || this.currentSteps.length === 0) return;

    const lastStep = this.currentSteps[this.currentSteps.length - 1];
    const protocol = document.getElementById('protocol-select')?.value || 'basic-2pl';
    const protocolNames = {
      'basic-2pl': 'Basic 2PL',
      'strict-2pl': 'Strict 2PL', 
      'rigorous-2pl': 'Rigorous 2PL'
    };
    
    // Get transaction IDs
    const txIds = [...new Set(this.currentSteps.map(s => s.operation?.txId).filter(Boolean))];
    
    // Try to find example name
    const exampleSelect = document.getElementById('example-select');
    const exampleName = exampleSelect && exampleSelect.value !== '' 
      ? window.EXAMPLES?.[parseInt(exampleSelect.value)]?.name || ''
      : 'Custom';

    await this.historyManager.save({
      protocol: protocolNames[protocol] || protocol,
      protocolKey: protocol,
      exampleName,
      transactions: txIds.join(', '),
      totalSteps: this.currentSteps.length,
      schedule: this.parseScheduleFromInput(),
      steps: this.currentSteps,
      result: lastStep.isDeadlocked ? '🔴 Deadlock' : '✅ Completed',
      lockTable: lastStep.lockTable,
      waitForGraph: lastStep.waitForGraph,
      isDeadlocked: lastStep.isDeadlocked || false,
      deadlockedTxns: lastStep.deadlockedTxns || []
    });

    this.loadHistory();
  }

  async replayFromHistory(entryId) {
    if (!this.historyManager) return;
    const entry = await this.historyManager.getById(entryId);
    if (!entry) return;

    const protocolSelect = document.getElementById('protocol-select');
    if (protocolSelect && (entry.protocolKey || entry.protocol)) {
      protocolSelect.value = entry.protocolKey || entry.protocol;
    }

    if (entry.schedule) {
      const txMap = {};
      entry.schedule.forEach(op => {
        if (!txMap[op.txId]) txMap[op.txId] = [];
        if (op.type === 'read') txMap[op.txId].push(`R(${op.item})`);
        else if (op.type === 'write') txMap[op.txId].push(`W(${op.item})`);
        else if (op.type === 'commit') txMap[op.txId].push('C');
        else if (op.type === 'abort') txMap[op.txId].push('A');
      });
      const text = Object.entries(txMap).map(([txId, ops]) => `${txId}: ${ops.join(', ')}`).join('\n');
      const editor = document.getElementById('transaction-editor');
      if (editor) editor.value = text;
    }

    this.runSimulation();
    if (this.explainer) {
      this.explainer.showValidation('📂 Replayed from history.', 'info');
    }
  }

  async clearHistory() {
    if (!this.historyManager) return;
    await this.historyManager.clearAll();
    this.loadHistory();
    if (this.explainer) this.explainer.showValidation('🗑️ History cleared.', 'info');
  }

  /* ──────────────────────── Export ────────────────────────────────── */

  exportJSON() {
    if (this.currentSteps.length === 0) {
      if (this.explainer) this.explainer.showValidation('Nothing to export. Run a simulation first.', 'warning');
      return;
    }

    const lastStep = this.currentSteps[this.currentSteps.length - 1];
    const data = {
      protocol: document.getElementById('protocol-select')?.value || 'basic-2pl',
      schedule: this.parseScheduleFromInput(),
      steps: this.currentSteps,
      lockTable: lastStep.lockTable,
      waitForGraph: lastStep.waitForGraph,
      isDeadlocked: lastStep.isDeadlocked,
      deadlockedTxns: lastStep.deadlockedTxns,
      result: lastStep.isDeadlocked ? 'Deadlock' : 'Completed'
    };

    window.ExportManager.toJSON(data);
    if (this.explainer) this.explainer.showValidation('📄 JSON exported successfully!', 'success');
  }

  exportPDF() {
    if (this.currentSteps.length === 0) {
      if (this.explainer) this.explainer.showValidation('Nothing to export. Run a simulation first.', 'warning');
      return;
    }

    const lastStep = this.currentSteps[this.currentSteps.length - 1];
    const data = {
      protocol: document.getElementById('protocol-select')?.value || 'basic-2pl',
      schedule: this.parseScheduleFromInput(),
      steps: this.currentSteps,
      lockTable: lastStep.lockTable,
      waitForGraph: lastStep.waitForGraph,
      isDeadlocked: lastStep.isDeadlocked,
      deadlockedTxns: lastStep.deadlockedTxns,
      result: lastStep.isDeadlocked ? 'Deadlock' : 'Completed'
    };

    window.ExportManager.toPDF(data);
    if (this.explainer) this.explainer.showValidation('📑 PDF exported successfully!', 'success');
  }
}

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
