import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes';
import { useAuth } from '../../context/useAuth';
import Button from '../ui/Button';
import logoEmblem from '../../assets/brand/logo-emblem-t.png';
import './layout.css';

const NAV_ITEMS = [
  { to: ROUTES.home, label: 'Accueil', end: true },
  { to: ROUTES.about, label: 'Le concept' },
  { to: ROUTES.stats, label: 'Statistiques' },
  { to: ROUTES.faq, label: 'FAQ' },
  { to: ROUTES.contact, label: 'Contact' },
];

function linkClass({ isActive }) {
  return `nav-link${isActive ? ' active' : ''}`;
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, signOut, user } = useAuth();

  function logout() {
    signOut();
    setOpen(false);
    navigate(ROUTES.home);
  }

  return (
    <nav className="ttt-nav">
      <NavLink to={ROUTES.home} className="ttt-nav-brand" onClick={() => setOpen(false)}>
        <img src={logoEmblem} alt="Thé Tip Top" />
        <span>Thé Tip Top</span>
      </NavLink>

      <div className="ttt-nav-links">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="ttt-nav-actions">
        {isAuthenticated ? (
          <>
            <button type="button" className="nav-link" style={{ color: 'var(--muted)', background: 'transparent', border: 'none' }} onClick={logout}>
              Deconnexion
            </button>
            <NavLink to={ROUTES.profile} title="Mon espace" className="ttt-nav-avatar">
              {(user?.prenom || user?.email || 'U').charAt(0).toUpperCase()}
            </NavLink>
          </>
        ) : (
          <NavLink to={ROUTES.auth} className="nav-link" style={{ color: 'var(--muted)' }}>
            Connexion / inscription
          </NavLink>
        )}
        <Button variant="solid" size="md" onClick={() => navigate(ROUTES.play)}>
          Participer
        </Button>
      </div>

      <button
        className="ttt-nav-burger"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div className="ttt-nav-mobile-panel">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <>
              <NavLink to={ROUTES.profile} onClick={() => setOpen(false)}>
                Mon espace
              </NavLink>
              <button type="button" onClick={logout} style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '12px 4px', color: 'var(--ink-soft)', fontWeight: 700 }}>
                Deconnexion
              </button>
            </>
          ) : (
            <NavLink to={ROUTES.auth} onClick={() => setOpen(false)}>
              Connexion / inscription
            </NavLink>
          )}
          <Button
            variant="solid"
            size="md"
            style={{ marginTop: 10 }}
            onClick={() => {
              setOpen(false);
              navigate(ROUTES.play);
            }}
          >
            Participer
          </Button>
        </div>
      )}
    </nav>
  );
}
