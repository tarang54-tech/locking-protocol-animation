/**
 * quiz.js — Difficulty-based quiz engine (Easy / Medium / Hard) plus the
 * shared quiz runner that the Competitive Exams section reuses.
 *
 * The runner talks to the server for everything that matters:
 *   • the server picks and shuffles the questions,
 *   • the server holds the answer key,
 *   • the server scores the attempt.
 * The client never sends a score and never receives the answer key before a
 * question has been answered.
 */

class QuizRunner {
  /**
   * @param {HTMLElement} container element the quiz is rendered into
   * @param {object} options
   *   - onExit:  called when the user leaves the quiz (back button)
   *   - getUser: returns the signed-in user or null
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.attemptId = null;
    this.questions = [];
    this.currentIndex = 0;
    this.answers = new Map(); // questionId -> { isCorrect, selected, explanation, pointsAwarded }
    this.meta = null;
    this.result = null;
    this.saved = false;
    this.title = '';
  }

  /* ───────────────────────── Data ───────────────────────── */

  async start(config) {
    this._setBusy(true, 'Preparing your quiz…');
    try {
      const response = await fetch('/api/quiz-attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        this._setBusy(false);
        this.renderError(data.error || 'The quiz could not be started.', data.code);
        return false;
      }

      this.attemptId = data.attemptId;
      this.questions = data.questions;
      this.meta = data.meta;
      this.saved = !!data.saved;
      this.currentIndex = 0;
      this.answers.clear();
      this.result = null;

      this.renderQuestion();
      return true;
    } catch (error) {
      this._setBusy(false);
      this.renderError('Could not reach the quiz server. Check your connection and try again.');
      return false;
    }
  }

