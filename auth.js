// Shared auth actions for login & signup pages
document.addEventListener('DOMContentLoaded', () => {
  setupPasswordToggle();
  if (document.getElementById('loginForm')) {
    setupLogin();
  }
  if (document.getElementById('signupForm')) {
    setupSignup();
  }
});

function setupPasswordToggle() {
  document.querySelectorAll('.password-toggle').forEach((btn) => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;
    // ensure input has correct padding (css) and button does not submit
    btn.addEventListener('click', () => {
      const isPwd = input.type === 'password';
      input.type = isPwd ? 'text' : 'password';
      // toggle icon to indicate state
      btn.textContent = isPwd ? '🙈' : '👁️';
      btn.setAttribute('aria-pressed', String(isPwd));
    });
  });
}

function saveSession(token, user) {
  localStorage.setItem('taskflow_token', token);
  localStorage.setItem('taskflow_user', JSON.stringify(user));
}

function redirectToDashboard() {
  window.location.href = 'dashboard.html';
}

function setupLogin() {
  const form = document.getElementById('loginForm');
  const err = document.getElementById('loginError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const result = await apiLogin(email, password);
      if (result.error) { err.textContent = result.error; return; }
      if (result.token) {
        saveSession(result.token, result.user);
        redirectToDashboard();
      } else {
        err.textContent = 'Unexpected response from server';
      }
    } catch (errr) {
      console.error('Login error:', errr);
      err.textContent = errr && errr.message ? errr.message : 'Network error';
    }
  });
}

function setupSignup() {
  const form = document.getElementById('signupForm');
  const err = document.getElementById('signupError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const result = await apiSignup(name, email, password);
      if (result.error) { err.textContent = result.error; return; }
      if (result.token) {
        saveSession(result.token, result.user);
        redirectToDashboard();
      } else {
        err.textContent = 'Unexpected response from server';
      }
    } catch (errr) {
      console.error('Signup error:', errr);
      err.textContent = errr && errr.message ? errr.message : 'Network error';
    }
  });
}
