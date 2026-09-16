class HelpSection {
  constructor() {}

  // Returns the complete Help section HTML
  render() {
    return `
      <div class="help-section">
        
        <h2>How to Use the Locking Protocol Animation</h2>

        <div class="help-card help-step">
          <div class="learn-card-header">
            <h3><span class="help-step-number">Step 1:</span> ⚙️ Select a Locking Protocol</h3>
          </div>
          <p>Use the Protocol Type dropdown to select one of the following protocols. The selected protocol determines how locks are acquired and released:</p>
          <ul>
            <li><strong>Basic 2PL</strong></li>
            <li><strong>Strict 2PL</strong></li>
            <li><strong>Rigorous 2PL</strong></li>
          </ul>
        </div>

        <div class="help-card help-step">
          <div class="learn-card-header">
            <h3><span class="help-step-number">Step 2:</span> 📂 Load an Example</h3>
          </div>
          <p>Use the Load Example dropdown to quickly load a pre-defined scenario:</p>
          <ol>
            <li>Basic 2PL — No Conflict</li>
            <li>Shared Lock Compatibility</li>
            <li>Lock Conflict & Waiting</li>
            <li>Lock Upgrade Conflict</li>
            <li>Deadlock Scenario</li>
            <li>Rigorous 2PL Demo</li>
          </ol>
        </div>

        <div class="help-card help-step">
          <div class="learn-card-header">
            <h3><span class="help-step-number">Step 3:</span> ✏️ Enter Custom Transactions</h3>
          </div>
          <p>Enter your transactions in the input area using the following format:</p>
          <div class="help-code code-block" style="background: var(--bg-input); padding: 10px; border-radius: 5px; font-family: monospace; white-space: pre-wrap;">T1: R(A), W(B), C
T2: R(A), W(C), C</div>
          <p><strong>Syntax:</strong></p>
          <ul>
            <li><code>R(A)</code> = Read data item A</li>
            <li><code>W(A)</code> = Write data item A</li>
            <li><code>C</code> = Commit transaction</li>
          </ul>
          <p>Each transaction must be on a separate line.</p>
        </div>

        <div class="help-card help-step">
          <div class="learn-card-header">
            <h3><span class="help-step-number">Step 4:</span> ▶️ Run the Simulation</h3>
          </div>
          <p>Use the simulation controls to execute the transactions:</p>
          <ul class="help-button-list" style="list-style-type: none; padding-left: 0;">
            <li class="help-btn-item" style="margin-bottom: 8px;"><strong>Run All</strong> — Runs the complete simulation automatically</li>
            <li class="help-btn-item" style="margin-bottom: 8px;"><strong>Step</strong> — Executes one operation at a time</li>
            <li class="help-btn-item" style="margin-bottom: 8px;"><strong>Back</strong> — Moves back to the previous step</li>
            <li class="help-btn-item" style="margin-bottom: 8px;"><strong>Reset</strong> — Resets to initial state</li>
            <li class="help-btn-item" style="margin-bottom: 8px;"><strong>Auto Play</strong> — Automatically steps through with speed control</li>
            <li class="help-btn-item" style="margin-bottom: 8px;"><strong>Speed Control</strong> — 0.5x to 3x speed</li>
          </ul>
        </div>

        <div class="help-card help-step">
          <div class="learn-card-header">
            <h3><span class="help-step-number">Step 5:</span> Understanding the Output</h3>
          </div>
          <div style="margin-bottom: 15px;">
            <h4>📊 Lock Table</h4>
            <p>Displays current status of every data item. Shows: Data Item, Lock Holders, Lock Type, Waiting Queue.</p>
          </div>
          <div style="margin-bottom: 15px;">
            <h4>🔗 Wait-For Graph</h4>
            <p>Shows which transactions wait for others. An arrow T1→T2 means T1 waits for T2. Red pulsing nodes = deadlocked.</p>
          </div>
          <div style="margin-bottom: 15px;">
            <h4>📅 Timeline</h4>
            <p>Shows the order of operations. Color coded: green=granted, orange=waiting, red=deadlock.</p>
          </div>
          <div>
            <h4>📝 Explanation Panel</h4>
            <p>Step-by-step description of every operation: lock requested, granted/denied, waiting, conflicts, deadlock, commits.</p>
          </div>
        </div>

        <div class="help-card help-step">
          <div class="learn-card-header">
            <h3><span class="help-step-number">Step 6:</span> 📥 Export Results</h3>
          </div>
          <p>You can export the results of your simulation. JSON and PDF export options are available.</p>
        </div>

        <div class="help-card help-step">
          <div class="learn-card-header">
            <h3><span class="help-step-number">Step 7:</span> 📜 History</h3>
          </div>
          <p>Simulations are saved automatically and can be replayed from the History panel.</p>
        </div>

        <div class="help-card" style="border: 2px solid var(--accent-warning);">
          <div class="learn-card-header">
            <h3>⚠️ Input Validation Guide</h3>
          </div>
          <p>Examples of valid and invalid input:</p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 8px;">✅ <strong>Valid:</strong> <code>T1: R(A), W(B), C</code></li>
            <li style="margin-bottom: 8px;">❌ <strong>Empty input:</strong> Shows error</li>
            <li style="margin-bottom: 8px;">❌ <strong>Missing colon:</strong> <code>T1 W(A)</code> → Invalid format</li>
            <li style="margin-bottom: 8px;">❌ <strong>Invalid operation:</strong> <code>T1: X(A)</code> → Use R(), W(), or C</li>
            <li style="margin-bottom: 8px;">❌ <strong>Empty data item:</strong> <code>T1: W()</code> → Data item required</li>
          </ul>
        </div>

        <div class="help-card">
          <div class="learn-card-header">
            <h3>⌨️ Keyboard Shortcuts</h3>
          </div>
          <p>Note that mouse/touch is the primary interaction method. There are currently no specific keyboard shortcuts bound for simulation controls.</p>
        </div>

      </div>
    `;
  }
}
window.HelpSection = HelpSection;
