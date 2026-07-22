import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes';
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
        <NavLink to={ROUTES.auth} className="nav-link" style={{ color: 'var(--muted)' }}>
          Connexion
        </NavLink>
        <NavLink to={ROUTES.profile} title="Mon espace" className="ttt-nav-avatar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </NavLink>
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
          <NavLink to={ROUTES.auth} onClick={() => setOpen(false)}>
            Connexion
          </NavLink>
          <NavLink to={ROUTES.profile} onClick={() => setOpen(false)}>
            Mon espace
          </NavLink>
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