  async submitAnswer(questionId, selectedOptionIds) {
    try {
      const response = await fetch(`/api/quiz-attempts/${this.attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, selected: selectedOptionIds })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        this.showInlineError(data.error || 'The answer could not be recorded.');
        return null;
      }
      this.answers.set(questionId, {
        isCorrect: data.isCorrect,
        selected: data.selectedOptionIds || [],
        correct: data.correctOptionIds || [],
        explanation: data.explanation || '',
        reference: data.reference || '',
        pointsAwarded: data.pointsAwarded || 0,
        pointsPossible: data.pointsPossible || 0
      });
      return data;
    } catch (error) {
      this.showInlineError('Could not reach the quiz server.');
      return null;
    }
  }

  async submitQuiz() {
    this._setBusy(true, 'Scoring your attempt…');
    try {
      const response = await fetch(`/api/quiz-attempts/${this.attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json().catch(() => ({}));
      this._setBusy(false);

      if (!response.ok) {
        this.showInlineError(data.error || 'The attempt could not be submitted.');
        return;
      }
      this.result = data;
      this.renderResults();
    } catch (error) {
      this._setBusy(false);
      this.showInlineError('Could not reach the quiz server.');
    }
  }

  /* ───────────────────────── Rendering ───────────────────────── */

  renderQuestion() {
    const question = this.questions[this.currentIndex];
    if (!question) return;

    const answer = this.answers.get(question.id);
    const isMulti = question.multi;
    const selected = answer ? answer.selected : [];

    const optionsHtml = question.options.map(option => {
      const isSelected = selected.includes(option.id);
      const isCorrect = answer && answer.correct.includes(option.id);
      const isWrongPick = answer && isSelected && !isCorrect;
      const classes = ['quiz-option-btn'];
      if (isSelected) classes.push('quiz-option-selected');
      if (answer && isCorrect) classes.push('quiz-option-correct');
      if (isWrongPick) classes.push('quiz-option-wrong');
      if (answer) classes.push('quiz-option-locked');

      return `
        <button type="button" class="${classes.join(' ')}" data-option-id="${escapeHtml(option.id)}"
                ${answer ? 'disabled' : ''} aria-pressed="${isSelected}">
          <span class="quiz-option-letter">${String.fromCharCode(65 + question.options.indexOf(option))}</span>
          <span class="quiz-option-text">${escapeHtml(option.text)}</span>
          ${isMulti ? `<span class="quiz-option-check" aria-hidden="true">${isSelected ? '✔' : ''}</span>` : ''}
        </button>`;
    }).join('');

    const progress = ((this.currentIndex + (answer ? 1 : 0)) / this.questions.length) * 100;

    const feedbackHtml = answer ? this.buildFeedback(question, answer) : '';

    this.container.innerHTML = `
      <div class="quiz-runner">
        <div class="quiz-runner-header">
          <div class="quiz-runner-meta">
            <span class="quiz-progress-label">Question ${this.currentIndex + 1} of ${this.questions.length}</span>
            ${question.difficulty ? `<span class="quiz-badge quiz-badge-${escapeHtml(question.difficulty)}">${escapeHtml(question.difficulty)}</span>` : ''}
            ${question.topic ? `<span class="quiz-badge quiz-badge-topic">${escapeHtml(question.topic)}</span>` : ''}
            <span class="quiz-badge quiz-badge-points">${question.points} pts</span>
          </div>
          <div class="quiz-runner-score">
            <span id="quiz-live-score">${this.liveScore()} pts</span>
          </div>
          <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${progress}%"></div></div>
        </div>

        <div class="quiz-question-card">
          ${question.label ? `<div class="quiz-source-line ${question.questionType === 'previous_year' ? 'is-previous-year' : 'is-practice'}">
              <i class="fas ${question.questionType === 'previous_year' ? 'fa-certificate' : 'fa-pen-to-square'}"></i>
              <strong>${escapeHtml(question.label)}</strong>
              ${question.sourceUrl ? `<a href="${escapeHtml(question.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source<i class="fas fa-external-link-alt"></i></a>` : ''}
            </div>` : ''}
          <p class="quiz-question-prompt">${escapeHtml(question.prompt).replace(/\n/g, '<br>')}</p>
          ${isMulti ? '<p class="quiz-multi-hint"><i class="fas fa-list-check"></i> Multiple answers are correct — select all that apply, then submit.</p>' : ''}
          <div class="quiz-options" id="quiz-options">${optionsHtml}</div>
          <div class="quiz-question-actions">
            ${isMulti && !answer ? '<button type="button" id="quiz-submit-answer" class="btn btn-primary">Submit Answer</button>' : ''}
          </div>
          <div id="quiz-inline-error" class="quiz-inline-error" style="display:none"></div>
        </div>

        <div id="quiz-feedback" class="quiz-feedback ${answer ? (answer.isCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-wrong') : ''}" style="display:${answer ? 'block' : 'none'}">${feedbackHtml}</div>

        <div class="quiz-runner-footer">
          <button type="button" id="quiz-prev" class="btn btn-outline" ${this.currentIndex === 0 ? 'disabled' : ''}>
            <i class="fas fa-arrow-left"></i> Previous
          </button>
          <button type="button" id="quiz-exit" class="btn btn-outline btn-quit"><i class="fas fa-times"></i> Exit</button>
          <button type="button" id="quiz-next" class="btn btn-primary">
            ${this.currentIndex === this.questions.length - 1 ? 'See Results' : 'Next Question'} <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>`;

    this._bindQuestionEvents();
  }

  _bindQuestionEvents() {
    const optionButtons = Array.from(this.container.querySelectorAll('.quiz-option-btn'));
    const question = this.questions[this.currentIndex];
    const isMulti = question.multi;
    let pendingSelection = [];

    optionButtons.forEach(button => {
      button.addEventListener('click', async () => {
        if (this.answers.has(question.id)) return; // already answered
        const optionId = button.getAttribute('data-option-id');

        if (isMulti) {
          if (pendingSelection.includes(optionId)) {
            pendingSelection = pendingSelection.filter(id => id !== optionId);
            button.classList.remove('quiz-option-selected');
            button.setAttribute('aria-pressed', 'false');
            const check = button.querySelector('.quiz-option-check');
            if (check) check.textContent = '';
          } else {
            pendingSelection.push(optionId);
            button.classList.add('quiz-option-selected');
            button.setAttribute('aria-pressed', 'true');
            const check = button.querySelector('.quiz-option-check');
            if (check) check.textContent = '✔';
          }
          return;
        }

        await this.submitAnswer(question.id, [optionId]);
        this.renderQuestion();
      });
    });

    this.container.querySelector('#quiz-submit-answer')?.addEventListener('click', async () => {
      if (!pendingSelection.length) {
        this.showInlineError('Select at least one option before submitting.');
        return;
      }
      await this.submitAnswer(question.id, pendingSelection);
      this.renderQuestion();
    });

    this.container.querySelector('#quiz-prev')?.addEventListener('click', () => {
      if (this.currentIndex > 0) {
        this.currentIndex -= 1;
        this.renderQuestion();
      }
    });

    this.container.querySelector('#quiz-next')?.addEventListener('click', async () => {
      if (!this.answers.has(question.id)) {
        this.showInlineError('Answer the question before continuing.');
        return;
      }
      if (this.currentIndex === this.questions.length - 1) {
        await this.submitQuiz();
      } else {
        this.currentIndex += 1;
        this.renderQuestion();
      }
    });

    this.container.querySelector('#quiz-exit')?.addEventListener('click', () => {
      if (this.options.onExit) this.options.onExit();
    });

    // "Read more" links open the Learn section of the app.
    this.container.querySelectorAll('[data-learn-link]').forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        if (window.app && window.app.navigation) window.app.navigation.navigateTo('learn');
      });
    });
  }

  /** Build the feedback block shown underneath an answered question. */
  buildFeedback(question, answer) {
    const correctText = question.options
      .filter(option => answer.correct.includes(option.id))
      .map(option => option.text)
      .join(' | ');

    const yourText = question.options
      .filter(option => answer.selected.includes(option.id))
      .map(option => option.text)
      .join(' | ') || 'No answer selected';

    return `
      <p class="quiz-feedback-title">
        <i class="fas ${answer.isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
        ${answer.isCorrect ? 'Correct!' : 'Not quite'}
        <span class="quiz-feedback-points">+${answer.pointsAwarded} / ${answer.pointsPossible} pts</span>
      </p>
      ${answer.isCorrect ? '' : `<p class="quiz-feedback-text"><strong>Correct answer:</strong> ${escapeHtml(correctText)}</p>`}
      ${answer.isCorrect ? `<p class="quiz-feedback-text"><strong>Your answer:</strong> ${escapeHtml(yourText)}</p>` : ''}
      ${answer.explanation ? `<p class="quiz-explanation-text">${escapeHtml(answer.explanation)}</p>` : ''}
      ${answer.reference ? `<p class="quiz-feedback-reference"><i class="fas fa-book"></i> <a href="#" data-learn-link>${escapeHtml(answer.reference)}</a></p>` : ''}`;
  }

  liveScore() {
    let points = 0;
    this.answers.forEach(answer => { points += answer.pointsAwarded || 0; });
    return points;
  }

  renderResults() {
    const result = this.result;
    if (!result) return;

    const percentage = result.accuracy;
    const grade = gradeFor(percentage);
    const correct = result.correctCount;
    const total = result.totalQuestions;

    const reviewHtml = this.questions.map((question, index) => {
      const answer = this.answers.get(question.id);
      const isCorrect = answer && answer.isCorrect;
      const yourAnswer = answer && answer.selected.length
        ? answer.selected.map(id => (question.options.find(o => o.id === id) || {}).text).join(' | ')
        : 'No answer';

      const correctAnswer = question.options
        .filter(o => answer && answer.correct.includes(o.id))
        .map(o => o.text).join(' | ');

      return `
        <div class="quiz-review-item ${isCorrect ? 'quiz-review-correct' : 'quiz-review-wrong'}">
          <div class="quiz-review-header">
            <span>${isCorrect ? '✅' : '❌'} Q${index + 1}: ${escapeHtml(question.prompt).replace(/\n/g, ' ')}</span>
            ${question.label ? `<span class="quiz-review-badge">${escapeHtml(question.label)}</span>` : `<span class="quiz-review-badge">${escapeHtml(question.topic)}</span>`}
          </div>
          <div class="quiz-review-detail">
            <p><strong>Your answer:</strong> ${escapeHtml(yourAnswer)}</p>
            ${!isCorrect ? `<p><strong>Correct answer:</strong> ${escapeHtml(correctAnswer)}</p>` : ''}
            <p><strong>Points:</strong> ${answer ? answer.pointsAwarded : 0} / ${question.points}</p>
          </div>
          ${answer && answer.explanation ? `<p class="quiz-review-explanation">${escapeHtml(answer.explanation)}</p>` : ''}
          ${question.sourceUrl ? `<p class="quiz-review-source"><a href="${escapeHtml(question.sourceUrl)}" target="_blank" rel="noopener noreferrer">View the source of this question <i class="fas fa-external-link-alt"></i></a></p>` : ''}
        </div>`;
    }).join('');

    this.container.innerHTML = `
      <div class="quiz-runner">
        <div class="quiz-results-hero">
          <div class="quiz-results-emoji">${grade.emoji}</div>
          <h2>${result.title || 'Quiz'} complete</h2>
          <div class="quiz-results-grade">Grade: ${grade.grade}</div>
          <p class="quiz-results-message">${grade.message}</p>
        </div>

        <div class="quiz-results-stats">
          <div class="quiz-stat-card"><div class="quiz-stat-value">${correct}/${total}</div><div class="quiz-stat-label">Correct</div></div>
          <div class="quiz-stat-card"><div class="quiz-stat-value">${percentage}%</div><div class="quiz-stat-label">Accuracy</div></div>
          <div class="quiz-stat-card"><div class="quiz-stat-value">${result.pointsEarned}/${result.pointsPossible}</div><div class="quiz-stat-label">Points</div></div>
          <div class="quiz-stat-card"><div class="quiz-stat-value">${grade.grade}</div><div class="quiz-stat-label">Grade</div></div>
        </div>

        <div class="quiz-review-section">
          <h3><i class="fas fa-list-check"></i> Review of your answers</h3>
          ${reviewHtml}
        </div>

        <div class="quiz-results-actions">
          <button type="button" id="quiz-retry" class="btn btn-primary"><i class="fas fa-redo"></i> Retry Quiz</button>
          <button type="button" id="quiz-back" class="btn btn-outline"><i class="fas fa-home"></i> Back to Selection</button>
        </div>
      </div>`;

    this.container.querySelector('#quiz-retry')?.addEventListener('click', () => {
      if (this.options.onRetry) this.options.onRetry();
    });
    this.container.querySelector('#quiz-back')?.addEventListener('click', () => {
      if (this.options.onExit) this.options.onExit();
    });
  }

  /* ───────────────────────── Small helpers ───────────────────────── */

  _setBusy(busy, message) {
    if (busy) {
      this.container.innerHTML = `<div class="quiz-loading"><i class="fas fa-spinner fa-spin"></i><p>${escapeHtml(message || 'Loading…')}</p></div>`;
    }
  }

  showInlineError(message) {
    const box = this.container.querySelector('#quiz-inline-error');
    if (box) {
      box.textContent = message;
      box.style.display = 'block';
    }
  }

  renderError(message, code) {
    this.container.innerHTML = `
      <div class="quiz-error-state">
        <i class="fas fa-triangle-exclamation"></i>
        <h3>${escapeHtml(message)}</h3>
        ${code === 'NO_QUESTIONS' ? '<p>Try a different combination of filters — for example another year or question type.</p>' : ''}
        <button type="button" id="quiz-error-back" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Back</button>
      </div>`;
    this.container.querySelector('#quiz-error-back')?.addEventListener('click', () => {
      if (this.options.onExit) this.options.onExit();
    });
  }
}

