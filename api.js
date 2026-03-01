// api.js - centralizes backend calls
const API_BASE = (function(){
  // When serving frontend statically, point to backend server. Adjust if needed.
  // If page is opened from file:// or hostname is empty, default to localhost.
  const host = window.location.hostname || 'localhost';
  // Default to backend port 5000 for development
  return `http://${host}:5000/api`;
})();

function getToken() {
  return localStorage.getItem('taskflow_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

// Auth
async function apiSignup(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  if (!res.ok) {
    // try parse json error body, fall back to statusText
    const errBody = await res.json().catch(()=>({ error: res.statusText }));
    return errBody;
  }
  return res.json();
}

async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const errBody = await res.json().catch(()=>({ error: res.statusText }));
    return errBody;
  }
  return res.json();
}

// Tasks
async function apiGetTasks(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_BASE}/tasks${params ? '?' + params : ''}`, {
    method: 'GET',
    headers: authHeaders()
  });
  return res.json();
}

async function apiCreateTask(payload) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function apiUpdateTask(id, payload) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function apiDeleteTask(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return res.json();
}
