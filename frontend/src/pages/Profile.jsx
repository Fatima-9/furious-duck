import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useAuth } from '../context/useAuth';
import { useGame } from '../context/useGame';
import {
  createEmployee,
  deleteEmployee,
  exportMyData,
  getBoutiques,
  getClientParticipations,
  getEmployees,
  getMyGainHistory,
  markTicketAsDelivered,
  updateEmployee,
} from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import { canParticipate, getRoleDisplayName, isAdmin } from '../utils/roles';

const staffFiltersInitial = {
  code_ticket: '',
  email: '',
  nom: '',
  prenom: '',
  gain: '',
  date_utilisation: '',
  statut: '',
  remis: '',
};

const employeeFiltersInitial = {
  email: '',
  nom: '',
  prenom: '',
  boutique: '',
  statut: '',
};

const employeeFormInitial = {
  id_user: null,
  nom: '',
  prenom: '',
  email: '',
  mot_de_passe: '',
  boutique_id: '',
  statut: 'actif',
};

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Profile() {
  const navigate = useNavigate();
  const { fireToast } = useGame();
  const { isAuthenticated, checkingSession, user, refreshProfile } = useAuth();
  const [history, setHistory] = useState(null);
  const [staffFiltersDraft, setStaffFiltersDraft] = useState(staffFiltersInitial);
  const [staffFilters, setStaffFilters] = useState(staffFiltersInitial);
  const [staffPage, setStaffPage] = useState(1);
  const [staffData, setStaffData] = useState(null);
  const [deliveringCode, setDeliveringCode] = useState(null);
  const [employeeFiltersDraft, setEmployeeFiltersDraft] = useState(employeeFiltersInitial);
  const [employeeFilters, setEmployeeFilters] = useState(employeeFiltersInitial);
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeData, setEmployeeData] = useState(null);
  const [boutiques, setBoutiques] = useState([]);
  const [employeeForm, setEmployeeForm] = useState(employeeFormInitial);
  const [savingEmployee, setSavingEmployee] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    refreshProfile();
  }, [isAuthenticated, refreshProfile]);

  const showParticipation = canParticipate(user);
  const showEmployeeManagement = isAdmin(user);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (showParticipation) {
      getMyGainHistory()
        .then(setHistory)
        .catch((error) => fireToast(error.message));
      return;
    }

    getClientParticipations({ page: staffPage, limit: 10, filters: staffFilters })
      .then(setStaffData)
      .catch((error) => fireToast(error.message));
  }, [fireToast, isAuthenticated, showParticipation, staffFilters, staffPage, user]);

  useEffect(() => {
    if (!isAuthenticated || !showEmployeeManagement) return;

    getEmployees({ page: employeePage, limit: 10, filters: employeeFilters })
      .then(setEmployeeData)
      .catch((error) => fireToast(error.message));
  }, [employeeFilters, employeePage, fireToast, isAuthenticated, showEmployeeManagement]);

  useEffect(() => {
    if (!isAuthenticated || !showEmployeeManagement) return;

    getBoutiques()
      .then((data) => {
        setBoutiques(data);
        setEmployeeForm((current) => (
          current.boutique_id || !data[0]
            ? current
            : { ...current, boutique_id: String(data[0].id_boutique) }
        ));
      })
      .catch((error) => fireToast(error.message));
  }, [fireToast, isAuthenticated, showEmployeeManagement]);

  async function handleExport() {
    try {
      const data = await exportMyData();
      downloadJson('mes-donnees-the-tip-top.json', data);
      fireToast('Export RGPD telecharge.');
    } catch (error) {
      fireToast(error.message);
    }
  }

  if (checkingSession || !isAuthenticated) {
    return (
      <section className="ttt-section" style={{ paddingTop: 80, paddingBottom: 100, textAlign: 'center' }}>
        <h1 style={{ fontWeight: 600, fontSize: 34 }}>Chargement de votre espace...</h1>
      </section>
    );
  }

  const firstName = user?.prenom || user?.email || 'Utilisateur';
  const initial = firstName.charAt(0).toUpperCase();
  const gains = history || [];
  const pendingCount = gains.filter((item) => !item.remis).length;
  const roleName = getRoleDisplayName(user);
  const staffRows = staffData?.participations || [];
  const staffStats = staffData?.stats || {
    total_participations: 0,
    lots_gagnes: 0,
    lots_retires: 0,
  };
  const staffPagination = staffData?.pagination || {
    page: staffPage,
    total_pages: 1,
    total: 0,
    has_previous: false,
    has_next: false,
  };
  const employeeRows = employeeData?.employees || [];
  const employeePagination = employeeData?.pagination || {
    page: employeePage,
    total_pages: 1,
    total: 0,
    has_previous: false,
    has_next: false,
  };

  function updateStaffFilter(field, value) {
    setStaffFiltersDraft((current) => ({ ...current, [field]: value }));
  }

  function searchStaffParticipations(event) {
    event.preventDefault();
    setStaffPage(1);
    setStaffFilters(staffFiltersDraft);
  }

  function resetStaffFilters() {
    setStaffFiltersDraft(staffFiltersInitial);
    setStaffFilters(staffFiltersInitial);
    setStaffPage(1);
  }

  async function reloadStaffParticipations() {
    const data = await getClientParticipations({ page: staffPage, limit: 10, filters: staffFilters });
    setStaffData(data);
  }

  async function deliverPrize(row) {
    if (!window.confirm(`Confirmer que le lot du ticket ${row.code_ticket} a ete recupere ?`)) return;

    setDeliveringCode(row.code_ticket);
    try {
      await markTicketAsDelivered(row.code_ticket);
      fireToast('Lot marque comme recupere.');
      await reloadStaffParticipations();
    } catch (error) {
      fireToast(error.message);
    } finally {
      setDeliveringCode(null);
    }
  }

  function updateEmployeeFilter(field, value) {
    setEmployeeFiltersDraft((current) => ({ ...current, [field]: value }));
  }

  function searchEmployees(event) {
    event.preventDefault();
    setEmployeePage(1);
    setEmployeeFilters(employeeFiltersDraft);
  }

  function resetEmployeeFilters() {
    setEmployeeFiltersDraft(employeeFiltersInitial);
    setEmployeeFilters(employeeFiltersInitial);
    setEmployeePage(1);
  }

  function updateEmployeeForm(field, value) {
    setEmployeeForm((current) => ({ ...current, [field]: value }));
  }

  function editEmployee(employee) {
    setEmployeeForm({
      id_user: employee.id_user,
      nom: employee.nom || '',
      prenom: employee.prenom || '',
      email: employee.email || '',
      mot_de_passe: '',
      boutique_id: employee.boutique_id ? String(employee.boutique_id) : '',
      statut: employee.statut || 'actif',
    });
  }

  async function reloadEmployees() {
    const data = await getEmployees({ page: employeePage, limit: 10, filters: employeeFilters });
    setEmployeeData(data);
  }

  async function submitEmployee(event) {
    event.preventDefault();
    setSavingEmployee(true);

    try {
      const payload = {
        nom: employeeForm.nom,
        prenom: employeeForm.prenom,
        email: employeeForm.email,
        boutique_id: Number(employeeForm.boutique_id),
        statut: employeeForm.statut,
      };

      if (employeeForm.mot_de_passe) {
        payload.mot_de_passe = employeeForm.mot_de_passe;
      }

      if (employeeForm.id_user) {
        await updateEmployee(employeeForm.id_user, payload);
        fireToast('Compte employe modifie.');
      } else {
        await createEmployee({
          ...payload,
          mot_de_passe: employeeForm.mot_de_passe,
        });
        fireToast('Compte employe cree.');
      }

      setEmployeeForm(employeeFormInitial);
      await reloadEmployees();
    } catch (error) {
      fireToast(error.message);
    } finally {
      setSavingEmployee(false);
    }
  }

  async function removeEmployee(employee) {
    if (!window.confirm(`Supprimer le compte ${employee.email} ?`)) return;

    try {
      await deleteEmployee(employee.id_user);
      fireToast('Compte employe supprime.');
      await reloadEmployees();
    } catch (error) {
      fireToast(error.message);
    }
  }

  return (
    <section className="ttt-section" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28, flexWrap: 'wrap' }}>
        <span
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--green3)',
            color: 'var(--gold)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          {initial}
        </span>
        <div>
          <h1 style={{ fontWeight: 600, fontSize: 32, lineHeight: 1, margin: '0 0 4px' }}>Bonjour, {firstName}</h1>
          <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>Membre depuis {formatDate(user?.date_inscription)}</div>
        </div>
        <Badge variant="outline-gold" style={{ marginLeft: 'auto' }}>
          {roleName}
        </Badge>
        {showParticipation && (
          <Button variant="solid" onClick={() => navigate(ROUTES.play)}>
            Nouveau code
          </Button>
        )}
      </div>

      {showParticipation ? (
        <>
          <div className="ttt-auto-fit-160" style={{ marginBottom: 26 }}>
            <StatCard label="Participations" value={gains.length} foot={history ? 'tickets joues' : 'chargement...'} />
            <StatCard label="Lots gagnes" value={gains.length} foot="100 % gagnant" />
            <StatCard label="A retirer" value={pendingCount} foot="lots en attente" dark />
          </div>

          <Card style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Historique de participation
              </div>
              <Link to={ROUTES.stats} style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, textDecoration: 'none' }}>
                Voir mes statistiques
              </Link>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1.2fr 1fr .9fr',
                fontSize: 11.5,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                padding: '0 4px 10px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span>Code</span>
              <span>Lot</span>
              <span>Date</span>
              <span style={{ textAlign: 'right' }}>Statut</span>
            </div>
            {gains.length === 0 ? (
              <div style={{ padding: '18px 4px', fontSize: 13.5, color: 'var(--muted)' }}>
                {history ? 'Aucun ticket utilise pour le moment.' : 'Chargement de votre historique...'}
              </div>
            ) : (
              gains.map((row, i) => (
                <div
                  key={row.code_ticket}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1.2fr 1fr .9fr',
                    alignItems: 'center',
                    padding: '13px 4px',
                    borderBottom: i < gains.length - 1 ? '1px solid var(--border)' : 'none',
                    fontSize: 13.5,
                  }}
                >
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16 }}>{row.code_ticket}</span>
                  <span>{row.gain?.libelle}</span>
                  <span style={{ color: 'var(--muted)' }}>{formatDate(row.date_utilisation)}</span>
                  <span style={{ textAlign: 'right' }}>
                    <Badge variant={row.remis ? 'success' : 'warn'}>{row.remis ? 'Recupere' : 'A retirer'}</Badge>
                  </span>
                </div>
              ))
            )}
          </Card>
        </>
      ) : (
        <>
          <div className="ttt-auto-fit-160" style={{ marginBottom: 26 }}>
            <StatCard label="Total participations" value={staffStats.total_participations} foot="tickets joues par les clients" />
            <StatCard label="Lots gagnes" value={staffStats.lots_gagnes} foot="participations gagnantes" />
            <StatCard label="Lots retires" value={staffStats.lots_retires} foot="lots remis en boutique" dark />
          </div>

          <Card style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
                Participations clients
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                {staffPagination.total} participation{staffPagination.total > 1 ? 's' : ''} trouvee{staffPagination.total > 1 ? 's' : ''}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button variant="ghost" size="sm" disabled={!staffPagination.has_previous} onClick={() => setStaffPage((page) => Math.max(page - 1, 1))}>
                Precedent
              </Button>
              <span style={{ fontSize: 13, color: 'var(--muted)', minWidth: 74, textAlign: 'center' }}>
                {staffPagination.page} / {staffPagination.total_pages}
              </span>
              <Button variant="ghost" size="sm" disabled={!staffPagination.has_next} onClick={() => setStaffPage((page) => page + 1)}>
                Suivant
              </Button>
            </div>
          </div>

            <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 1120 }}>
              <form onSubmit={searchStaffParticipations} style={{ marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr 1fr 1fr 1.25fr .9fr .9fr .9fr 1.1fr', gap: 8, marginBottom: 10 }}>
                  <input className="ttt-table-filter" aria-label="Filtrer par code" placeholder="Code" value={staffFiltersDraft.code_ticket} onChange={(event) => updateStaffFilter('code_ticket', event.target.value)} />
                  <input className="ttt-table-filter" aria-label="Filtrer par email" placeholder="Email" value={staffFiltersDraft.email} onChange={(event) => updateStaffFilter('email', event.target.value)} />
                  <input className="ttt-table-filter" aria-label="Filtrer par nom" placeholder="Nom" value={staffFiltersDraft.nom} onChange={(event) => updateStaffFilter('nom', event.target.value)} />
                  <input className="ttt-table-filter" aria-label="Filtrer par prenom" placeholder="Prenom" value={staffFiltersDraft.prenom} onChange={(event) => updateStaffFilter('prenom', event.target.value)} />
                  <input className="ttt-table-filter" aria-label="Filtrer par lot" placeholder="Lot" value={staffFiltersDraft.gain} onChange={(event) => updateStaffFilter('gain', event.target.value)} />
                  <input className="ttt-table-filter" aria-label="Filtrer par date" type="date" value={staffFiltersDraft.date_utilisation} onChange={(event) => updateStaffFilter('date_utilisation', event.target.value)} />
                  <input className="ttt-table-filter" aria-label="Filtrer par statut" placeholder="Statut" value={staffFiltersDraft.statut} onChange={(event) => updateStaffFilter('statut', event.target.value)} />
                  <select className="ttt-table-filter" aria-label="Filtrer par remise" value={staffFiltersDraft.remis} onChange={(event) => updateStaffFilter('remis', event.target.value)}>
                    <option value="">Remise</option>
                    <option value="false">A retirer</option>
                    <option value="true">Remis</option>
                  </select>
                  <span />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                  <Button type="button" variant="ghost" size="sm" onClick={resetStaffFilters}>
                    Reinitialiser
                  </Button>
                  <Button type="submit" variant="solid" size="sm">
                    Rechercher
                  </Button>
                </div>
              </form>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr 1fr 1fr 1.25fr .9fr .9fr .9fr 1.1fr', gap: 8, fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', padding: '10px 4px', borderBottom: '1px solid var(--border)' }}>
                <span>Code</span>
                <span>Email</span>
                <span>Nom</span>
                <span>Prenom</span>
                <span>Lot</span>
                <span>Date</span>
                <span>Statut</span>
                <span>Remise</span>
                <span style={{ textAlign: 'right' }}>Action</span>
              </div>
              {staffRows.length === 0 ? (
                <div style={{ padding: '18px 4px', fontSize: 13.5, color: 'var(--muted)' }}>
                  {staffData ? 'Aucune participation trouvee.' : 'Chargement des participations...'}
                </div>
              ) : (
                staffRows.map((row) => (
                  <div key={row.id_ticket} style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr 1fr 1fr 1.25fr .9fr .9fr .9fr 1.1fr', gap: 8, alignItems: 'center', padding: '12px 4px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16 }}>{row.code_ticket}</span>
                    <span>{row.utilisateur?.email}</span>
                    <span>{row.utilisateur?.nom}</span>
                    <span>{row.utilisateur?.prenom}</span>
                    <span>{row.gain?.libelle}</span>
                    <span style={{ color: 'var(--muted)' }}>{formatDate(row.date_utilisation)}</span>
                    <span>{row.statut}</span>
                    <span>
                      <Badge variant={row.remis ? 'success' : 'warn'}>{row.remis ? 'Remis' : 'A retirer'}</Badge>
                    </span>
                    <span style={{ textAlign: 'right' }}>
                      {row.remis ? (
                        <Badge variant="success">Recupere</Badge>
                      ) : (
                        <Button variant="solid" size="sm" disabled={deliveringCode === row.code_ticket} onClick={() => deliverPrize(row)}>
                          {deliveringCode === row.code_ticket ? 'Validation...' : 'Marquer remis'}
                        </Button>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          </Card>
          {showEmployeeManagement && (
            <Card style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
                    Gestion des employes
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                    {employeePagination.total} compte{employeePagination.total > 1 ? 's' : ''} employe{employeePagination.total > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Button variant="ghost" size="sm" disabled={!employeePagination.has_previous} onClick={() => setEmployeePage((page) => Math.max(page - 1, 1))}>
                    Precedent
                  </Button>
                  <span style={{ fontSize: 13, color: 'var(--muted)', minWidth: 74, textAlign: 'center' }}>
                    {employeePagination.page} / {employeePagination.total_pages}
                  </span>
                  <Button variant="ghost" size="sm" disabled={!employeePagination.has_next} onClick={() => setEmployeePage((page) => page + 1)}>
                    Suivant
                  </Button>
                </div>
              </div>

              <form onSubmit={submitEmployee} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr 1fr .7fr .9fr auto', gap: 10, alignItems: 'end', marginBottom: 18 }}>
                <input className="ttt-table-filter" required placeholder="Nom" value={employeeForm.nom} onChange={(event) => updateEmployeeForm('nom', event.target.value)} />
                <input className="ttt-table-filter" required placeholder="Prenom" value={employeeForm.prenom} onChange={(event) => updateEmployeeForm('prenom', event.target.value)} />
                <input className="ttt-table-filter" required type="email" placeholder="Email" value={employeeForm.email} onChange={(event) => updateEmployeeForm('email', event.target.value)} />
                <input
                  className="ttt-table-filter"
                  required={!employeeForm.id_user}
                  type="password"
                  placeholder={employeeForm.id_user ? 'Nouveau mot de passe' : 'Mot de passe'}
                  value={employeeForm.mot_de_passe}
                  onChange={(event) => updateEmployeeForm('mot_de_passe', event.target.value)}
                />
                <select className="ttt-table-filter" required value={employeeForm.boutique_id} onChange={(event) => updateEmployeeForm('boutique_id', event.target.value)}>
                  <option value="" disabled>
                    Boutique
                  </option>
                  {boutiques.map((boutique) => (
                    <option key={boutique.id_boutique} value={boutique.id_boutique}>
                      {boutique.nom}
                    </option>
                  ))}
                </select>
                <select className="ttt-table-filter" value={employeeForm.statut} onChange={(event) => updateEmployeeForm('statut', event.target.value)}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="supprime">Supprime</option>
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  {employeeForm.id_user && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEmployeeForm(employeeFormInitial)}>
                      Annuler
                    </Button>
                  )}
                  <Button type="submit" variant="solid" size="sm" disabled={savingEmployee}>
                    {employeeForm.id_user ? 'Modifier' : 'Creer'}
                  </Button>
                </div>
              </form>

              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: 920 }}>
                  <form onSubmit={searchEmployees} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr 1fr .9fr auto', gap: 8, marginBottom: 10 }}>
                      <input className="ttt-table-filter" aria-label="Filtrer employe par email" placeholder="Email" value={employeeFiltersDraft.email} onChange={(event) => updateEmployeeFilter('email', event.target.value)} />
                      <input className="ttt-table-filter" aria-label="Filtrer employe par nom" placeholder="Nom" value={employeeFiltersDraft.nom} onChange={(event) => updateEmployeeFilter('nom', event.target.value)} />
                      <input className="ttt-table-filter" aria-label="Filtrer employe par prenom" placeholder="Prenom" value={employeeFiltersDraft.prenom} onChange={(event) => updateEmployeeFilter('prenom', event.target.value)} />
                      <input className="ttt-table-filter" aria-label="Filtrer employe par boutique" placeholder="Boutique" value={employeeFiltersDraft.boutique} onChange={(event) => updateEmployeeFilter('boutique', event.target.value)} />
                      <select className="ttt-table-filter" aria-label="Filtrer employe par statut" value={employeeFiltersDraft.statut} onChange={(event) => updateEmployeeFilter('statut', event.target.value)}>
                        <option value="">Statut</option>
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                        <option value="supprime">Supprime</option>
                      </select>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button type="button" variant="ghost" size="sm" onClick={resetEmployeeFilters}>
                          Reinitialiser
                        </Button>
                        <Button type="submit" variant="solid" size="sm">
                          Rechercher
                        </Button>
                      </div>
                    </div>
                  </form>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr 1fr .8fr 1.2fr', gap: 8, fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', padding: '10px 4px', borderBottom: '1px solid var(--border)' }}>
                    <span>Email</span>
                    <span>Nom</span>
                    <span>Prenom</span>
                    <span>Boutique</span>
                    <span>Statut</span>
                    <span style={{ textAlign: 'right' }}>Actions</span>
                  </div>

                  {employeeRows.length === 0 ? (
                    <div style={{ padding: '18px 4px', fontSize: 13.5, color: 'var(--muted)' }}>
                      {employeeData ? 'Aucun employe trouve.' : 'Chargement des employes...'}
                    </div>
                  ) : (
                    employeeRows.map((employee) => (
                      <div key={employee.id_user} style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr 1fr .8fr 1.2fr', gap: 8, alignItems: 'center', padding: '12px 4px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span>{employee.email}</span>
                        <span>{employee.nom}</span>
                        <span>{employee.prenom}</span>
                        <span>{employee.boutique?.nom || employee.boutique_id}</span>
                        <span>
                          <Badge variant={employee.statut === 'actif' ? 'success' : 'warn'}>{employee.statut}</Badge>
                        </span>
                        <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <Button variant="ghost" size="sm" onClick={() => editEmployee(employee)}>
                            Modifier
                          </Button>
                          <Button variant="danger" size="sm" disabled={employee.statut === 'supprime'} onClick={() => removeEmployee(employee)}>
                            Supprimer
                          </Button>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      <div className="ttt-cols-2-tight">
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Mes informations</h3>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 2 }}>
            {user?.prenom} {user?.nom}
            <br />
            {user?.email}
          </div>
        </Card>
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Confidentialite (RGPD)</h3>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Vous gardez le controle total de vos donnees.
          </p>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            Exporter mes donnees
          </Button>
        </Card>
      </div>
    </section>
  );
}
