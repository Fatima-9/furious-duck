import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';
import { Button } from '../ui';
import { getConsent, saveConsent, OPEN_PREFERENCES_EVENT } from './cookieConsent';

const CATEGORIES = [
  {
    key: 'necessary',
    label: 'Strictement nécessaires',
    description: "Indispensables au fonctionnement du site (session, sécurité). Toujours actifs.",
    locked: true,
  },
  {
    key: 'analytics',
    label: "Mesure d'audience",
    description: "Nous aident à comprendre l'utilisation du site pour l'améliorer.",
  },
  {
    key: 'marketing',
    label: 'Marketing',
    description: 'Permettent de proposer des communications adaptées à vos préférences.',
  },
];

export default function CookieBanner() {
  // Premiere visite (aucun choix enregistre) : le bandeau s'affiche d'emblee.
  const [visible, setVisible] = useState(() => !getConsent());
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    const reopen = () => {
      const current = getConsent();
      if (current) {
        setPrefs({ analytics: current.analytics, marketing: current.marketing });
      }
      setShowPreferences(true);
      setVisible(true);
    };

    window.addEventListener(OPEN_PREFERENCES_EVENT, reopen);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, reopen);
  }, []);

  function close() {
    setVisible(false);
    setShowPreferences(false);
  }

  function acceptAll() {
    saveConsent({ analytics: true, marketing: true });
    close();
  }

  function refuseAll() {
    saveConsent({ analytics: false, marketing: false });
    close();
  }

  function saveChoices() {
    saveConsent(prefs);
    close();
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      aria-modal="false"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 1000,
        maxWidth: 640,
        margin: '0 auto',
        background: 'var(--paper)',
        border: '1px solid var(--line, rgba(0,0,0,0.12))',
        borderRadius: 16,
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        padding: '20px 22px',
        color: 'var(--ink)',
      }}
    >
      <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Nous respectons votre vie privée</h2>
      <p style={{ margin: '0 0 14px', fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink-soft)' }}>
        Le site utilise des cookies strictement nécessaires à son fonctionnement. Avec votre accord, nous utilisons
        aussi des cookies de mesure d'audience et de marketing. Vous pouvez accepter, refuser ou personnaliser vos
        choix. Plus d'informations sur la{' '}
        <Link to={`${ROUTES.legal}#lg-cookies`} style={{ color: 'var(--green)', fontWeight: 600 }}>
          page dédiée
        </Link>
        .
      </p>

      {showPreferences && (
        <div style={{ margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CATEGORIES.map((cat) => (
            <label
              key={cat.key}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                padding: '12px 14px',
                borderRadius: 11,
                background: 'var(--success-bg, rgba(0,0,0,0.03))',
                cursor: cat.locked ? 'default' : 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={cat.locked ? true : prefs[cat.key]}
                disabled={cat.locked}
                onChange={(e) => setPrefs((p) => ({ ...p, [cat.key]: e.target.checked }))}
                style={{ marginTop: 3 }}
              />
              <span>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{cat.label}</span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {cat.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Button variant="solid" size="sm" onClick={acceptAll} style={{ flex: '1 1 auto' }}>
          Tout accepter
        </Button>
        <Button variant="outline-green" size="sm" onClick={refuseAll} style={{ flex: '1 1 auto' }}>
          Tout refuser
        </Button>
        {showPreferences ? (
          <Button variant="ghost" size="sm" onClick={saveChoices} style={{ flex: '1 1 auto' }}>
            Enregistrer mes choix
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setShowPreferences(true)} style={{ flex: '1 1 auto' }}>
            Personnaliser
          </Button>
        )}
      </div>
    </div>
  );
}
