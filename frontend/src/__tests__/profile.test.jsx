import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Profile from '../pages/Profile';

const navigate = vi.fn();
const fireToast = vi.fn();
const refreshProfile = vi.fn(() => Promise.resolve());
const signOut = vi.fn();
let authValue;

const api = vi.hoisted(() => ({
  createEmployee: vi.fn(),
  deleteEmployee: vi.fn(),
  deleteMyProfile: vi.fn(),
  exportMyData: vi.fn(),
  getBoutiques: vi.fn(),
  getClientParticipations: vi.fn(),
  getEmployees: vi.fn(),
  getMyGainHistory: vi.fn(),
  markTicketAsDelivered: vi.fn(),
  updateEmployee: vi.fn(),
  updateMyProfile: vi.fn(),
}));

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
  useGame: () => ({ fireToast }),
}));

vi.mock('../services/api', () => api);

function renderProfile(user) {
  authValue = {
    isAuthenticated: true,
    checkingSession: false,
    user,
    refreshProfile,
    signOut,
  };

  return render(
    <MemoryRouter>
      <Profile />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigate.mockReset();
  fireToast.mockReset();
  refreshProfile.mockClear();
  signOut.mockReset();
  window.confirm = vi.fn(() => true);
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:profile-export');
  globalThis.URL.revokeObjectURL = vi.fn();
  HTMLAnchorElement.prototype.click = vi.fn();

  Object.values(api).forEach((mock) => mock.mockReset());
  api.getMyGainHistory.mockResolvedValue([]);
  api.getClientParticipations.mockResolvedValue({
    participations: [],
    stats: { total_participations: 0, lots_gagnes: 0, lots_retires: 0 },
    pagination: { page: 1, total_pages: 1, total: 0, has_previous: false, has_next: false },
  });
  api.getEmployees.mockResolvedValue({
    employees: [],
    pagination: { page: 1, total_pages: 1, total: 0, has_previous: false, has_next: false },
  });
  api.getBoutiques.mockResolvedValue([
    { id_boutique: 1, nom: 'Paris Centre' },
    { id_boutique: 2, nom: 'Boutique test' },
  ]);
  api.updateMyProfile.mockResolvedValue({ id_user: 1 });
  api.exportMyData.mockResolvedValue({ email: 'client@example.com' });
  api.deleteMyProfile.mockResolvedValue({ id_user: 1 });
  api.markTicketAsDelivered.mockResolvedValue({ id_gain: 1 });
  api.createEmployee.mockResolvedValue({ id_user: 3 });
  api.updateEmployee.mockResolvedValue({ id_user: 3 });
  api.deleteEmployee.mockResolvedValue({ id_user: 3 });
});

