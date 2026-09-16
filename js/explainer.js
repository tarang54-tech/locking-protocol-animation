/**
 * explainer.js — Step-by-step Explanation Generator & Theory Content
 * Generates human-readable explanations and background theory for locking protocols.
 */
class StepExplainer {
  constructor() {
    this.stepsContainerId = 'explanation-steps';
    this.validationContainerId = 'validation-messages';
  }

  /**
   * Generate an HTML card for a single simulation step
   */
  explainStep(step) {
    let icon = 'ℹ️';
    let resultLabel = step.result ? step.result.toUpperCase() : 'UNKNOWN';
    let className = 'step-card';

    switch (step.result) {
      case 'granted':   icon = '✅'; className += ' step-granted';   break;
      case 'waiting':   icon = '⏳'; className += ' step-waiting';   break;
      case 'deadlock':  icon = '🔴'; className += ' step-deadlock';  break;
      case 'released':  icon = '🔓'; className += ' step-released';  break;
      case 'committed': icon = '✔️'; className += ' step-committed'; break;
      case 'aborted':   icon = '❌'; className += ' step-deadlock';  break;
      case 'buffered':  icon = '📦'; className += ' step-waiting';   break;
      case 'ignored':   icon = '⏭️'; className += ' step-released';  break;
    }

    return `
      <div class="${className}">
        <div class="step-header">
          <span class="step-badge">Step ${step.stepNumber}</span>
          <span class="step-result">${icon} ${resultLabel}</span>
        </div>
        <div class="step-operation">${step.operation || ''}</div>
        ${step.lockRequested ? `<div class="step-lock-info">🔒 ${step.lockRequested}</div>` : ''}
        <div class="step-explanation">${step.explanation || ''}</div>
        ${step.isDeadlocked ? `<div class="step-deadlock-info">⚠️ Deadlocked Transactions: ${(step.deadlockedTxns || []).join(', ')}</div>` : ''}
      </div>
    `;
  }

