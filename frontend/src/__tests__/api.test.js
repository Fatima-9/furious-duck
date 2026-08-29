import { describe, expect, it, vi } from 'vitest';
import {
  apiRequest,
  clearSession,
  createEmployee,
  deleteEmployee,
  deleteMyProfile,
  exportMyData,
  getBoutiques,
  getClientParticipations,
  getEmployees,
  getMyGainHistory,
  getMyProfile,
  getStoredToken,
  getStoredUser,
  login,
  markTicketAsDelivered,
  oauthLogin,
  participateWithTicket,
  register,
  requestPasswordReset,
  resetPassword,
  sendContactMessage,
  storeSession,
  subscribeNewsletter,
  updateEmployee,
  updateMyProfile,
  verifyTicket,
} from '../services/api';

function mockJsonResponse(payload, ok = true) {
  return Promise.resolve({
    ok,
    text: () => Promise.resolve(JSON.stringify(payload)),
  });
}

describe('api service', () => {
  it('stores, reads and clears the current session', () => {
    const user = { id: 1, email: 'client@example.com' };

    storeSession({ token: 'jwt-token', user });

    expect(getStoredToken()).toBe('jwt-token');
    expect(getStoredUser()).toEqual(user);

    clearSession();

    expect(getStoredToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it('rejects incomplete sessions', () => {
    expect(() => storeSession({ token: '', user: { id: 1 } })).toThrow('La session recue est incomplete.');
  });

  it('removes invalid stored user JSON', () => {
    localStorage.setItem('furious_duck_user', '{bad json');

    expect(getStoredUser()).toBeNull();
    expect(localStorage.getItem('furious_duck_user')).toBeNull();
  });

  it('sends authenticated JSON requests', async () => {
    storeSession({ token: 'jwt-token', user: { id: 1 } });
    globalThis.fetch = vi.fn(() => mockJsonResponse({ data: { ok: true } }));

    await expect(apiRequest('/api/demo', { method: 'POST', body: { name: 'Tea' } })).resolves.toEqual({
      data: { ok: true },
    });

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/demo'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer jwt-token',
      },
      body: JSON.stringify({ name: 'Tea' }),
    });
  });

  it('throws the backend error message when a request fails', async () => {
    globalThis.fetch = vi.fn(() => mockJsonResponse({ message: 'Acces refuse.' }, false));

    await expect(apiRequest('/api/private')).rejects.toThrow('Acces refuse.');
  });

  it('uses anonymous requests for login and ticket verification', async () => {
    globalThis.fetch = vi.fn(() => mockJsonResponse({ data: { token: 'jwt', ticket: { exists: true } } }));

    await login({ email: 'client@example.com', mot_de_passe: 'Password1!' });
    await verifyTicket('ab12cd34ef');

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/tickets/ab12cd34ef/verify'),
      expect.objectContaining({
        method: 'GET',
        headers: {},
      }),
    );
  });

  it('maps account and public endpoint helpers to their API routes', async () => {
    globalThis.fetch = vi.fn(() => mockJsonResponse({
      data: {
        user: { id: 1 },
        token: 'jwt',
        boutiques: [{ id_boutique: 1 }],
        gains: [],
      },
    }));

    await register({ email: 'client@example.com' });
    await requestPasswordReset('client@example.com');
    await resetPassword('reset-token', 'Password1!');
    await oauthLogin({ provider: 'google', token: 'oauth-token' });
    await sendContactMessage({ email: 'client@example.com', message: 'Bonjour' });
    await subscribeNewsletter('client@example.com');
    await getMyProfile();
    await updateMyProfile({ prenom: 'Camille' });
    await deleteMyProfile();
    await getMyGainHistory();
    await getBoutiques();
    await exportMyData();

    const urls = fetch.mock.calls.map(([url]) => url);

    expect(urls).toEqual(expect.arrayContaining([
      expect.stringContaining('/api/auth/register'),
      expect.stringContaining('/api/auth/forgot-password'),
      expect.stringContaining('/api/auth/reset-password'),
      expect.stringContaining('/api/auth/oauth'),
      expect.stringContaining('/api/contact'),
      expect.stringContaining('/api/newsletter'),
      expect.stringContaining('/api/users/me'),
      expect.stringContaining('/api/tickets/me/history'),
      expect.stringContaining('/api/admin/boutiques'),
      expect.stringContaining('/api/users/me/export'),
    ]));
  });

  it('builds filtered staff and employee queries', async () => {
    globalThis.fetch = vi.fn(() => mockJsonResponse({
      data: {
        participations: [],
        employees: [],
      },
    }));

    await getClientParticipations({
      page: 2,
      limit: 5,
      filters: { email: ' client@example.com ', remis: false, statut: '' },
    });
    await getEmployees({
      page: 3,
      limit: 15,
      filters: { nom: ' Martin ', boutique: 'Paris' },
    });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/api/boutique/participations?page=2&limit=5&email=client%40example.com&remis=false'),
      expect.any(Object),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/admin/employees?page=3&limit=15&nom=Martin&boutique=Paris'),
      expect.any(Object),
    );
  });

  it('maps employee, ticket delivery and participation mutations', async () => {
    globalThis.fetch = vi.fn(() => mockJsonResponse({
      data: {
        employee: { id_user: 3 },
        gain: { libelle: 'Infuseur' },
        ticket: { code_ticket: 'AB12CD34EF' },
      },
    }));

    await createEmployee({ email: 'staff@example.com' });
    await updateEmployee(3, { nom: 'Staff' });
    await deleteEmployee(3);
    await markTicketAsDelivered('AB12 CD34 EF');
    await participateWithTicket('AB12 CD34 EF');

    expect(fetch).toHaveBeenNthCalledWith(1, expect.stringContaining('/api/admin/employees'), expect.objectContaining({ method: 'POST' }));
    expect(fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/api/admin/employees/3'), expect.objectContaining({ method: 'PATCH' }));
    expect(fetch).toHaveBeenNthCalledWith(3, expect.stringContaining('/api/admin/employees/3'), expect.objectContaining({ method: 'DELETE' }));
    expect(fetch).toHaveBeenNthCalledWith(4, expect.stringContaining('/api/boutique/tickets/AB12%20CD34%20EF/remise'), expect.objectContaining({ method: 'PATCH' }));
    expect(fetch).toHaveBeenNthCalledWith(5, expect.stringContaining('/api/tickets/AB12%20CD34%20EF/participate'), expect.objectContaining({ method: 'POST' }));
  });

  it('returns null for empty successful responses', async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      text: () => Promise.resolve(''),
    }));

    await expect(apiRequest('/api/empty')).resolves.toBeNull();
  });
});
