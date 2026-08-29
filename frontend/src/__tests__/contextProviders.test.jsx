import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/useAuth';
import { GameProvider } from '../context/GameContext';
import { useGame } from '../context/useGame';

const api = vi.hoisted(() => ({
  clearSession: vi.fn(),
  getMyProfile: vi.fn(),
  getStoredToken: vi.fn(),
  getStoredUser: vi.fn(),
  login: vi.fn(),
  oauthLogin: vi.fn(),
  participateWithTicket: vi.fn(),
  register: vi.fn(),
  storeSession: vi.fn(),
  verifyTicket: vi.fn(),
}));

vi.mock('../services/api', () => api);

function AuthProbe() {
  const auth = useAuth();

  return (
    <div>
      <span data-testid="auth-state">{auth.isAuthenticated ? 'connecte' : 'anonyme'}</span>
      <span data-testid="auth-user">{auth.user?.email || 'aucun'}</span>
      <span data-testid="auth-loading">{auth.loading ? 'chargement' : 'pret'}</span>
      <button type="button" onClick={() => auth.signIn({ email: 'client@example.com', mot_de_passe: 'Password1!' })}>
        login
      </button>
      <button type="button" onClick={() => auth.signUp({ email: 'new@example.com', mot_de_passe: 'Password1!' })}>
        register
      </button>
      <button type="button" onClick={() => auth.signInWithOAuth({ provider: 'google', token: 'google-token' })}>
        oauth
      </button>
      <button type="button" onClick={() => auth.refreshProfile({ silent: false })}>
        refresh
      </button>
      <button type="button" onClick={auth.signOut}>
        logout
      </button>
    </div>
  );
}

function GameProbe() {
  const game = useGame();

  return (
    <div>
      <span data-testid="code">{game.code}</span>
      <span data-testid="ticket-status">{game.ticketCheck.status}</span>
      <span data-testid="message">{game.ticketCheck.message}</span>
      <span data-testid="draw-state">{game.drawState}</span>
      <span data-testid="toast">{game.toastMsg}</span>
      <span data-testid="prize">{game.prize?.name || 'aucun'}</span>
      <button type="button" onClick={() => game.setCode('ab12-cd34ef')}>
        set-valid-code
      </button>
      <button type="button" onClick={() => game.setCode('abc')}>
        set-short-code
      </button>
      <button type="button" onClick={game.spin}>
        spin
      </button>
      <button type="button" onClick={game.resetDraw}>
        reset
      </button>
      <button type="button" onClick={() => game.fireToast('Message test')}>
        toast
      </button>
      <button type="button" onClick={game.hideToast}>
        hide-toast
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  it('starts from a stored user and signs out', async () => {
    const user = userEvent.setup();
    api.getStoredToken.mockReturnValue('stored-token');
    api.getStoredUser.mockReturnValue({ email: 'stored@example.com' });
    api.getMyProfile.mockResolvedValue({ email: 'fresh@example.com' });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId('auth-state')).toHaveTextContent('connecte');
    expect(screen.getByTestId('auth-user')).toHaveTextContent('stored@example.com');

    await waitFor(() => expect(screen.getByTestId('auth-user')).toHaveTextContent('fresh@example.com'));

    await user.click(screen.getByRole('button', { name: 'logout' }));

    expect(api.clearSession).toHaveBeenCalled();
    expect(screen.getByTestId('auth-state')).toHaveTextContent('anonyme');
  });

  it('signs in, signs up, oauth signs in and refreshes the profile', async () => {
    const user = userEvent.setup();
    api.getStoredToken.mockReturnValue(null);
    api.getStoredUser.mockReturnValue(null);
    api.login.mockResolvedValue({ token: 'login-token', user: { email: 'login@example.com' } });
    api.register.mockResolvedValue({ token: 'register-token', user: { email: 'register@example.com' } });
    api.oauthLogin.mockResolvedValue({ token: 'oauth-token', user: { email: 'oauth@example.com' } });
    api.getMyProfile.mockResolvedValue({ email: 'profile@example.com' });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'login' }));
    expect(await screen.findByText('login@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'register' }));
    expect(await screen.findByText('register@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'oauth' }));
    expect(await screen.findByText('oauth@example.com')).toBeInTheDocument();

    api.getStoredToken.mockReturnValue('oauth-token');
    await user.click(screen.getByRole('button', { name: 'refresh' }));

    expect(await screen.findByText('profile@example.com')).toBeInTheDocument();
  });

  it('clears a broken stored session', async () => {
    api.getStoredToken.mockReturnValue('broken-token');
    api.getStoredUser.mockReturnValue(null);
    api.getMyProfile.mockRejectedValue(new Error('expired'));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(api.clearSession).toHaveBeenCalled());
    expect(screen.getByTestId('auth-state')).toHaveTextContent('anonyme');
  });
});

