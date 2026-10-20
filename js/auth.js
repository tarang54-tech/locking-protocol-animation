/**
 * auth.js — Client-side authentication.
 *
 * Signing in is compulsory: until a user is authenticated the whole application
 * is hidden behind the sign-in gate. The session itself lives in an HTTP-only
 * cookie managed by the server, so no token is ever exposed to JavaScript.
 */

class AuthManager {
  constructor() {
    this.user = null;
    this.modal = null;
    this.onChange = null;
    this.gate = document.getElementById('app-gate');
    this.shell = document.getElementById('app-shell');
    this.gateForm = document.getElementById('auth-gate-form');
  }

  /* ───────────────────────── Lifecycle ───────────────────────── */

  async init() {
    this.buildModal();
    this.renderGate();
    this.bindShell();
    await this.refresh();
  }

  /** The application shell is only reachable once a user is signed in. */
  bindShell() {
    this.onChange = (user) => {
      this.applyAccessState();
      this.renderNav();
      if (user && window.app && typeof window.app.onUserSignedIn === 'function') {
        window.app.onUserSignedIn(user);
      }
    };
  }

  /** Show the gate or the application depending on the session state. */
  applyAccessState() {
    const signedIn = !!this.user;
    if (this.gate) this.gate.style.display = signedIn ? 'none' : 'flex';
    if (this.shell) this.shell.style.display = signedIn ? '' : 'none';
    document.body.classList.toggle('is-gated', !signedIn);
  }

  /* ───────────────────────── API ───────────────────────── */

