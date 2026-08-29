import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CookieBanner from '../components/cookies/CookieBanner';
import ContestCountdown from '../components/contest/ContestCountdown';
import Footer from '../components/layout/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import Button from '../components/ui/Button';
import FaqItem from '../components/ui/FaqItem';
import { Input, Select, Textarea } from '../components/ui/Field';
import SiteMap from '../pages/SiteMap';
import NotFound from '../pages/NotFound';
import ServerError from '../pages/ServerError';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import { AuthContext } from '../context/authContextInstance';
import { GameContext } from '../context/gameContextInstance';
import { saveConsent } from '../components/cookies/cookieConsent';

const fireToast = vi.fn();

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    requestPasswordReset: vi.fn(() => Promise.resolve({ message: 'ok' })),
    resetPassword: vi.fn(() => Promise.resolve({ message: 'ok' })),
    subscribeNewsletter: vi.fn(() => Promise.resolve({ message: 'ok' })),
  };
});

function renderWithRouter(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <GameContext.Provider value={{ fireToast }}>
        {ui}
      </GameContext.Provider>
    </MemoryRouter>,
  );
}

describe('shared UI components', () => {
  it('renders button, fields and faq item with accessible labels', () => {
    render(
      <>
        <Button>Action</Button>
        <Input id="email" label="E-mail" />
        <Select id="topic" label="Sujet">
          <option>Contact</option>
        </Select>
        <Textarea id="message" label="Message" />
        <FaqItem question="Comment participer ?" defaultOpen>
          En saisissant un code ticket.
        </FaqItem>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Action' })).toHaveClass('btn-solid');
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Sujet')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByText('En saisissant un code ticket.')).toBeInTheDocument();
  });

  it('renders the countdown status before contest opening', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T10:00:00+02:00'));

    render(<ContestCountdown />);

    expect(screen.getByText('Le jeu commence le 1 septembre 2026.')).toBeInTheDocument();

    vi.useRealTimers();
  });
});

describe('cookie banner', () => {
  it('stores rejected consent and hides the banner', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CookieBanner />);

    await user.click(screen.getByRole('button', { name: 'Tout refuser' }));

    expect(screen.queryByRole('dialog', { name: 'Gestion des cookies' })).not.toBeInTheDocument();
  });

  it('opens preferences and saves selected analytics consent', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CookieBanner />);

    await user.click(screen.getByRole('button', { name: 'Personnaliser' }));
    await user.click(screen.getAllByRole('checkbox')[1]);
    await user.click(screen.getByRole('button', { name: 'Enregistrer mes choix' }));

    expect(JSON.parse(localStorage.getItem('ttt_cookie_consent'))).toMatchObject({ analytics: true });
  });
});

describe('footer and sitemap', () => {
  it('renders social icon links and newsletter feedback', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Footer />);

    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
    expect(screen.queryByText('Règlement du jeu')).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('votre@email.fr'), 'client@example.com');
    await user.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(await screen.findByText('Inscription confirmee.')).toBeInTheDocument();
  });

  it('groups all important site links', () => {
    renderWithRouter(<SiteMap />);

    expect(screen.getByRole('heading', { name: 'Découvrir le jeu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mentions légales/i })).toHaveAttribute('href', '/mentions-legales#lg-mentions');
    expect(screen.getByRole('link', { name: /Participer/i })).toHaveAttribute('href', '/participer');
  });
});

describe('routing helpers', () => {
  it('redirects anonymous visitors away from protected pages', () => {
    render(
      <MemoryRouter initialEntries={['/private']}>
        <AuthContext.Provider value={{ isAuthenticated: false, checkingSession: false }}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/private" element={<h1>Private page</h1>} />
            </Route>
            <Route path="/connexion" element={<h1>Connexion</h1>} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
  });

  it('renders protected content for authenticated clients', () => {
    render(
      <MemoryRouter initialEntries={['/private']}>
        <AuthContext.Provider value={{ isAuthenticated: true, checkingSession: false }}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/private" element={<h1>Private page</h1>} />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Private page' })).toBeInTheDocument();
  });

  it('shows the session verification state', () => {
    render(
      <MemoryRouter initialEntries={['/private']}>
        <AuthContext.Provider value={{ isAuthenticated: false, checkingSession: true }}>
          <ProtectedRoute />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Verification de votre session...')).toBeInTheDocument();
  });
});

describe('account recovery pages', () => {
  it('submits the forgot password form', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);

    await user.type(screen.getByLabelText('Adresse e-mail'), 'client@example.com');
    await user.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

    expect(await screen.findByRole('status')).toHaveTextContent('un e-mail vient de vous être envoyé');
  });

  it('rejects mismatched reset password confirmations', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ResetPassword />, { route: '/reset-password?token=abc' });

    await user.type(screen.getByLabelText('Nouveau mot de passe'), 'Password1!');
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'Password2!');
    await user.click(screen.getByRole('button', { name: 'Modifier mon mot de passe' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Les mots de passe ne correspondent pas.');
  });

  it('shows invalid reset links without token', () => {
    renderWithRouter(<ResetPassword />, { route: '/reset-password' });

    expect(screen.getByRole('alert')).toHaveTextContent('Ce lien de réinitialisation est incomplet ou invalide.');
  });
});

describe('error pages', () => {
  it('renders public error pages', () => {
    saveConsent({ analytics: false });
    renderWithRouter(
      <>
        <NotFound />
        <ServerError />
      </>,
    );

    expect(screen.getByText('Page introuvable.')).toBeInTheDocument();
    expect(screen.getByText('Une erreur est survenue.')).toBeInTheDocument();
  });
});