describe('Profile page', () => {
  it('renders client history and lets the user update, export and delete the account', async () => {
    const user = userEvent.setup();
    api.getMyGainHistory.mockResolvedValue([
      {
        code_ticket: 'AB12CD34EF',
        remis: false,
        date_utilisation: '2026-09-05T10:00:00.000Z',
        gain: { libelle: 'Infuseur a the' },
      },
    ]);

    renderProfile({
      id_user: 1,
      role: 'client',
      prenom: 'Camille',
      nom: 'Martin',
      email: 'client@example.com',
      date_de_naissance: '1995-04-12',
      sexe: 'F',
      date_inscription: '2026-09-01T10:00:00.000Z',
    });

    expect(await screen.findByText('AB12CD34EF')).toBeInTheDocument();
    expect(screen.getAllByText('A retirer').length).toBeGreaterThan(0);

    const firstNameField = screen.getByDisplayValue('Camille');
    await user.clear(firstNameField);
    await user.type(firstNameField, 'Alice');
    await user.click(screen.getByRole('button', { name: 'Modifier mes informations' }));

    expect(api.updateMyProfile).toHaveBeenCalledWith(expect.objectContaining({ prenom: 'Alice' }));
    expect(refreshProfile).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Exporter mes donnees' }));
    expect(api.exportMyData).toHaveBeenCalled();
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Supprimer mon compte' }));

    expect(screen.getByRole('dialog', { name: 'Supprimer votre compte ?' })).toBeInTheDocument();
    expect(screen.getByText(/supprime definitivement votre compte client/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Oui, supprimer' }));

    expect(window.confirm).not.toHaveBeenCalled();
    expect(api.deleteMyProfile).toHaveBeenCalled();
    expect(signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('blocks profile updates when the birth date is under 18 years old', async () => {
    const user = userEvent.setup();

    renderProfile({
      id_user: 1,
      role: 'client',
      prenom: 'Camille',
      nom: 'Martin',
      email: 'client@example.com',
      date_de_naissance: '1995-04-12',
      sexe: 'F',
      date_inscription: '2026-09-01T10:00:00.000Z',
    });

    const birthDateField = screen.getByLabelText('Date de naissance');
    await user.clear(birthDateField);
    await user.type(birthDateField, '2026-08-13');

    expect(screen.getByRole('alert')).toHaveTextContent('Vous devez avoir au moins 18 ans');

    await user.click(screen.getByRole('button', { name: 'Modifier mes informations' }));

    expect(api.updateMyProfile).not.toHaveBeenCalled();
  });

  it('shows loading state before an authenticated session is available', () => {
    authValue = {
      isAuthenticated: false,
      checkingSession: true,
      user: null,
      refreshProfile,
      signOut,
    };

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    expect(screen.getByText('Chargement de votre espace...')).toBeInTheDocument();
  });

  it('renders staff participation tools and can mark a prize as delivered', async () => {
    const user = userEvent.setup();
    api.getClientParticipations.mockResolvedValue({
      participations: [
        {
          id_ticket: 10,
          code_ticket: 'CD34EF56GH',
          statut: 'utilise',
          remis: false,
          date_utilisation: '2026-09-10T10:00:00.000Z',
          utilisateur: { email: 'client@example.com', nom: 'Client', prenom: 'Test' },
          gain: { libelle: 'Coffret decouverte' },
        },
      ],
      stats: { total_participations: 1, lots_gagnes: 1, lots_retires: 0 },
      pagination: { page: 1, total_pages: 2, total: 1, has_previous: false, has_next: true },
    });

    renderProfile({
      id_user: 2,
      role: 'employe_boutique',
      prenom: 'Sam',
      nom: 'Staff',
      email: 'staff@example.com',
      date_inscription: '2026-09-01T10:00:00.000Z',
    });

    expect(await screen.findByText('Participations clients')).toBeInTheDocument();
    expect(screen.getByText('CD34EF56GH')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Filtrer par email'), 'client@example.com');
    await user.selectOptions(screen.getByLabelText('Filtrer par lot'), 'coffret decouverte 39 euros');
    await user.selectOptions(screen.getByLabelText('Filtrer par statut'), 'utilise');
    await user.selectOptions(screen.getByLabelText('Filtrer par remise'), 'false');
    await user.click(screen.getByRole('button', { name: 'Rechercher' }));

    expect(api.getClientParticipations).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: expect.objectContaining({
        email: 'client@example.com',
        gain: 'coffret decouverte 39 euros',
        statut: 'utilise',
        remis: 'false',
      }),
    }));

    await user.click(screen.getByRole('button', { name: 'Marquer remis' }));

    expect(api.markTicketAsDelivered).toHaveBeenCalledWith('CD34EF56GH');
    expect(fireToast).toHaveBeenCalledWith('Lot marque comme recupere.');
  });

  it('lets administrators manage employees but not delete their own admin account', async () => {
    const user = userEvent.setup();
    api.getEmployees.mockResolvedValue({
      employees: [
        {
          id_user: 3,
          email: 'vendeur@example.com',
          nom: 'Durand',
          prenom: 'Lea',
          boutique_id: 1,
          boutique: { nom: 'Paris Centre' },
          statut: 'actif',
        },
      ],
      pagination: { page: 1, total_pages: 1, total: 1, has_previous: false, has_next: false },
    });

    renderProfile({
      id_user: 2,
      role: 'admin',
      prenom: 'Admin',
      nom: 'TipTop',
      email: 'admin@example.com',
      date_inscription: '2026-09-01T10:00:00.000Z',
    });

    expect(await screen.findByText('Gestion des employes')).toBeInTheDocument();
    expect(screen.getByText('vendeur@example.com')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Supprime' })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Modifier' })[0]);
    const employeeNameField = screen.getByDisplayValue('Durand');
    await user.clear(employeeNameField);
    await user.type(employeeNameField, 'Bernard');
    await user.click(screen.getAllByRole('button', { name: 'Modifier' })[0]);

    expect(api.updateEmployee).toHaveBeenCalledWith(3, expect.objectContaining({ nom: 'Bernard' }));

    const emptyNameField = screen.getAllByPlaceholderText('Nom').find((element) => !element.getAttribute('aria-label') && element.value === '');
    const emptyFirstNameField = screen.getAllByPlaceholderText('Prenom').find((element) => !element.getAttribute('aria-label') && element.value === '');
    const emptyEmailField = screen.getAllByPlaceholderText('Email').find((element) => !element.getAttribute('aria-label') && element.value === '');

    await user.type(emptyNameField, 'Moreau');
    await user.type(emptyFirstNameField, 'Nina');
    await user.type(emptyEmailField, 'nina@example.com');
    await user.type(screen.getByPlaceholderText('Mot de passe'), 'Password1!');
    await user.selectOptions(
      screen.getAllByRole('combobox').find((element) => !element.getAttribute('aria-label') && element.required),
      '1',
    );
    await user.click(screen.getByRole('button', { name: 'Creer' }));

    expect(api.createEmployee).toHaveBeenCalledWith(expect.objectContaining({
      nom: 'Moreau',
      prenom: 'Nina',
      email: 'nina@example.com',
      boutique_id: 1,
    }));

    await user.selectOptions(screen.getByLabelText('Filtrer employe par boutique'), 'Paris Centre');
    await user.selectOptions(screen.getByLabelText('Filtrer employe par statut'), 'actif');
    await user.click(screen.getAllByRole('button', { name: 'Rechercher' })[1]);

    expect(api.getEmployees).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: expect.objectContaining({
        boutique: 'Paris Centre',
        statut: 'actif',
      }),
    }));

    await user.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(api.deleteEmployee).toHaveBeenCalledWith(3);

    expect(screen.getByRole('button', { name: 'Supprimer mon compte' })).toBeDisabled();
    expect(screen.getByText(/Seuls les comptes clients peuvent etre supprimes/i)).toBeInTheDocument();
  });

  it('does not let an employee delete their own account from the profile page', async () => {
    renderProfile({
      id_user: 3,
      role: 'employe_boutique',
      prenom: 'Lea',
      email: 'vendeur@example.com',
      date_inscription: '2026-09-01T10:00:00.000Z',
    });

    expect(await screen.findByText('Participations clients')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Supprimer mon compte' })).toBeDisabled();
    expect(screen.getByText(/Les comptes employes sont geres par un administrateur/i)).toBeInTheDocument();
  });

  it('shows API errors as toast messages', async () => {
    api.getMyGainHistory.mockRejectedValue(new Error('Historique indisponible'));

    renderProfile({
      id_user: 1,
      role: 'client',
      prenom: 'Camille',
      email: 'client@example.com',
      date_inscription: '2026-09-01T10:00:00.000Z',
    });

    await waitFor(() => expect(fireToast).toHaveBeenCalledWith('Historique indisponible'));
  });
});