  async login(identifier, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Could not sign you in.');
    }
    this.user = data.user;
    this.renderNav();
    if (this.onChange) this.onChange(this.user);
    return this.user;
  }

  async register(username, email, password, displayName) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, displayName })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'Could not create the account.');
      error.fields = data.fields || {};
      throw error;
    }
    this.user = data.user;
    this.renderNav();
    if (this.onChange) this.onChange(this.user);
    return this.user;
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) { /* ignore network errors on logout */ }
    this.user = null;
    this.renderNav();
    this.applyAccessState();
    this.renderGate();
    if (this.onChange) this.onChange(null);
  }

  async refresh() {
    try {
      const response = await fetch('/api/auth/me');
      this.user = response.ok ? (await response.json()).user : null;
    } catch (error) {
      this.user = null;
    }
    this.renderNav();
    this.applyAccessState();
    if (this.onChange) this.onChange(this.user);
    return this.user;
  }

  /* ───────────────────────── Navigation UI ───────────────────────── */

  renderNav() {
    const button = document.getElementById('auth-nav-button');
    if (!button) return;

    if (this.user) {
      const initial = (this.user.displayName || this.user.username || '?').charAt(0).toUpperCase();
      button.innerHTML = `
        <span class="auth-avatar" aria-hidden="true">${escapeHtml(initial)}</span>
        <span class="auth-user-name">${escapeHtml(this.user.displayName || this.user.username)}</span>
        <i class="fas fa-chevron-down auth-caret"></i>`;
      button.setAttribute('aria-haspopup', 'true');
      button.setAttribute('aria-expanded', 'false');
      button.classList.add('is-signed-in');
      button.setAttribute('aria-label', 'Your account');
    } else {
      button.innerHTML = '<i class="fas fa-right-to-bracket"></i> Sign in';
      button.classList.remove('is-signed-in');
    }
  }

  /* ───────────────────────── Sign-in gate ───────────────────────── */

  /** Render the sign-in / create-account form inside the gate. */
  renderGate() {
    if (!this.gateForm) return;
    this.gateForm.innerHTML = this.formMarkup('gate');
    this.bindForm(this.gateForm, 'gate');
  }

  /**
   * The markup of the sign-in form. It is used both by the gate and by the
   * account modal, so the two never drift apart.
   */
  formMarkup(surface) {
    const isGate = surface === 'gate';
    return `
      <div class="auth-tabs" role="tablist">
        <button type="button" class="auth-tab is-active" data-auth-tab="login" role="tab" aria-selected="true">Sign in</button>
        <button type="button" class="auth-tab" data-auth-tab="register" role="tab" aria-selected="false">Create account</button>
      </div>

      <form class="auth-form" novalidate data-surface="${surface}">
        <div class="auth-message" style="display:none" data-role="message"></div>

        <div class="auth-field" data-role="displayname" style="display:none">
          <label for="auth-displayname-${surface}">Display name <span class="hint">(optional)</span></label>
          <input type="text" id="auth-displayname-${surface}" autocomplete="nickname" maxlength="40" placeholder="How should we call you?">
        </div>

        <div class="auth-field">
          <label for="auth-identifier-${surface}">Username</label>
          <input type="text" id="auth-identifier-${surface}" autocomplete="username" required placeholder="e.g. tarang">
        </div>

        <div class="auth-field" data-role="email" style="display:none">
          <label for="auth-email-${surface}">E-mail <span class="hint">(for a new account)</span></label>
          <input type="text" id="auth-email-${surface}" autocomplete="email" placeholder="you@example.com">
        </div>

        <div class="auth-field">
          <label for="auth-password-${surface}">Password</label>
          <input type="password" id="auth-password-${surface}" autocomplete="current-password" required placeholder="••••••••">
          <p class="auth-hint" data-role="password-hint" style="display:none">At least 8 characters, including a letter and a number.</p>
        </div>

        <button type="submit" class="btn btn-primary btn-full" data-role="submit">Sign in</button>

        ${isGate ? '<p class="auth-note">Your account stores your simulation history, your quiz scores and your leaderboard position. No e-mail is ever sent to you.</p>' : ''}
      </form>`;
  }

  /** Attach the behaviour to a rendered form. */
  bindForm(container, surface) {
    const form = container.querySelector('.auth-form');
    if (!form) return;

    container.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(container, tab.getAttribute('data-auth-tab')));
    });

    form.addEventListener('submit', (event) => this.handleSubmit(event, container));
  }

  switchTab(container, tab) {
    container.querySelectorAll('.auth-tab').forEach(button => {
      const isActive = button.getAttribute('data-auth-tab') === tab;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    const isRegister = tab === 'register';
    const q = role => container.querySelector(`[data-role="${role}"]`);
    if (q('displayname')) q('displayname').style.display = isRegister ? 'block' : 'none';
    if (q('email')) q('email').style.display = isRegister ? 'block' : 'none';
    if (q('password-hint')) q('password-hint').style.display = isRegister ? 'block' : 'none';
    if (q('submit')) q('submit').textContent = isRegister ? 'Create account' : 'Sign in';

    const password = container.querySelector('input[type="password"]');
    if (password) password.setAttribute('autocomplete', isRegister ? 'new-password' : 'current-password');

    const message = q('message');
    if (message) message.style.display = 'none';
  }

  /* ───────────────────────── Account modal ───────────────────────── */

  buildModal() {
    if (document.getElementById('auth-modal')) {
      this.modal = document.getElementById('auth-modal');
      this.wireModal();
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'auth-modal-title');
    modal.innerHTML = `
      <div class="modal-content auth-modal-content">
        <div class="modal-header auth-modal-header">
          <h3 id="auth-modal-title"><i class="fas fa-user-circle"></i> Your account</h3>
          <button class="modal-close" id="auth-modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="auth-signed-in" id="auth-signed-in" style="display:none">
            <div class="auth-profile">
              <span class="auth-avatar auth-avatar-large" id="auth-profile-initial">?</span>
              <div>
                <h4 id="auth-profile-name">—</h4>
                <p id="auth-profile-email" class="auth-muted">—</p>
              </div>
            </div>
            <div class="auth-profile-actions">
              <button type="button" class="btn btn-outline" id="auth-go-history"><i class="fas fa-clock-rotate-left"></i> My quiz history</button>
              <button type="button" class="btn btn-danger" id="auth-logout"><i class="fas fa-right-from-bracket"></i> Sign out</button>
            </div>
          </div>
        </div>
      </div>`;

    document.body.appendChild(modal);
    this.modal = modal;
    this.wireModal();
  }

  wireModal() {
    const modal = this.modal;
    if (!modal) return;

    modal.querySelector('#auth-modal-close')?.addEventListener('click', () => this.closeModal());
    modal.addEventListener('click', (event) => {
      if (event.target === modal) this.closeModal();
    });
    modal.querySelector('#auth-logout')?.addEventListener('click', async () => {
      await this.logout();
      this.closeModal();
    });
    modal.querySelector('#auth-go-history')?.addEventListener('click', () => {
      this.closeModal();
      if (window.app && window.app.navigation) window.app.navigation.navigateTo('history');
    });
  }

  openModal() {
    if (!this.modal) this.buildModal();
    this.modal.style.display = 'flex';

    const signedIn = !!this.user;
    const panel = this.modal.querySelector('#auth-signed-in');
    if (panel) panel.style.display = signedIn ? 'block' : 'none';

    if (signedIn) {
      this.modal.querySelector('#auth-profile-initial').textContent =
        (this.user.displayName || this.user.username || '?').charAt(0).toUpperCase();
      this.modal.querySelector('#auth-profile-name').textContent = this.user.displayName || this.user.username;
      this.modal.querySelector('#auth-profile-email').textContent = this.user.email;
    }
  }

  closeModal() {
    if (this.modal) this.modal.style.display = 'none';
  }

  /* ───────────────────────── Form handling ───────────────────────── */

  /** Turn a server error into a readable message (field errors are shown first). */
  formatError(error) {
    if (error && error.fields) {
      const messages = Object.keys(error.fields).map(key => error.fields[key]);
      if (messages.length) return messages.join(' ');
    }
    return (error && error.message) || 'Something went wrong. Please try again.';
  }

  showMessage(container, text, type = 'error') {
    const box = container.querySelector('[data-role="message"]');
    if (!box) return;
    box.textContent = text;
    box.className = `auth-message auth-message-${type}`;
    box.style.display = 'block';
  }

  async handleSubmit(event, container) {
    event.preventDefault();
    const form = event.currentTarget;
    const surface = form.getAttribute('data-surface');
    const isRegister = container.querySelector('.auth-tab.is-active')?.getAttribute('data-auth-tab') === 'register';

    const identifier = container.querySelector(`#auth-identifier-${surface}`).value.trim();
    const email = container.querySelector(`#auth-email-${surface}`)?.value.trim() || '';
    const password = container.querySelector(`#auth-password-${surface}`).value;
    const displayName = container.querySelector(`#auth-displayname-${surface}`)?.value.trim() || '';

    const submit = container.querySelector('[data-role="submit"]');
    submit.disabled = true;
    const originalLabel = submit.innerHTML;
    submit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait…';

    try {
      if (isRegister) {
        await this.register(identifier, email, password, displayName);
        this.showMessage(container, 'Account created — welcome to the virtual lab!', 'success');
      } else {
        await this.login(identifier, password);
        this.showMessage(container, 'Signed in successfully.', 'success');
      }
    } catch (error) {
      this.showMessage(container, this.formatError(error));
    } finally {
      submit.disabled = false;
      submit.innerHTML = originalLabel;
    }
  }
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.AuthManager = AuthManager;
