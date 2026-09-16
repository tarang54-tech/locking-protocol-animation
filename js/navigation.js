class Navigation {
  constructor() {
    this.currentSection = 'simulator';
    this.sections = ['simulator', 'learn', 'help', 'download', 'analytics', 'developed-by'];
  }

  init() {
    // Set up nav link click handlers
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        this.navigateTo(section);
      });
    });

    // Hamburger menu toggle
    document.getElementById('nav-hamburger')?.addEventListener('click', () => {
      document.getElementById('nav-links')?.classList.toggle('nav-open');
    });

    // Close mobile menu when a link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        document.getElementById('nav-links')?.classList.remove('nav-open');
      });
    });

    // Initialize Learn and Help sections
    this.initContent();
  }

  navigateTo(sectionId) {
    // Hide all sections
    this.sections.forEach(id => {
      const el = document.getElementById(`section-${id}`);
      if (el) {
        el.classList.remove('active-section');
        el.style.display = 'none';
      }
    });

    // Show target section
    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
      target.classList.add('active-section');
      target.style.display = 'block';
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-section') === sectionId) {
        link.classList.add('active');
      }
    });

    this.currentSection = sectionId;
    window.scrollTo(0, 0);

    // Auto-refresh analytics when visiting that section
    if (sectionId === 'analytics' && this.analytics) {
      this.analytics.refresh();
    }
  }

  initContent() {
    // Render Learn section
    if (window.LearnSection) {
      const learn = new window.LearnSection();
      const learnContainer = document.getElementById('learn-content');
      if (learnContainer) learnContainer.innerHTML = learn.render();
    }

    // Render Help section
    if (window.HelpSection) {
      const help = new window.HelpSection();
      const helpContainer = document.getElementById('help-content');
      if (helpContainer) helpContainer.innerHTML = help.render();
    }

    // Render Analytics section
    if (window.AnalyticsDashboard) {
      this.analytics = new window.AnalyticsDashboard();
      const analyticsContainer = document.getElementById('analytics-content');
      if (analyticsContainer) analyticsContainer.innerHTML = this.analytics.render();
    }

    // Hide non-active sections initially
    this.sections.forEach(id => {
      if (id !== 'simulator') {
        const el = document.getElementById(`section-${id}`);
        if (el) el.style.display = 'none';
      }
    });
  }
}

window.Navigation = Navigation;
