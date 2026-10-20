/**
 * exam.js — Competitive Exams section.
 *
 * Every question in this section carries provenance metadata:
 *   • "previous_year"  — a genuine previous-year question whose year, paper
 *                         and answer key could be verified against a public
 *                         source (the source link is shown on the card).
 *   • "practice"       — an exam-style practice question written for this
 *                         platform. It is always labelled as such and never
 *                         presented as an authentic paper question.
 */

class ExamSection {
  constructor() {
    this.container = document.getElementById('exams-content');
    this.exams = [];
    this.filters = { examId: '', year: '', topic: '', questionType: '', count: 10 };
    this.filteredQuestions = [];
    this.runner = null;
  }

  async init() {
    if (!this.container) return;
    this.renderShell();
    await this.loadExams();
  }

  renderShell() {
    this.container.innerHTML = `
      <div class="exam-section">
        <div class="exam-intro">
          <p>
            Practise DBMS locking and concurrency-control questions from competitive
            examinations. Questions whose year and answer key could be verified are
            labelled <strong>GATE CSE — 2024</strong> style and link to their source;
            everything else is clearly marked <strong>Exam-Style Practice Question</strong>.
          </p>
        </div>

        <div class="exam-filters" id="exam-filters">
          <div class="exam-filter">
            <label for="exam-select">Examination</label>
            <select id="exam-select" class="quiz-select"><option value="">All examinations</option></select>
          </div>
          <div class="exam-filter">
            <label for="exam-year">Year</label>
            <select id="exam-year" class="quiz-select"><option value="">All years</option></select>
          </div>
          <div class="exam-filter">
            <label for="exam-topic">Topic</label>
            <select id="exam-topic" class="quiz-select"><option value="">All topics</option></select>
          </div>
          <div class="exam-filter">
            <label for="exam-type">Question type</label>
            <select id="exam-type" class="quiz-select">
              <option value="">All questions</option>
              <option value="previous_year">Verified previous-year questions</option>
              <option value="practice">Exam-Style Practice Questions</option>
            </select>
          </div>
          <div class="exam-filter">
            <label for="exam-count">Questions</label>
            <select id="exam-count" class="quiz-select">
              <option value="5">5</option>
              <option value="10" selected>10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </div>
          <button type="button" id="exam-start" class="btn btn-primary exam-start-btn">
            <i class="fas fa-play"></i> Start Exam Practice
          </button>
        </div>

        <div class="exam-meta-row" id="exam-meta-row"></div>
        <div class="exam-question-list" id="exam-question-list"></div>
        <div id="exam-runner-host"></div>
      </div>`;
  }

  async loadExams() {
    try {
      const response = await fetch('/api/exams');
      const data = await response.json();
      this.exams = data.exams || [];

      const select = this.container.querySelector('#exam-select');
      if (select) {
        select.innerHTML = '<option value="">All examinations</option>' + this.exams
          .map(exam => `<option value="${escapeHtml(exam.id)}">${escapeHtml(exam.name)}</option>`)
          .join('');
      }

      this.updateYearFilter();
      this.updateTopicFilter();
      await this.loadQuestionList();
    } catch (error) {
      this.container.querySelector('#exam-question-list').innerHTML =
        '<div class="quiz-error-state"><i class="fas fa-plug-circle-xmark"></i><h3>The examination data could not be loaded.</h3></div>';
    }
  }

  currentExam() {
    return this.exams.find(exam => exam.id === this.filters.examId) || null;
  }

  updateYearFilter() {
    const select = this.container.querySelector('#exam-year');
    if (!select) return;
    const exam = this.currentExam();
    const years = exam ? exam.years : [...new Set(this.exams.flatMap(e => e.years))];
    select.innerHTML = '<option value="">All years</option>' +
      years.map(y => `<option value="${y}" ${String(this.filters.year) === String(y) ? 'selected' : ''}>${y}</option>`).join('');
  }