/* ══════════════════════════════════════════════════════════════════
 * Difficulty quiz section
 * ══════════════════════════════════════════════════════════════════ */
class QuizSection {
  constructor() {
    this.container = document.getElementById('quiz-content');
    this.runner = null;
    this.quizzes = [];
    this.selected = 'easy';
  }

  async init() {
    if (!this.container) return;
    this.renderSelection();
    await this.loadQuizzes();
  }

  async loadQuizzes() {
    try {
      const response = await fetch('/api/quizzes');
      const data = await response.json();
      this.quizzes = data.quizzes || [];
      this.maxQuestions = data.maxQuestionCount || 20;
      this.renderSelection();
    } catch (error) {
      this.container.innerHTML = '<div class="quiz-error-state"><i class="fas fa-plug-circle-xmark"></i><h3>The quiz catalogue could not be loaded.</h3><p>Is the server running? Start it with <code>npm start</code> and reload the page.</p></div>';
    }
  }

  renderSelection() {
    if (!this.container) return;

    const cards = this.quizzes.map(quiz => `
      <button type="button" class="quiz-level-card ${this.selected === quiz.id ? 'is-selected' : ''}"
              data-quiz-id="${escapeHtml(quiz.id)}" style="--level-color:${escapeHtml(quiz.color)}">
        <span class="quiz-level-icon"><i class="fas ${escapeHtml(quiz.icon)}"></i></span>
        <span class="quiz-level-name">${escapeHtml(quiz.difficulty.toUpperCase())}</span>
        <span class="quiz-level-title">${escapeHtml(quiz.title.replace(/^\w+ — /, ''))}</span>
        <span class="quiz-level-desc">${escapeHtml(quiz.description)}</span>
        <span class="quiz-level-topics">${(quiz.topics || []).map(t => `<span class="quiz-topic-chip">${escapeHtml(t)}</span>`).join('')}</span>
        <span class="quiz-level-meta">
          <span><i class="fas fa-list-ol"></i> ${quiz.questionCount} questions</span>
          <span><i class="fas fa-star"></i> ${quiz.pointsPerQuestion} pts each</span>
        </span>
      </button>`).join('');

    this.container.innerHTML = `
      <div class="quiz-section">
        <div class="quiz-intro">
          <p>Choose a difficulty level. The level describes <strong>how hard the question itself is</strong> — not which chapter it comes from — so every level mixes topics such as locks, 2PL, deadlocks and serializability.</p>
          <p class="quiz-intro-sub">Questions are picked at random for every attempt, the option order is shuffled, and the answer key stays on the server — the score you see is always the score the server calculated.</p>
        </div>

        <div class="quiz-level-grid" id="quiz-level-grid">${cards || '<div class="quiz-loading"><i class="fas fa-spinner fa-spin"></i><p>Loading quizzes…</p></div>'}</div>

        <div class="quiz-start-bar">
          <div class="quiz-config-item">
            <label for="quiz-count">Number of questions</label>
            <select id="quiz-count" class="quiz-select">
              <option value="5">5 questions</option>
              <option value="10" selected>10 questions</option>
              <option value="15">15 questions</option>
              <option value="20">20 questions</option>
              <option value="25">25 questions</option>
              <option value="30">30 questions</option>
            </select>
          </div>
          <div class="quiz-rules">
            <h4><i class="fas fa-calculator"></i> Scoring rules</h4>
            <ul>
              <li>Every question is worth its point value (Easy 10, Medium 15, Hard 20).</li>
              <li>1 point is awarded for every 1 point of value — there is no negative marking.</li>
              <li>Multiple-answer questions are only correct when every correct option is selected and no incorrect one.</li>
              <li>Scores are calculated on the server and can never be edited by the browser.</li>
            </ul>
          </div>
          <button type="button" id="quiz-start" class="btn btn-primary quiz-start-btn" disabled>
            <i class="fas fa-play"></i> Start Quiz
          </button>
        </div>

        <div id="quiz-runner-host"></div>
      </div>`;

    this.container.querySelectorAll('.quiz-level-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selected = card.getAttribute('data-quiz-id');
        this.container.querySelectorAll('.quiz-level-card').forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        const start = this.container.querySelector('#quiz-start');
        if (start) start.disabled = false;
      });
    });

    this.container.querySelector('#quiz-start')?.addEventListener('click', () => this.startQuiz());

    // Preselect the first level so the button is immediately usable.
    const levelCards = this.container.querySelectorAll('.quiz-level-card');
    if (levelCards.length) {
      const selectedCard = this.container.querySelector('.quiz-level-card.is-selected') || levelCards[0];
      selectedCard.click();
      const start = this.container.querySelector('#quiz-start');
      if (start) start.disabled = false;
    }
  }

  async startQuiz() {
    const count = parseInt(this.container.querySelector('#quiz-count')?.value || '10', 10);
    const host = this.container.querySelector('#quiz-runner-host');
    if (!host) return;

    host.scrollIntoView({ behavior: 'smooth', block: 'start' });

    this.runner = new QuizRunner(host, {
      onExit: () => this.renderSelection(),
      onRetry: () => this.startQuiz()
    });

    await this.runner.start({ quizId: this.selected, count });
  }
}

/* ══════════════════════════════════════════════════════════════════
 * Helpers
 * ══════════════════════════════════════════════════════════════════ */


function gradeFor(percentage) {
  if (percentage >= 90) return { grade: 'A+', emoji: '🏆', message: 'Outstanding — you have mastered locking protocols!' };
  if (percentage >= 80) return { grade: 'A', emoji: '🌟', message: 'Excellent work! You know your stuff.' };
  if (percentage >= 70) return { grade: 'B', emoji: '👏', message: 'Good job! Keep practising to sharpen the details.' };
  if (percentage >= 60) return { grade: 'C', emoji: '📚', message: 'Not bad — revisit the Learn section for the weaker topics.' };
  if (percentage >= 40) return { grade: 'D', emoji: '💪', message: 'Keep studying, then run a few simulations to see the locks in action.' };
  return { grade: 'F', emoji: '📖', message: 'Time to hit the books — start with the Learn section and the simulator.' };
}

window.QuizRunner = QuizRunner;
window.QuizSection = QuizSection;
