const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'kadjelo_auth_token';
const USER_KEY = 'kadjelo_user';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(user, token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`);
    }
    return data;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export const apiService = {
  async checkHealth() {
    try {
      return await request('/health', { method: 'GET' });
    } catch {
      return {
        connected: false,
        mode: 'local-first',
        message: 'Running in Local-First Offline Mode'
      };
    }
  },

  async register(name, email, password) {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    setAuthSession(res.user, res.token);
    return res;
  },

  async login(email, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setAuthSession(res.user, res.token);
    return res;
  },

  async fetchNotes() {
    const res = await request('/notes', { method: 'GET' });
    return res.notes || [];
  },

  async createNote(note) {
    const res = await request('/notes', {
      method: 'POST',
      body: JSON.stringify(note)
    });
    return res.note;
  },

  async updateNote(id, updates) {
    const res = await request('/notes/${id}'.replace('${id}', id), {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.note;
  },

  async deleteNote(id) {
    return await request(`/notes/${id}`, { method: 'DELETE' });
  },

  async syncLocalToCloud(notes) {
    const res = await request('/notes/sync', {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
    return res.notes || [];
  }
};