  updateTopicFilter() {
    const select = this.container.querySelector('#exam-topic');
    if (!select) return;
    const exam = this.currentExam();
    const topics = exam ? exam.topics : [...new Set(this.exams.flatMap(e => e.topics))];
    select.innerHTML = '<option value="">All topics</option>' +
      topics.map(t => `<option value="${escapeHtml(t)}" ${this.filters.topic === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');
  }

  /**
   * Render the summary card. The numbers always describe the questions that
   * match the CURRENT filters (examination + year + topic + question type),
   * not the totals of the whole examination.
   */
  renderExamMeta() {
    const row = this.container.querySelector('#exam-meta-row');
    if (!row) return;

    const questions = this.filteredQuestions || [];
    const exam = this.currentExam();

    const total = questions.length;
    const previousYear = questions.filter(q => q.questionType === 'previous_year').length;
    const practice = questions.filter(q => q.questionType === 'practice').length;
    const years = [...new Set(questions.map(q => q.year).filter(y => y != null))].sort((a, b) => b - a);
    const isFiltered = !!(this.filters.year || this.filters.topic || this.filters.questionType);
    const questionWord = total === 1 ? 'question' : 'questions';

    if (exam) {
      row.innerHTML = `
        <div class="exam-meta-card">
          <h3>${escapeHtml(exam.name)} <span class="exam-official-link"><a href="${escapeHtml(exam.officialUrl)}" target="_blank" rel="noopener noreferrer">Official site <i class="fas fa-external-link-alt"></i></a></span></h3>
          <p class="exam-full-name">${escapeHtml(exam.fullName)}</p>
          <div class="exam-meta-stats">
            <span class="exam-stat"><strong>${total}</strong> ${questionWord}</span>
            <span class="exam-stat is-verified"><strong>${previousYear}</strong> verified previous-year</span>
            <span class="exam-stat is-practice"><strong>${practice}</strong> practice</span>
            <span class="exam-stat"><strong>${years.length}</strong> year(s) covered</span>
          </div>
          ${isFiltered
            ? `<p class="exam-note">Showing <strong>${total}</strong> of the ${exam.questionCount} ${escapeHtml(exam.name)} questions that match the current filters.</p>`
            : ''}
          <p class="exam-note">${escapeHtml(exam.notes)}</p>
        </div>`;
    } else {
      const perExam = this.exams.map(e => {
        const count = questions.filter(q => q.examId === e.id).length;
        return `<span class="exam-stat${count ? '' : ' is-empty'}"><strong>${count}</strong> ${escapeHtml(e.name)}</span>`;
      }).join('');

      row.innerHTML = `
        <div class="exam-meta-card">
          <h3>All examinations</h3>
          <div class="exam-meta-stats">
            <span class="exam-stat"><strong>${total}</strong> ${questionWord}</span>
            <span class="exam-stat is-verified"><strong>${previousYear}</strong> verified previous-year</span>
            <span class="exam-stat is-practice"><strong>${practice}</strong> practice</span>
            ${perExam}
          </div>
          <p class="exam-note">${isFiltered
            ? `Showing <strong>${total}</strong> questions that match the current filters.`
            : 'Pick an examination above to narrow the list by year, topic and question type.'}</p>
        </div>`;
    }
  }

  /** Only offer a question count that the current filters can actually supply. */
  updateCountOptions(available) {
    const select = this.container.querySelector('#exam-count');
    if (!select) return;

    const previous = parseInt(select.value, 10) || 10;
    const options = [];

    if (available === 0) {
      options.push({ value: 0, label: 'No questions available', disabled: true });
    } else if (available < 5) {
      options.push({ value: available, label: available === 1 ? '1 question' : `${available} questions`, disabled: false });
      [5, 10, 15, 20].forEach(value => options.push({ value, label: `${value} questions`, disabled: true }));
    } else {
      [5, 10, 15, 20].forEach(value => {
        options.push({ value, label: `${value} questions`, disabled: value > available });
      });
    }

    select.innerHTML = options
      .map(option => `<option value="${option.value}"${option.disabled ? ' disabled' : ''}>${option.label}</option>`)
      .join('');

    // Keep the previous choice when it is still possible, otherwise use the
    // largest number the current filters can supply.
    const usable = options.filter(option => !option.disabled).map(option => option.value);
    const chosen = usable.includes(previous) ? previous : (usable.length ? Math.max(...usable) : 0);
    select.value = String(chosen);
    this.filters.count = chosen;
  }

  async loadQuestionList() {
    const list = this.container.querySelector('#exam-question-list');
    if (!list) return;
    list.innerHTML = '<div class="quiz-loading"><i class="fas fa-spinner fa-spin"></i><p>Loading questions…</p></div>';

    const params = new URLSearchParams();
    if (this.filters.examId) params.set('exam', this.filters.examId);
    if (this.filters.year) params.set('year', this.filters.year);
    if (this.filters.topic) params.set('topic', this.filters.topic);
    if (this.filters.questionType) params.set('type', this.filters.questionType);

    try {
      const response = await fetch(`/api/exam-questions?${params.toString()}`);
      const data = await response.json();
      const questions = data.questions || [];

      // Keep the summary card and the question-count selector in step with
      // the questions that the current filters actually return.
      this.filteredQuestions = questions;
      this.renderExamMeta();
      this.updateCountOptions(questions.length);

      const startBtn = this.container.querySelector('#exam-start');
      if (startBtn) startBtn.disabled = questions.length === 0;

      if (!questions.length) {
        list.innerHTML = '<div class="quiz-empty-state"><i class="fas fa-filter-circle-xmark"></i><p>No questions match these filters. Try another year, topic or question type.</p></div>';
        return;
      }

      list.innerHTML = `
        <h3 class="exam-list-title">Available questions <span class="badge">${questions.length}</span></h3>
        ${questions.map(q => `
          <div class="exam-question-row ${q.questionType === 'previous_year' ? 'is-previous-year' : 'is-practice'}">
            <span class="exam-row-type">${q.questionType === 'previous_year'
              ? '<i class="fas fa-certificate"></i> Previous Year'
              : '<i class="fas fa-pen-to-square"></i> Practice'}</span>
            <span class="exam-row-label">${escapeHtml(q.label)}</span>
            <span class="exam-row-topic">${escapeHtml(q.topic)} · ${escapeHtml(q.subtopic)}</span>
            <span class="exam-row-diff quiz-badge quiz-badge-${escapeHtml(q.difficulty)}">${escapeHtml(q.difficulty)}</span>
            <span class="exam-row-points">${q.points} pts</span>
            ${q.sourceUrl ? `<a class="exam-row-source" href="${escapeHtml(q.sourceUrl)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> Source</a>` : ''}
          </div>`).join('')}`;
    } catch (error) {
      this.filteredQuestions = [];
      list.innerHTML = '<div class="quiz-error-state"><i class="fas fa-plug-circle-xmark"></i><h3>The question list could not be loaded.</h3></div>';
    }
  }

  async startExam() {
    const host = this.container.querySelector('#exam-runner-host');
    if (!host) return;

    const config = {
      examId: this.filters.examId || (this.exams[0] && this.exams[0].id),
      count: parseInt(this.filters.count, 10)
    };
    if (!config.examId) {
      this.container.querySelector('#exam-question-list').innerHTML =
        '<div class="quiz-error-state"><i class="fas fa-triangle-exclamation"></i><h3>No examinations are available.</h3></div>';
      return;
    }
    if (this.filters.year) config.year = this.filters.year;
    if (this.filters.topic) config.topic = this.filters.topic;
    if (this.filters.questionType) config.questionType = this.filters.questionType;

    host.scrollIntoView({ behavior: 'smooth', block: 'start' });

    this.runner = new QuizRunner(host, {
      onExit: () => { host.innerHTML = ''; },
      onRetry: () => this.startExam()
    });

    await this.runner.start(config);
  }

  bindEvents() {
    const container = this.container;
    if (!container) return;

    container.querySelector('#exam-select')?.addEventListener('change', (event) => {
      this.filters.examId = event.target.value;
      this.filters.year = '';
      this.filters.topic = '';
      this.updateYearFilter();
      this.updateTopicFilter();
      this.renderExamMeta();
      this.loadQuestionList();
    });

    container.querySelector('#exam-year')?.addEventListener('change', (event) => {
      this.filters.year = event.target.value;
      this.loadQuestionList();
    });

    container.querySelector('#exam-topic')?.addEventListener('change', (event) => {
      this.filters.topic = event.target.value;
      this.loadQuestionList();
    });

    container.querySelector('#exam-type')?.addEventListener('change', (event) => {
      this.filters.questionType = event.target.value;
      this.loadQuestionList();
    });

    container.querySelector('#exam-count')?.addEventListener('change', (event) => {
      this.filters.count = parseInt(event.target.value, 10);
    });

    container.querySelector('#exam-start')?.addEventListener('click', () => this.startExam());
  }
}

window.ExamSection = ExamSection;
