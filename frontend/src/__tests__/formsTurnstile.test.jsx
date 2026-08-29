import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GameContext } from '../context/gameContextInstance';

const navigate = vi.fn();
const fireToast = vi.fn();
const signIn = vi.fn();
const signUp = vi.fn();
const refreshProfile = vi.fn();
const sendContactMessage = vi.fn();

function renderForm(ui) {
  return render(
    <MemoryRouter>
      <GameContext.Provider value={{ fireToast }}>
        {ui}
      </GameContext.Provider>
    </MemoryRouter>,
  );
}

async function loadAuthPage() {
  vi.resetModules();
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'site-key');
  vi.doMock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => navigate,
      useLocation: () => ({ state: null }),
    };
  });
  vi.doMock('../context/useAuth', () => ({
    useAuth: () => ({
      signIn,
      signUp,
      refreshProfile,
      authenticating: false,
    }),
  }));
  vi.doMock('../context/useGame', () => ({
    useGame: () => ({ fireToast }),
  }));

  return import('../pages/Auth.jsx');
}

async function loadContactPage() {
  vi.resetModules();
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'site-key');
  vi.doMock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => navigate,
    };
  });
  vi.doMock('../context/useGame', () => ({
    useGame: () => ({ fireToast }),
  }));
  vi.doMock('../services/api', () => ({
    sendContactMessage,
  }));

  return import('../pages/Contact.jsx');
}

describe('Turnstile protected forms', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock('react-router-dom');
    vi.doUnmock('../context/useAuth');
    vi.doUnmock('../context/useGame');
    vi.doUnmock('../services/api');
    navigate.mockReset();
    fireToast.mockReset();
    signIn.mockReset();
    signUp.mockReset();
    refreshProfile.mockReset();
    sendContactMessage.mockReset();
  });

  it('blocks signup while captcha is not validated, then sends the Turnstile token', async () => {
    const user = userEvent.setup();
    signUp.mockResolvedValue({ token: 'jwt', user: { id: 1 } });
    refreshProfile.mockResolvedValue({ id: 1 });
    const { default: Auth } = await loadAuthPage();
    renderForm(<Auth />);

    await user.type(screen.getByLabelText('Prenom'), 'Camille');
    await user.type(screen.getByLabelText('Nom'), 'Martin');
    await user.type(screen.getByLabelText('Date de naissance'), '1990-08-13');
    await user.selectOptions(screen.getByLabelText('Sexe'), 'F');
    await user.type(screen.getByLabelText('Adresse e-mail'), 'camille@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'Password1!');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Creer mon compte' }));

    expect(fireToast).toHaveBeenCalledWith('Veuillez valider le captcha.');
    expect(signUp).not.toHaveBeenCalled();

    await user.click(screen.getByTestId('turnstile'));
    await user.click(screen.getByRole('button', { name: 'Creer mon compte' }));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith(expect.objectContaining({ turnstile_token: 'test-turnstile-token' }));
    });
    expect(navigate).toHaveBeenCalledWith('/mon-espace', { replace: true });
  });

  it('sends the captcha token during login', async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValue({ token: 'jwt', user: { id: 1 } });
    refreshProfile.mockResolvedValue({ id: 1 });
    const { default: Auth } = await loadAuthPage();
    renderForm(<Auth />);

    await user.click(screen.getByRole('button', { name: 'Connexion' }));
    await user.type(screen.getByLabelText('Adresse e-mail'), 'client@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'Password1!');
    await user.click(screen.getByTestId('turnstile'));
    await user.click(screen.getByRole('button', { name: 'Me connecter' }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({
        email: 'client@example.com',
        mot_de_passe: 'Password1!',
        turnstile_token: 'test-turnstile-token',
      });
    });
  });

  it('sends contact messages with the captcha token and resets the form', async () => {
    const user = userEvent.setup();
    sendContactMessage.mockResolvedValue({ message: 'ok' });
    const { default: Contact } = await loadContactPage();
    renderForm(<Contact />);

    await user.type(screen.getByLabelText('Prénom'), 'Camille');
    await user.type(screen.getByLabelText('Nom'), 'Martin');
    await user.type(screen.getByLabelText('E-mail'), 'camille@example.com');
    await user.type(screen.getByLabelText('Message'), 'Bonjour, je voudrais des informations.');
    await user.click(screen.getByTestId('turnstile'));
    await user.click(screen.getByRole('button', { name: 'Envoyer le message' }));

    await waitFor(() => {
      expect(sendContactMessage).toHaveBeenCalledWith(expect.objectContaining({
        email: 'camille@example.com',
        turnstile_token: 'test-turnstile-token',
      }));
    });
    expect(fireToast).toHaveBeenCalledWith('Message envoye — nous repondons sous 48 h.');
  });
});