describe('GameProvider', () => {
  it('normalizes ticket codes and validates them with the API', async () => {
    vi.useFakeTimers();
    api.verifyTicket.mockResolvedValue({ exists: true, canParticipate: true });

    render(
      <GameProvider>
        <GameProbe />
      </GameProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-valid-code' }));

    expect(screen.getByTestId('code')).toHaveTextContent('AB12CD34EF');
    expect(screen.getByTestId('ticket-status')).toHaveTextContent('checking');

    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(screen.getByTestId('ticket-status')).toHaveTextContent('valid');
    expect(screen.getByTestId('message')).toHaveTextContent('Code trouve en base');

    vi.useRealTimers();
  });

  it('shows invalid ticket messages and format feedback', async () => {
    vi.useFakeTimers();
    api.verifyTicket.mockResolvedValueOnce({ exists: false });

    render(
      <GameProvider>
        <GameProbe />
      </GameProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-short-code' }));
    expect(screen.getByTestId('ticket-status')).toHaveTextContent('format_incomplete');

    fireEvent.click(screen.getByRole('button', { name: 'set-valid-code' }));
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(screen.getByTestId('message')).toHaveTextContent("Ce code n'existe pas.");
    vi.useRealTimers();
  });

  it('participates, spins the wheel and displays the won prize', async () => {
    vi.useFakeTimers();
    api.verifyTicket.mockResolvedValue({ exists: true, canParticipate: true });
    api.participateWithTicket.mockResolvedValue({
      code_ticket: 'AB12CD34EF',
      gain: { libelle: 'boîte de 100g de thé signature' },
    });

    render(
      <GameProvider>
        <GameProbe />
      </GameProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-valid-code' }));
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });
    expect(screen.getByTestId('ticket-status')).toHaveTextContent('valid');

    fireEvent.click(screen.getByRole('button', { name: 'spin' }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('draw-state')).toHaveTextContent('spinning');

    await act(async () => {
      vi.advanceTimersByTime(4560);
      await Promise.resolve();
    });

    expect(screen.getByTestId('draw-state')).toHaveTextContent('won');
    expect(screen.getByTestId('prize')).toHaveTextContent('Une boite de the signature');

    fireEvent.click(screen.getByRole('button', { name: 'reset' }));
    expect(screen.getByTestId('draw-state')).toHaveTextContent('idle');

    vi.useRealTimers();
  });

  it('refuses to spin invalid codes and can show or hide toast messages', async () => {
    vi.useFakeTimers();
    render(
      <GameProvider>
        <GameProbe />
      </GameProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'spin' }));
    expect(screen.getByTestId('toast')).toHaveTextContent('Saisissez un code de 10 caracteres');

    fireEvent.click(screen.getByRole('button', { name: 'toast' }));
    expect(screen.getByTestId('toast')).toHaveTextContent('Message test');

    fireEvent.click(screen.getByRole('button', { name: 'hide-toast' }));
    expect(screen.getByTestId('toast')).toBeEmptyDOMElement();

    vi.useRealTimers();
  });
});
