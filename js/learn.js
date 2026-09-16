class LearnSection {
  constructor() {}

  // Returns the complete Learn section HTML as a string
  // This will be injected into #learn-content
  render() {
    return `
      <div class="learn-section">
        
        <div class="learn-card">
          <div class="learn-card-header">
            <h3>📖 2.1 Introduction</h3>
          </div>
          <p>Database systems often allow multiple transactions to access data at the same time. Without proper control, simultaneous operations can lead to inconsistent or incorrect data.</p>
          <p>Locking protocols are concurrency control mechanisms used in DBMS to manage simultaneous access to data items. Locks ensure that transactions access shared data safely and maintain database consistency.</p>
        </div>

        <div class="learn-card">
          <div class="learn-card-header">
            <h3>📋 2.2 What is a Transaction?</h3>
          </div>
          <p>A transaction is a sequence of database operations treated as a single logical unit of work.</p>
          <p>A transaction may perform operations such as:</p>
          <ul>
            <li>R(A) → Read data item A</li>
            <li>W(A) → Write or modify data item A</li>
            <li>C → Commit the transaction</li>
          </ul>
          <div class="code-block">
            <strong>Example:</strong><br>
            T1: R(A), W(B), C<br>
            This transaction reads A, writes B, and then commits.
          </div>
        </div>

        <div class="learn-card">
          <div class="learn-card-header">
            <h3>🔒 2.3 What is a Lock?</h3>
          </div>
          <p>A lock is a mechanism that controls access to a data item while a transaction is using it.</p>
          <p>Before accessing a data item, a transaction requests an appropriate lock.</p>
          <p>The two main types of locks are:</p>
          <ul>
            <li>Shared Lock (S-Lock)</li>
            <li>Exclusive Lock (X-Lock)</li>
          </ul>
        </div>

        <div class="learn-card" style="border-left: 4px solid var(--accent-success);">
          <div class="learn-card-header">
            <h3>🔓 2.4 Shared Lock (S-Lock)</h3>
          </div>
          <p>A Shared Lock allows a transaction to read a data item.<br>Multiple transactions can hold Shared Locks on the same data item simultaneously.</p>
          <div class="code-block">
            <strong>Example:</strong><br>
            T1 reads A → S-Lock on A<br>
            T2 reads A → S-Lock on A<br>
            Both transactions can read A at the same time because Shared Locks are compatible with other Shared Locks.
          </div>
        </div>

        <div class="learn-card" style="border-left: 4px solid var(--accent-warning);">
          <div class="learn-card-header">
            <h3>🔐 2.5 Exclusive Lock (X-Lock)</h3>
          </div>
          <p>An Exclusive Lock allows a transaction to write or modify a data item.<br>Only one transaction can hold an Exclusive Lock on a data item.</p>
          <div class="code-block">
            <strong>Example:</strong><br>
            T1 writes A → X-Lock on A<br>
            While T1 holds the X-Lock:<br>
            • T2 cannot read A.<br>
            • T2 cannot write A.<br>
            T2 must wait until T1 releases the lock.
          </div>
        </div>

        <div class="learn-card">
          <div class="learn-card-header">
            <h3>3. Lock Compatibility Matrix</h3>
          </div>
          <table class="compat-matrix">
            <thead>
              <tr><th>Existing Lock</th><th>Request S</th><th>Request X</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>S Lock</td>
                <td class="compat-yes" title="Two Shared Locks are compatible because multiple transactions can read the same data simultaneously.">✅ Allowed</td>
                <td class="compat-no" title="An Exclusive Lock conflicts with Shared Locks because writing must have exclusive access.">❌ Not Allowed</td>
              </tr>
              <tr>
                <td>X Lock</td>
                <td class="compat-no" title="An Exclusive Lock conflicts with Shared Locks.">❌ Not Allowed</td>
                <td class="compat-no" title="Two Exclusive Locks conflict because only one writer can access the data at a time.">❌ Not Allowed</td>
              </tr>
            </tbody>
          </table>
          <ul>
            <li>Two Shared Locks are compatible because multiple transactions can read the same data simultaneously.</li>
            <li>An Exclusive Lock conflicts with both Shared and Exclusive Locks because writing must have exclusive access.</li>
          </ul>
        </div>

        <div class="learn-card">
          <div class="learn-card-header">
            <h3>4.1 Basic Two-Phase Locking (2PL)</h3>
          </div>
          <p>Two-Phase Locking divides a transaction into two phases:</p>
          <ol>
            <li><strong>Growing Phase:</strong> The transaction can acquire locks but cannot release locks.</li>
            <li><strong>Shrinking Phase:</strong> The transaction can release locks but cannot acquire new locks.</li>
          </ol>
          <p>Two-Phase Locking helps maintain serializability but may lead to deadlocks.</p>
          <div class="phase-diagram" style="text-align: center; margin: 20px 0;">
            <div class="phase growing" style="display: inline-block; padding: 10px; border: 2px solid var(--accent-success); border-radius: 5px; margin-bottom: 10px;">📈 Growing Phase<br>Acquire Locks</div>
            <div class="phase-arrow">↓ Lock Point ↓</div>
            <div class="phase shrinking" style="display: inline-block; padding: 10px; border: 2px solid var(--accent-warning); border-radius: 5px; margin-top: 10px;">📉 Shrinking Phase<br>Release Locks</div>
          </div>
        </div>

        <div class="learn-card">
          <div class="learn-card-header">
            <h3>4.2 Strict Two-Phase Locking</h3>
          </div>
          <p>Strict Two-Phase Locking requires transactions to hold Exclusive Locks until the transaction commits or aborts.<br>This prevents other transactions from accessing modified data before the transaction is completed.<br>Strict 2PL helps prevent cascading rollbacks and improves recoverability.</p>
        </div>

        <div class="learn-card">
          <div class="learn-card-header">
            <h3>4.3 Conservative Two-Phase Locking <span class="theory-badge" style="background-color: var(--accent-info); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8em;">📘 Theory Only</span></h3>
          </div>
          <p>Conservative Two-Phase Locking requires a transaction to acquire all required locks before it begins execution.<br>If all locks are not available, the transaction waits before starting.<br>Because transactions do not hold some locks while waiting for others, Conservative 2PL can prevent deadlocks.<br>However, it may reduce concurrency.</p>
          <p style="color: var(--accent-warning);">⚠️ Note: This protocol is included for educational purposes. The simulator supports Basic, Strict, and Rigorous 2PL.</p>
        </div>

        <div class="learn-card" style="border-left: 4px solid var(--accent-danger);">
          <div class="learn-card-header">
            <h3>5. Deadlock Theory</h3>
          </div>
          <p>A deadlock occurs when two or more transactions wait indefinitely for each other to release locks.</p>
          <div class="code-block">
            <strong>Example:</strong><br>
            T1 holds A and requests B.<br>
            T2 holds B and requests A.<br>
            T1 waits for T2. T2 waits for T1. Neither can continue.
          </div>
          <div class="deadlock-diagram" style="font-family: monospace; text-align: center; margin: 20px 0; background: var(--bg-input); padding: 15px; border-radius: 8px;">
            <div class="dd-row">
              <span class="dd-node" style="padding: 5px; border: 1px solid var(--border-color); border-radius: 5px;">T1</span>
              <span class="dd-arrow">── waits for ──►</span>
              <span class="dd-node" style="padding: 5px; border: 1px solid var(--border-color); border-radius: 5px;">T2</span>
            </div>
            <div class="dd-row">
              <span class="dd-arrow-up">▲</span>
              <span style="display:inline-block; width: 120px;"></span>
              <span class="dd-arrow-down">▼</span>
            </div>
            <div class="dd-row">
              <span style="display:inline-block; width: 30px;"></span>
              <span class="dd-arrow">◄── waits for ──</span>
              <span style="display:inline-block; width: 30px;"></span>
            </div>
          </div>
          <p>The application detects deadlocks using a Wait-For Graph. If the Wait-For Graph contains a cycle, a deadlock exists.</p>
        </div>

        <div class="learn-card">
          <div class="learn-card-header">
            <h3>6. Wait-For Graph Theory</h3>
          </div>
          <p>A Wait-For Graph represents dependencies between transactions.</p>
          <ul>
            <li>Each node represents a transaction.</li>
            <li>An edge T1 → T2 means T1 is waiting for T2 to release a resource.</li>
            <li>If the graph contains a cycle, the transactions involved in the cycle are deadlocked.</li>
          </ul>
          <div class="code-block">
            <strong>Example:</strong><br>
            T1 → T2<br>
            T2 → T1<br>
            Cycle detected → Deadlock
          </div>
        </div>

        <div class="learn-card">
          <div class="learn-card-header">
            <h3>7. Real-World Use Cases</h3>
          </div>
          <div class="usecase-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <div class="usecase-card" style="padding: 15px; border: 1px solid var(--border-color); border-radius: 8px; transition: transform 0.2s, box-shadow 0.2s;">
              <h4>🏦 Online Banking</h4>
              <p>When multiple users transfer money simultaneously, locking ensures that account balances remain consistent.</p>
            </div>
            <div class="usecase-card" style="padding: 15px; border: 1px solid var(--border-color); border-radius: 8px; transition: transform 0.2s, box-shadow 0.2s;">
              <h4>✈️ Airline or Railway Booking</h4>
              <p>Locks prevent multiple users from booking the same seat simultaneously.</p>
            </div>
            <div class="usecase-card" style="padding: 15px; border: 1px solid var(--border-color); border-radius: 8px; transition: transform 0.2s, box-shadow 0.2s;">
              <h4>🛒 E-Commerce Inventory</h4>
              <p>Locks prevent multiple customers from purchasing the same limited inventory item at the same time.</p>
            </div>
            <div class="usecase-card" style="padding: 15px; border: 1px solid var(--border-color); border-radius: 8px; transition: transform 0.2s, box-shadow 0.2s;">
              <h4>🏥 Hospital Management</h4>
              <p>Locks help prevent conflicting updates to patient records when multiple staff members access the same information.</p>
            </div>
          </div>
        </div>

        <div class="learn-card">
          <div class="learn-card-header">
            <h3>8. Limitations</h3>
          </div>
          <ul style="list-style-type: none; padding: 0;">
            <li class="limitation-item" style="margin-bottom: 10px;">1. ⚠️ <strong>Deadlocks</strong> — Transactions may wait for each other indefinitely.</li>
            <li class="limitation-item" style="margin-bottom: 10px;">2. 🐌 <strong>Reduced Concurrency</strong> — Transactions may need to wait even when they could otherwise execute.</li>
            <li class="limitation-item" style="margin-bottom: 10px;">3. 📊 <strong>Lock Overhead</strong> — The DBMS must maintain information about locks and waiting transactions.</li>
            <li class="limitation-item" style="margin-bottom: 10px;">4. ⏰ <strong>Starvation</strong> — Some transactions may wait for a long time if other transactions continuously receive priority.</li>
            <li class="limitation-item">5. 📉 <strong>Performance Impact</strong> — Frequent locking and waiting can reduce performance in highly concurrent systems.</li>
          </ul>
        </div>

        <div class="learn-card">
          <div class="learn-card-header">
            <h3>9. Learning Outcomes</h3>
          </div>
          <ul style="list-style-type: none; padding: 0;">
            <li class="outcome-item" style="margin-bottom: 5px; color: var(--accent-success);">✓ <span style="color: var(--text-primary);">Understand database transactions.</span></li>
            <li class="outcome-item" style="margin-bottom: 5px; color: var(--accent-success);">✓ <span style="color: var(--text-primary);">Understand Shared and Exclusive Locks.</span></li>
            <li class="outcome-item" style="margin-bottom: 5px; color: var(--accent-success);">✓ <span style="color: var(--text-primary);">Understand lock compatibility.</span></li>
            <li class="outcome-item" style="margin-bottom: 5px; color: var(--accent-success);">✓ <span style="color: var(--text-primary);">Visualize lock acquisition and release.</span></li>
            <li class="outcome-item" style="margin-bottom: 5px; color: var(--accent-success);">✓ <span style="color: var(--text-primary);">Understand Two-Phase Locking.</span></li>
            <li class="outcome-item" style="margin-bottom: 5px; color: var(--accent-success);">✓ <span style="color: var(--text-primary);">Interpret Lock Tables.</span></li>
            <li class="outcome-item" style="margin-bottom: 5px; color: var(--accent-success);">✓ <span style="color: var(--text-primary);">Interpret Wait-For Graphs.</span></li>
            <li class="outcome-item" style="margin-bottom: 5px; color: var(--accent-success);">✓ <span style="color: var(--text-primary);">Identify waiting transactions.</span></li>
            <li class="outcome-item" style="margin-bottom: 5px; color: var(--accent-success);">✓ <span style="color: var(--text-primary);">Detect deadlocks.</span></li>
            <li class="outcome-item" style="margin-bottom: 5px; color: var(--accent-success);">✓ <span style="color: var(--text-primary);">Understand how concurrency control maintains database consistency.</span></li>
          </ul>
        </div>

        <div class="learn-card">
          <div class="learn-card-header">
            <h3>🎥 10. Educational Video</h3>
          </div>
          <p>Watch this educational video to understand database locking and concurrency control concepts visually.</p>
          <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000; border-radius: 8px;">
            <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://www.youtube.com/embed/euc-5TBRpW4" title="Two Phase Locking Protocol in DBMS" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
          <p class="video-caption" style="text-align: center; font-size: 0.9em; margin-top: 10px; color: #666;">Video: Two Phase Locking (2PL) - Database Management System</p>
        </div>

        <div class="learn-card">
          <div class="learn-card-header">
            <h3>11. References</h3>
          </div>
          <div class="ref-card" style="margin-bottom: 15px;">
            <h4>Books:</h4>
            <ul>
              <li>Silberschatz, A., Korth, H. F., and Sudarshan, S. <em>Database System Concepts</em>. McGraw-Hill.</li>
              <li>Ramakrishnan, R., and Gehrke, J. <em>Database Management Systems</em>. McGraw-Hill.</li>
            </ul>
          </div>
          <div class="ref-card" style="margin-bottom: 15px;">
            <h4>Educational Resources:</h4>
            <ul>
              <li><a href="https://www.geeksforgeeks.org/two-phase-locking-protocol/" target="_blank">GeeksforGeeks — Two Phase Locking Protocol</a></li>
              <li><a href="https://www.javatpoint.com/dbms-lock-based-protocol" target="_blank">JavaTpoint — Lock-Based Protocol in DBMS</a></li>
              <li><a href="https://www.tutorialspoint.com/dbms/dbms_concurrency_control.htm" target="_blank">Tutorialspoint — DBMS Concurrency Control</a></li>
            </ul>
          </div>
          <div class="ref-card">
            <h4>Videos:</h4>
            <ul>
              <li>"Two Phase Locking (2PL)" — Database Management System educational video on YouTube</li>
            </ul>
          </div>
        </div>

        <div class="learn-card algo-card">
          <div class="learn-card-header">
            <h3>12. Technical Implementation</h3>
          </div>
          <h4>Lock Compatibility Checking:</h4>
          <div class="code-block" style="background: var(--bg-input); padding: 10px; border-radius: 5px; font-family: monospace; white-space: pre-wrap; margin-bottom: 15px;">1. Receive lock request (transaction, data item, lock type).
2. Check current lock holders for the data item.
3. Compare requested lock with existing locks using compatibility matrix.
4. If compatible, grant the lock.
5. If incompatible, place the transaction in the waiting queue.</div>
          
          <h4>Deadlock Detection Algorithm:</h4>
          <div class="code-block" style="background: var(--bg-input); padding: 10px; border-radius: 5px; font-family: monospace; white-space: pre-wrap;">The application uses a Wait-For Graph with DFS cycle detection.

1. Create a node for every active transaction.
2. If T1 waits for T2, create a directed edge: T1 → T2.
3. Run Depth-First Search (DFS) to detect cycles.
4. If a cycle exists, report a deadlock.

Time Complexity: O(V + E)
Where: V = Number of Transactions, E = Number of Waiting Dependencies</div>
        </div>

        <div class="learn-card">
          <div class="learn-card-header">
            <h3>13. Test Cases</h3>
          </div>
          <div style="overflow-x: auto;">
            <table class="test-table compat-matrix" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid var(--border-color); padding: 8px;">#</th>
                  <th style="border: 1px solid var(--border-color); padding: 8px;">Test Case</th>
                  <th style="border: 1px solid var(--border-color); padding: 8px;">Input</th>
                  <th style="border: 1px solid var(--border-color); padding: 8px;">Expected Result</th>
                  <th style="border: 1px solid var(--border-color); padding: 8px;">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center;">1</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px;">Shared Lock Compatibility</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px; font-family: monospace;">T1: R(A), C<br>T2: R(A), C</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px;">Both get S-Locks. Both commit.</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center;">✅ Pass</td>
                </tr>
                <tr>
                  <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center;">2</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px;">Exclusive Lock Conflict</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px; font-family: monospace;">T1: W(A), C<br>T2: R(A), C</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px;">T2 waits for T1's X-Lock. T2 proceeds after T1 commits.</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center;">✅ Pass</td>
                </tr>
                <tr>
                  <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center;">3</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px;">Independent Data Items</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px; font-family: monospace;">T1: W(A), C<br>T2: W(B), C</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px;">Both execute without waiting (different items).</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center;">✅ Pass</td>
                </tr>
                <tr>
                  <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center;">4</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px;">Lock Waiting (Upgrade)</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px; font-family: monospace;">T1: R(A), W(A), C<br>T2: R(A), C</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px;">T1 upgrade blocked while T2 holds S-Lock.</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center;">✅ Pass</td>
                </tr>
                <tr>
                  <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center;">5</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px;">Deadlock Detection</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px; font-family: monospace;">T1: W(A), W(B)<br>T2: W(B), W(A)</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px;">Deadlock detected. WFG: T1→T2, T2→T1</td>
                  <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center;">✅ Pass</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }
}
window.LearnSection = LearnSection;
