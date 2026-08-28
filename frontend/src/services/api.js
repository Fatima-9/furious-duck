const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'furious_duck_token';
const USER_KEY = 'furious_duck_user';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function storeSession({ token, user }) {
  if (!token || !user) {
    throw new Error('La session recue est incomplete.');
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function parseResponse(response) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.message || payload?.error || 'Une erreur est survenue.';
    throw new Error(message);
  }

  return payload;
}

export async function apiRequest(path, { method = 'GET', body, token, headers = {} } = {}) {
  const authToken = token ?? getStoredToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseResponse(response);
}

export async function login(payload) {
  const response = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: payload,
    token: null,
  });
  return response.data;
}

export async function register(payload) {
  const response = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: payload,
    token: null,
  });
  return response.data;
}

export async function requestPasswordReset(email) {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
    token: null,
  });
}

export async function subscribeNewsletter(email) {
  return apiRequest('/api/newsletter', {
    method: 'POST',
    body: { email },
    token: null,
  });
}

export async function resetPassword(token, mot_de_passe) {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: { token, mot_de_passe },
    token: null,
  });
}

export async function oauthLogin(payload) {
  const response = await apiRequest('/api/auth/oauth', {
    method: 'POST',
    body: payload,
    token: null,
  });
  return response.data;
}

export async function sendContactMessage(payload) {
  return apiRequest('/api/contact', {
    method: 'POST',
    body: payload,
    token: null,
  });
}

export async function getMyProfile() {
  const response = await apiRequest('/api/users/me');
  return response.data.user;
}

export async function updateMyProfile(payload) {
  const response = await apiRequest('/api/users/me', {
    method: 'PATCH',
    body: payload,
  });
  return response.data.user;
}

export async function deleteMyProfile() {
  const response = await apiRequest('/api/users/me', {
    method: 'DELETE',
  });
  return response.data.user;
}

export async function getMyGainHistory() {
  const response = await apiRequest('/api/tickets/me/history');
  return response.data.gains;
}

export async function verifyTicket(code) {
  const response = await apiRequest(`/api/tickets/${encodeURIComponent(code)}/verify`, {
    token: null,
  });
  return response.data.ticket;
}

export async function getClientParticipations({ page = 1, limit = 10, filters = {} } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value).trim());
    }
  });

  const response = await apiRequest(`/api/boutique/participations?${params.toString()}`);
  return response.data;
}

export async function getEmployees({ page = 1, limit = 10, filters = {} } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value).trim());
    }
  });

  const response = await apiRequest(`/api/admin/employees?${params.toString()}`);
  return response.data;
}

export async function getBoutiques() {
  const response = await apiRequest('/api/admin/boutiques');
  return response.data.boutiques;
}

export async function createEmployee(payload) {
  const response = await apiRequest('/api/admin/employees', {
    method: 'POST',
    body: payload,
  });
  return response.data.employee;
}

export async function updateEmployee(id, payload) {
  const response = await apiRequest(`/api/admin/employees/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  return response.data.employee;
}

export async function deleteEmployee(id) {
  const response = await apiRequest(`/api/admin/employees/${id}`, {
    method: 'DELETE',
  });
  return response.data.employee;
}

export async function markTicketAsDelivered(code) {
  const response = await apiRequest(`/api/boutique/tickets/${encodeURIComponent(code)}/remise`, {
    method: 'PATCH',
  });
  return response.data.gain;
}

export async function participateWithTicket(code) {
  const response = await apiRequest(`/api/tickets/${encodeURIComponent(code)}/participate`, {
    method: 'POST',
  });
  return response.data.ticket;
}

export async function exportMyData() {
  const response = await apiRequest('/api/users/me/export');
  return response.data;
}
