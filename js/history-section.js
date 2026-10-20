/**
 * history-section.js — History section.
 *
 * Two clearly separated lists:
 *   • Simulation history — the existing simulator runs (kept in the
 *     simulations table, exactly as before).
 *   • My quiz history   — the signed-in user's completed quiz attempts.
 * They are stored in different tables and are not mixed together.
 */

class HistorySection {
  constructor() {
    this.container = document.getElementById('history-content');
    this.tab = 'simulations';
  }

  async init() {
    if (!this.container) return;
    this.renderShell();
    this.bindEvents();
    await this.loadSimulations();
  }

  renderShell() {
    this.container.innerHTML = `
      <div class="history-section-wrap">
        <div class="history-tabs" role="tablist">
          <button type="button" class="history-tab is-active" data-history-tab="simulations" role="tab" aria-selected="true">
            <i class="fas fa-flask"></i> Simulation History
          </button>
          <button type="button" class="history-tab" data-history-tab="quizzes" role="tab" aria-selected="false">
            <i class="fas fa-brain"></i> My Quiz History
          </button>
        </div>
        <div id="history-panel"></div>
      </div>`;
  }

  bindEvents() {
    this.container.querySelectorAll('.history-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.container.querySelectorAll('.history-tab').forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        this.tab = tab.getAttribute('data-history-tab');
        if (this.tab === 'simulations') this.loadSimulations();
        else this.loadQuizzes();
      });
    });
  }

  async loadSimulations() {
    const panel = this.container.querySelector('#history-panel');
    panel.innerHTML = '<div class="quiz-loading"><i class="fas fa-spinner fa-spin"></i><p>Loading simulation history…</p></div>';

    try {
      const response = await fetch('/api/history');
      const entries = await response.json();

      if (!entries.length) {
        panel.innerHTML = `
          <div class="quiz-empty-state">
            <i class="fas fa-flask"></i>
            <h3>No simulations yet</h3>
            <p>Run a simulation in the Simulator tab and it will be listed here.</p>
          </div>`;
        return;
      }

      panel.innerHTML = `
        <div class="history-list-full">
          ${entries.map(entry => `
            <div class="history-item-full">
              <div class="history-item-top">
                <strong>${escapeHtml(entry.exampleName || 'Custom')}</strong>
                <span class="history-result ${entry.isDeadlocked ? 'is-deadlock' : 'is-ok'}">${entry.isDeadlocked ? '🔴 Deadlock' : '✅ Completed'}</span>
              </div>
              <div class="history-item-meta">
                <span><i class="fas fa-lock"></i> ${escapeHtml(entry.protocol || '')}</span>
                <span><i class="fas fa-code-branch"></i> ${escapeHtml(entry.transactions || '')}</span>
                <span><i class="fas fa-list-ol"></i> ${entry.totalSteps} steps</span>
                <span><i class="fas fa-clock"></i> ${new Date(entry.timestamp).toLocaleString()}</span>
              </div>
              <div class="history-item-actions">
                <button type="button" class="btn btn-outline btn-sm" data-replay="${escapeHtml(entry.id)}">
                  <i class="fas fa-play"></i> Replay
                </button>
                <button type="button" class="btn btn-danger btn-sm" data-delete="${escapeHtml(entry.id)}">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>`).join('')}
        </div>`;

      panel.querySelectorAll('[data-replay]').forEach(button => {
        button.addEventListener('click', () => {
          if (window.app && window.app.replayFromHistory) {
            window.app.replayFromHistory(button.getAttribute('data-replay'));
            if (window.app.navigation) window.app.navigation.navigateTo('simulator');
          }
        });
      });

      panel.querySelectorAll('[data-delete]').forEach(button => {
        button.addEventListener('click', async () => {
          const id = button.getAttribute('data-delete');
          try {
            await fetch(`/api/history/${id}`, { method: 'DELETE' });
            this.loadSimulations();
            if (window.app) window.app.loadHistory();
          } catch (error) {
            /* ignore */
          }
        });
      });
    } catch (error) {
      panel.innerHTML = '<div class="quiz-error-state"><i class="fas fa-plug-circle-xmark"></i><h3>The simulation history could not be loaded.</h3></div>';
    }
  }

  async loadQuizzes() {
    const panel = this.container.querySelector('#history-panel');
    panel.innerHTML = '<div class="quiz-loading"><i class="fas fa-spinner fa-spin"></i><p>Loading quiz history…</p></div>';

    const user = window.authManager ? await window.authManager.refresh() : null;
    if (!user) {
      panel.innerHTML = `
        <div class="quiz-empty-state">
          <i class="fas fa-user-lock"></i>
          <h3>Sign in to see your quiz history</h3>
          <p>Your completed quizzes, scores and answers are stored against your account.</p>
          <button type="button" class="btn btn-primary" id="history-signin"><i class="fas fa-right-to-bracket"></i> Sign in</button>
        </div>`;
      panel.querySelector('#history-signin')?.addEventListener('click', () => {
        if (window.authManager) window.authManager.openModal('login');
      });
      return;
    }

    try {
      const response = await fetch('/api/quiz-attempts/me?limit=100');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load your quiz history.');

      if (!data.attempts.length) {
        panel.innerHTML = `
          <div class="quiz-empty-state">
            <i class="fas fa-brain"></i>
            <h3>No quizzes completed yet</h3>
            <p>Take an Easy, Medium or Hard quiz — or practise with a competitive exam — and your result will appear here.</p>
          </div>`;
        return;
      }

      panel.innerHTML = `
        <div class="quiz-history-stats">
          <div class="quiz-history-stat"><span>${data.total}</span><label>Quizzes completed</label></div>
          <div class="quiz-history-stat"><span>${data.attempts.reduce((sum, a) => sum + a.pointsEarned, 0)}</span><label>Total points</label></div>
          <div class="quiz-history-stat"><span>${data.attempts.length ? Math.round(data.attempts.reduce((sum, a) => sum + a.accuracy, 0) / data.attempts.length) : 0}%</span><label>Average accuracy</label></div>
        </div>
        <div class="table-responsive">
          <table class="quiz-history-table">
            <thead>
              <tr>
                <th scope="col">Quiz</th>
                <th scope="col">Category</th>
                <th scope="col">Date</th>
                <th scope="col">Score</th>
                <th scope="col">Points</th>
                <th scope="col">Accuracy</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              ${data.attempts.map(attempt => `
                <tr>
                  <td>${escapeHtml(attempt.title)}</td>
                  <td>${escapeHtml(categoryLabel(attempt))}</td>
                  <td>${new Date(attempt.completedAt).toLocaleString()}</td>
                  <td>${attempt.correctCount}/${attempt.totalQuestions}</td>
                  <td>${attempt.pointsEarned}/${attempt.pointsPossible}</td>
                  <td>${attempt.accuracy}%</td>
                  <td><button type="button" class="btn btn-outline btn-sm" data-review="${escapeHtml(attempt.id)}"><i class="fas fa-eye"></i> Review</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div id="quiz-review-detail" class="quiz-review-detail-panel"></div>`;

      panel.querySelectorAll('[data-review]').forEach(button => {
        button.addEventListener('click', () => this.loadReview(button.getAttribute('data-review')));
      });
    } catch (error) {
      panel.innerHTML = `<div class="quiz-error-state"><i class="fas fa-triangle-exclamation"></i><h3>${escapeHtml(error.message)}</h3></div>`;
    }
  }

  async loadReview(attemptId) {
    const host = this.container.querySelector('#quiz-review-detail');
    if (!host) return;
    host.innerHTML = '<div class="quiz-loading"><i class="fas fa-spinner fa-spin"></i><p>Loading your answers…</p></div>';
    host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try {
      const response = await fetch(`/api/quiz-attempts/${attemptId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load the attempt.');

      host.innerHTML = `
        <h3 class="quiz-review-detail-title">${escapeHtml(data.attempt.title)} — ${data.attempt.correctCount}/${data.attempt.totalQuestions} correct · ${data.attempt.pointsEarned}/${data.attempt.pointsPossible} points</h3>
        ${data.review.map((item, index) => `
          <div class="quiz-review-item ${item.isCorrect ? 'quiz-review-correct' : 'quiz-review-wrong'}">
            <div class="quiz-review-header">
              <span>${item.isCorrect ? '✅' : '❌'} Q${index + 1}: ${escapeHtml(item.prompt).replace(/\n/g, ' ')}</span>
              ${item.label ? `<span class="quiz-review-badge">${escapeHtml(item.label)}</span>` : ''}
            </div>
            <div class="quiz-review-detail">
              <p><strong>Your answer:</strong> ${escapeHtml(optionText(item.options, item.selectedOptionIds) || 'No answer')}</p>
              ${!item.isCorrect ? `<p><strong>Correct answer:</strong> ${escapeHtml(optionText(item.options, item.correctOptionIds))}</p>` : ''}
            </div>
            ${item.explanation ? `<p class="quiz-review-explanation">${escapeHtml(item.explanation)}</p>` : ''}
            ${item.sourceUrl ? `<p class="quiz-review-source"><a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">View the source <i class="fas fa-external-link-alt"></i></a></p>` : ''}
          </div>`).join('')}`;
    } catch (error) {
      host.innerHTML = `<div class="quiz-error-state"><i class="fas fa-triangle-exclamation"></i><h3>${escapeHtml(error.message)}</h3></div>`;
    }
  }
}

function categoryLabel(attempt) {
  if (attempt.category === 'competitive') {
    return attempt.examYear ? `Competitive — ${attempt.examYear}` : 'Competitive Exam';
  }
  return attempt.difficulty ? `${attempt.difficulty.charAt(0).toUpperCase()}${attempt.difficulty.slice(1)}` : attempt.category;
}

function optionText(options, ids) {
  return (ids || []).map(id => {
    const option = (options || []).find(o => o.id === id);
    return option ? option.text : id;
  }).join(' | ');
}


window.HistorySection = HistorySection;
