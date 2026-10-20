/**
 * leaderboard.js — Leaderboard section.
 *
 * The ranking is produced by the server from the quiz_attempts table in
 * SQLite; nothing here is hard-coded.
 *
 * Ranking rule
 *   • Only the BEST attempt of each user in each category is counted, so
 *     replaying the same quiz can never inflate a score.
 *   • Total points = the sum of those best attempts.
 *   • Tie-breakers: average accuracy → number of quizzes → username.
 */

class LeaderboardSection {
  constructor() {
    this.container = document.getElementById('leaderboard-content');
    this.scope = 'overall';
    this.page = 0;
    this.limit = 25;
    this.exams = [];
  }

  async init() {
    if (!this.container) return;
    this.renderShell();
    this.bindEvents();
    await this.loadExams();
    await this.load();
  }

  renderShell() {
    this.container.innerHTML = `
      <div class="leaderboard-section">
        <div class="leaderboard-toolbar">
          <div class="leaderboard-scopes" id="leaderboard-scopes">
            <button type="button" class="scope-btn is-active" data-scope="overall"><i class="fas fa-trophy"></i> Overall</button>
            <button type="button" class="scope-btn" data-scope="easy"><span class="scope-dot scope-easy"></span> Easy</button>
            <button type="button" class="scope-btn" data-scope="medium"><span class="scope-dot scope-medium"></span> Medium</button>
            <button type="button" class="scope-btn" data-scope="hard"><span class="scope-dot scope-hard"></span> Hard</button>
            <button type="button" class="scope-btn" data-scope="competitive"><i class="fas fa-graduation-cap"></i> Competitive Exams</button>
            <span id="leaderboard-exam-scopes" class="leaderboard-exam-scopes"></span>
          </div>
          <div class="leaderboard-rule">
            <i class="fas fa-info-circle"></i>
            <span>Only the best attempt in each category counts — replaying a quiz cannot inflate a ranking.</span>
          </div>
        </div>

        <div id="leaderboard-me" class="leaderboard-me" style="display:none"></div>
        <div id="leaderboard-body" class="leaderboard-body"></div>
        <div id="leaderboard-pagination" class="leaderboard-pagination"></div>
      </div>`;
  }

  async loadExams() {
    try {
      const response = await fetch('/api/exams');
      const data = await response.json();
      this.exams = data.exams || [];
      const host = this.container.querySelector('#leaderboard-exam-scopes');
      if (host) {
        host.innerHTML = this.exams
          .map(exam => `<button type="button" class="scope-btn scope-btn-exam" data-scope="exam:${escapeHtml(exam.id)}"><i class="fas fa-file-lines"></i> ${escapeHtml(exam.name)}</button>`)
          .join('');
      }
    } catch (error) {
      /* the exam filters are optional */
    }
  }

  bindEvents() {
    this.container.querySelectorAll('.scope-btn').forEach(button => {
      button.addEventListener('click', () => {
        this.container.querySelectorAll('.scope-btn').forEach(b => b.classList.remove('is-active'));
        button.classList.add('is-active');
        this.scope = button.getAttribute('data-scope');
        this.page = 0;
        this.load();
      });
    });
  }

  async load() {
    const body = this.container.querySelector('#leaderboard-body');
    body.innerHTML = '<div class="quiz-loading"><i class="fas fa-spinner fa-spin"></i><p>Loading the leaderboard…</p></div>';

    const params = new URLSearchParams({
      scope: this.scope,
      limit: String(this.limit),
      offset: String(this.page * this.limit)
    });

    try {
      const response = await fetch(`/api/leaderboard?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load the leaderboard.');

      this.renderMe(data.me);
      this.renderTable(data);
      this.renderPagination(data);
    } catch (error) {
      body.innerHTML = `<div class="quiz-error-state"><i class="fas fa-plug-circle-xmark"></i><h3>${escapeHtml(error.message)}</h3></div>`;
    }
  }

  renderMe(me) {
    const host = this.container.querySelector('#leaderboard-me');
    if (!host) return;
    if (!me) {
      host.style.display = 'none';
      return;
    }
    host.style.display = 'flex';
    host.innerHTML = `
      <div class="leaderboard-me-card">
        <div class="leaderboard-me-rank">#${me.rank}</div>
        <div class="leaderboard-me-info">
          <strong>Your position</strong>
          <span>${me.totalPoints} points · ${me.quizzesCompleted} quizzes · best ${me.bestScore}% · average accuracy ${me.averageAccuracy}%</span>
        </div>
        <span class="leaderboard-me-total">of ${me.total} player(s)</span>
      </div>`;
  }

  renderTable(data) {
    const body = this.container.querySelector('#leaderboard-body');

    if (!data.entries.length) {
      body.innerHTML = `
        <div class="quiz-empty-state">
          <i class="fas fa-trophy"></i>
          <h3>No results yet</h3>
          <p>Complete a quiz and your name will appear on the leaderboard.</p>
        </div>`;
      return;
    }

    body.innerHTML = `
      <div class="table-responsive">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Player</th>
              <th scope="col">Total points</th>
              <th scope="col">Quizzes</th>
              <th scope="col">Best score</th>
              <th scope="col">Avg. accuracy</th>
            </tr>
          </thead>
          <tbody>
            ${data.entries.map(entry => `
              <tr class="${entry.rank <= 3 ? 'is-top-' + entry.rank : ''}">
                <td class="leaderboard-rank">${entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}</td>
                <td class="leaderboard-player">
                  <span class="auth-avatar auth-avatar-small">${escapeHtml((entry.displayName || entry.username).charAt(0).toUpperCase())}</span>
                  <span>${escapeHtml(entry.displayName || entry.username)}</span>
                </td>
                <td class="leaderboard-points">${entry.totalPoints}</td>
                <td>${entry.quizzesCompleted}</td>
                <td>${entry.bestScore}%</td>
                <td>${entry.averageAccuracy}%</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <p class="leaderboard-rule-note"><i class="fas fa-scale-balanced"></i> ${escapeHtml(data.scoringRule || '')}</p>`;
  }

  renderPagination(data) {
    const host = this.container.querySelector('#leaderboard-pagination');
    if (!host) return;

    const pages = Math.ceil(data.total / this.limit);
    if (pages <= 1) {
      host.innerHTML = '';
      return;
    }

    host.innerHTML = `
      <button type="button" class="btn btn-outline btn-sm" id="lb-prev" ${this.page === 0 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i> Previous</button>
      <span>Page ${this.page + 1} of ${pages} · ${data.total} player(s)</span>
      <button type="button" class="btn btn-outline btn-sm" id="lb-next" ${this.page + 1 >= pages ? 'disabled' : ''}>Next <i class="fas fa-chevron-right"></i></button>`;

    host.querySelector('#lb-prev')?.addEventListener('click', () => {
      if (this.page > 0) { this.page -= 1; this.load(); }
    });
    host.querySelector('#lb-next')?.addEventListener('click', () => {
      this.page += 1; this.load();
    });
  }
}


window.LeaderboardSection = LeaderboardSection;