  /**
   * Render all step explanations into the panel
   */
  renderSteps(steps) {
    const container = document.getElementById(this.stepsContainerId);
    if (!container) return;

    if (!steps || steps.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i> Run or step through a simulation to see explanations here.</div>';
      return;
    }

    container.innerHTML = steps.map(s => this.explainStep(s)).join('');
    // Auto-scroll to latest step
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Show a dismissible validation message
   */
  showValidation(message, type = 'info') {
    const container = document.getElementById(this.validationContainerId);
    if (!container) return;

    const icons = {
      success: '<i class="fas fa-check-circle"></i>',
      error:   '<i class="fas fa-exclamation-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      info:    '<i class="fas fa-info-circle"></i>'
    };

    const colors = {
      success: { bg: 'rgba(76, 175, 80, 0.15)', border: '#4CAF50', text: '#2E7D32' },
      error:   { bg: 'rgba(244, 67, 54, 0.15)', border: '#f44336', text: '#C62828' },
      warning: { bg: 'rgba(255, 152, 0, 0.15)', border: '#FF9800', text: '#E65100' },
      info:    { bg: 'rgba(33, 150, 243, 0.15)', border: '#2196F3', text: '#1565C0' }
    };

    const theme = document.documentElement.getAttribute('data-theme');
    const c = colors[type] || colors.info;

    const div = document.createElement('div');
    div.className = `validation-msg validation-${type}`;
    div.style.cssText = `
      padding: 12px 16px; margin-bottom: 8px; border-radius: 8px;
      display: flex; align-items: center; gap: 10px; font-size: 0.9rem;
      background: ${c.bg}; border-left: 4px solid ${c.border};
      color: ${theme === 'dark' ? '#e0e0e0' : c.text};
      animation: slideIn 0.3s ease;
    `;
    div.innerHTML = `
      ${icons[type] || icons.info}
      <span style="flex:1;">${message}</span>
      <span style="cursor:pointer;opacity:0.6;font-size:1.2rem;" onclick="this.parentElement.remove()">×</span>
    `;

    container.prepend(div);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      if (div.parentElement) {
        div.style.opacity = '0';
        div.style.transform = 'translateX(-20px)';
        div.style.transition = 'all 0.3s ease';
        setTimeout(() => div.remove(), 300);
      }
    }, 6000);
  }

  /**
   * Clear validation messages
   */
  clearValidation() {
    const container = document.getElementById(this.validationContainerId);
    if (container) container.innerHTML = '';
  }

  /**
   * Get comprehensive background theory HTML
   */
  getTheoryHTML() {
    return `
      <div class="theory-section">
        <h3>📖 Locking Protocols in DBMS</h3>
        <p>Locking protocols ensure <strong>serializability</strong> and maintain database consistency during concurrent transaction execution.</p>

        <h4>1. What are Locks?</h4>
        <p>A <strong>lock</strong> is a mechanism that controls access to a data item by concurrent transactions.</p>
        <ul>
          <li><strong>Shared Lock (S-lock)</strong>: Acquired for <em>reading</em>. Multiple transactions can hold S-locks on the same item simultaneously.</li>
          <li><strong>Exclusive Lock (X-lock)</strong>: Acquired for <em>writing</em>. Only one transaction can hold an X-lock, and no other locks can coexist.</li>
        </ul>

        <h4>2. Lock Compatibility Matrix</h4>
        <table class="theory-table">
          <thead>
            <tr><th>Request ↓ / Held →</th><th>S-lock</th><th>X-lock</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>S-lock</strong></td><td style="color:#4CAF50;font-weight:bold;">✅ Compatible</td><td style="color:#f44336;font-weight:bold;">❌ Conflict</td></tr>
            <tr><td><strong>X-lock</strong></td><td style="color:#f44336;font-weight:bold;">❌ Conflict</td><td style="color:#f44336;font-weight:bold;">❌ Conflict</td></tr>
          </tbody>
        </table>

        <h4>3. Two-Phase Locking (2PL) Protocol</h4>
        <p>Guarantees <strong>conflict-serializability</strong>. Every transaction goes through two phases:</p>
        <div class="theory-info-box">
          <div><strong>📈 Growing Phase:</strong> Transaction may acquire locks but <em>cannot release</em> any.</div>
          <div><strong>📉 Shrinking Phase:</strong> Transaction may release locks but <em>cannot acquire</em> new ones.</div>
        </div>

        <h4>4. 2PL Variants</h4>
        <table class="theory-table">
          <thead>
            <tr><th>Variant</th><th>Lock Release Rule</th><th>Prevents</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Basic 2PL</strong></td>
              <td>Locks can be released after all are acquired</td>
              <td>Non-serializable schedules</td>
            </tr>
            <tr>
              <td><strong>Strict 2PL</strong></td>
              <td>X-locks held until commit/abort</td>
              <td>Cascading rollbacks</td>
            </tr>
            <tr>
              <td><strong>Rigorous 2PL</strong></td>
              <td><em>All</em> locks held until commit/abort</td>
              <td>Cascading rollbacks + ensures commit-order serializability</td>
            </tr>
          </tbody>
        </table>

        <h4>5. Deadlocks</h4>
        <p>A <strong>deadlock</strong> occurs when two or more transactions are waiting for each other to release locks, creating a circular wait.</p>
        <div class="theory-info-box" style="border-left-color:#f44336;">
          <strong>Detection:</strong> Build a <em>Wait-For Graph</em>. If the graph contains a <strong>cycle</strong>, a deadlock exists.
        </div>
        <p><strong>Example:</strong> T1 holds A, waits for B. T2 holds B, waits for A → Circular dependency → Deadlock!</p>

        <h4>6. Real-World Applications</h4>
        <ul>
          <li><strong>MySQL InnoDB</strong> uses Strict 2PL with deadlock detection</li>
          <li><strong>PostgreSQL</strong> uses a variant of 2PL with MVCC</li>
          <li><strong>Oracle</strong> combines row-level locking with MVCC for reads</li>
          <li><strong>SQL Server</strong> supports multiple isolation levels using 2PL</li>
        </ul>
      </div>
    `;
  }

  /**
   * Clear the explanation steps panel
   */
  clear() {
    const container = document.getElementById(this.stepsContainerId);
    if (container) container.innerHTML = '';
  }
}

window.StepExplainer = StepExplainer;
