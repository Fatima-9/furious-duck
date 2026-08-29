import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from '../pages/Home';
import About from '../pages/About';
import Faq from '../pages/Faq';
import Legal from '../pages/Legal';
import Play from '../pages/Play';
import Result from '../pages/Result';
import Stats from '../pages/Stats';
import Layout from '../components/layout/Layout';
import Nav from '../components/layout/Nav';
import Toast from '../components/layout/Toast';
import DecorativeWheel from '../components/wheel/DecorativeWheel';
import PrizeWheel from '../components/wheel/PrizeWheel';

const navigate = vi.fn();
const fireToast = vi.fn();
const resetDraw = vi.fn();
const setCode = vi.fn();
let authValue;
let gameValue;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('../context/useAuth', () => ({
  useAuth: () => authValue,
}));

vi.mock('../context/useGame', () => ({
  useGame: () => gameValue,
}));

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    getMyGainHistory: vi.fn(() => Promise.resolve([
      {
        code_ticket: 'AB12CD34EF',
        remis: true,
        date_utilisation: new Date().toISOString(),
        gain: { libelle: 'Infuseur a the' },
      },
      {
        code_ticket: 'CD34EF56GH',
        remis: false,
        date_utilisation: new Date().toISOString(),
        gain: { libelle: 'Coffret decouverte 39 euros' },
      },
    ])),
  };
});

function resetState() {
  navigate.mockReset();
  fireToast.mockReset();
  resetDraw.mockReset();
  setCode.mockReset();
  authValue = {
    isAuthenticated: true,
    checkingSession: false,
    user: { id: 1, role: 'client', prenom: 'Camille' },
  };
  gameValue = {
    code: '',
    setCode,
    codeHasValidFormat: false,
    codeValid: false,
    ticketCheck: { status: 'idle', message: '' },
    isSpinning: false,
    hasWon: false,
    prize: null,
    resetDraw,
    fireToast,
    toastMsg: '',
    hideToast: vi.fn(),
    rotation: 0,
    spinDuration: 0.7,
    spin: vi.fn(),
  };
}

function renderPage(ui, route = '/') {
  resetState();
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

describe('page smoke coverage', () => {
  it('renders the home page and tracks participation navigation', async () => {
    const user = userEvent.setup();
    renderPage(<Home />);

    expect(screen.getByRole('heading', { name: /Tournez la roue/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Tenter ma chance/i }));

    expect(navigate).toHaveBeenCalledWith('/participer');
  });

  it('renders the concept page with contest rules', async () => {
    const user = userEvent.setup();
    renderPage(<About />);

    expect(screen.getByRole('heading', { name: 'Les règles essentielles.' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Je participe maintenant' }));

    expect(navigate).toHaveBeenCalledWith('/participer');
  });

  it('renders FAQ and navigates to contact', async () => {
    const user = userEvent.setup();
    renderPage(<Faq />);

    await user.click(screen.getByRole('button', { name: 'Contactez-nous' }));

    expect(navigate).toHaveBeenCalledWith('/contact');
  });

  it('renders legal content and cookie preferences action', () => {
    renderPage(<Legal />, '/mentions-legales#lg-cookies');

    expect(screen.getByRole('heading', { name: /Cookies et mesure d’audience/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modifier mes choix de cookies' })).toBeInTheDocument();
  });

  it('renders play for a client and updates ticket code', async () => {
    const user = userEvent.setup();
    renderPage(<Play />);

    await user.type(screen.getByPlaceholderText('AB12CD34EF'), 'ab12');

    expect(setCode).toHaveBeenCalled();
  });

  it('blocks play for non-client accounts', () => {
    resetState();
    authValue = {
      isAuthenticated: true,
      checkingSession: false,
      user: { id: 2, role: 'admin' },
    };
    render(
      <MemoryRouter>
        <Play />
      </MemoryRouter>,
    );

    expect(screen.getByText('Ce compte ne peut pas participer au jeu.')).toBeInTheDocument();
  });

  it('renders result page with and without a won prize', () => {
    renderPage(<Result />);
    expect(screen.getByRole('heading', { name: 'Votre lot vous attend.' })).toBeInTheDocument();

    resetState();
    gameValue = {
      ...gameValue,
      hasWon: true,
      prize: {
        tier: 'Premium',
        name: 'Une boite de the signature',
        value: 'Lot premium',
        ticket: { code_ticket: 'AB12CD34EF' },
      },
    };
    render(
      <MemoryRouter>
        <Result />
      </MemoryRouter>,
    );

    expect(screen.getByText('AB12CD34EF')).toBeInTheDocument();
  });

  it('renders statistics from the gain history API', async () => {
    renderPage(<Stats />);

    expect((await screen.findAllByText('2')).length).toBeGreaterThan(0);
    expect(screen.getByText('Taux de retrait')).toBeInTheDocument();
  });

  it('renders statistics access restriction for non-clients', () => {
    resetState();
    authValue = {
      isAuthenticated: true,
      checkingSession: false,
      user: { id: 2, role: 'employe_boutique' },
    };
    render(
      <MemoryRouter>
        <Stats />
      </MemoryRouter>,
    );

    expect(screen.getByText("Ce compte n'a pas de statistiques de participation.")).toBeInTheDocument();
  });

  it('renders layout pieces and wheel components', async () => {
    const user = userEvent.setup();
    renderPage(
      <>
        <Nav />
        <Layout />
        <Toast />
        <DecorativeWheel />
        <PrizeWheel />
      </>,
    );

    await user.click(screen.getAllByRole('button', { name: /menu/i })[0]);

    await waitFor(() => {
      expect(screen.getAllByText('The Tip Top').length).toBeGreaterThan(0);
    });
  });
});
