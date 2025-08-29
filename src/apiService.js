const API_URL = 'http://localhost:3001/api';

// --- Token helpers ---
function getToken() {
  return localStorage.getItem('token');
}
function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}
function setTokens(token, refreshToken) {
  if (token) localStorage.setItem('token', token);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}
function clearTokens() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
}

// --- Centralized fetch with auto-refresh ---
async function apiFetch(endpoint, { method = 'GET', body, auth = false } = {}) {
  let headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`;
  let res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  // If token expired, try refresh
  if (res.status === 401 && auth && getRefreshToken()) {
    const refreshed = await refreshToken();
    if (refreshed?.token) {
      headers['Authorization'] = `Bearer ${refreshed.token}`;
      res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } else {
      clearTokens();
      throw new Error('Session expired. Please login again.');
    }
  }
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(data.error || 'API Error');
  }
  return data;
}

// --- Auth Service ---
export async function register(username, password) {
  return apiFetch('/register', {
    method: 'POST',
    body: { username, password },
  });
}
export async function login(username, password) {
  const data = await apiFetch('/login', {
    method: 'POST',
    body: { username, password },
  });
  setTokens(data.token, data.refreshToken);
  return data;
}
export async function refreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const data = await apiFetch('/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    // Store both new access token and new refresh token
    setTokens(data.token, data.refreshToken);
    return data;
  } catch {
    clearTokens();
    return null;
  }
}
export async function logout() {
  try {
    // Call server logout to invalidate refresh token
    await apiFetch('/logout', { method: 'POST', auth: true });
  } catch {
    // Even if server call fails, clear local tokens
  } finally {
    clearTokens();
  }
}

export async function deleteAccount() {
  return apiFetch('/delete-account', {
    method: 'DELETE',
    auth: true,
  });
}

// --- Task Service ---
export async function fetchTasks() {
  return apiFetch('/tasks', { auth: true });
}
export async function addTask(task) {
  return apiFetch('/tasks', { method: 'POST', body: task, auth: true });
}
export async function updateTask(id, updates) {
  return apiFetch(`/tasks/${id}`, { method: 'PATCH', body: updates, auth: true });
}
export async function deleteTask(id) {
  return apiFetch(`/tasks/${id}`, { method: 'DELETE', auth: true });
}
