import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';
import { Button } from '../ui';
import { getConsent, saveConsent, OPEN_PREFERENCES_EVENT } from './cookieConsent';

const CATEGORIES = [
  {
    key: 'necessary',
    label: 'Strictement nécessaires',
    provider: 'Thé Tip Top',
    description: "Assurent le fonctionnement, la sécurité et la mémorisation de vos choix.",
    details: 'Données : préférence de consentement. Conservation : 6 mois maximum.',
    locked: true,
  },
  {
    key: 'analytics',
    label: "Mesure d'audience",
    provider: 'Google Analytics 4',
    description: "Mesure les visites, les parcours et les performances afin d'améliorer le site.",
    details: 'Données : identifiant, pages consultées, appareil et localisation approximative. Cookies _ga : jusqu’à 2 ans.',
  },
  {
    key: 'marketing',
    label: 'Personnalisation et marketing',
    provider: 'Thé Tip Top / partenaires déclarés',
    description: 'Permet de personnaliser les communications et de mesurer les campagnes lorsque ces services sont utilisés.',
    details: 'Aucun traceur marketing tiers n’est actuellement déclaré. Cette catégorie reste désactivée par défaut.',
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
    <aside
      role="dialog"
      aria-label="Gestion des cookies"
      aria-modal="false"
      aria-describedby="cookie-banner-description"
      className={`ttt-cookie-banner${showPreferences ? ' is-expanded' : ''}`}
    >
      <div className="ttt-cookie-copy">
        <h2>Vos choix en matière de cookies</h2>
        <p id="cookie-banner-description">
          Nous utilisons uniquement les éléments nécessaires par défaut. Google Analytics et les outils marketing
          restent bloqués sans votre accord. Accepter ou refuser est sans effet sur l’accès au site.{' '}
          <Link to={`${ROUTES.legal}#lg-cookies`}>En savoir plus</Link>.
        </p>
      </div>

      {showPreferences && (
        <div className="ttt-cookie-preferences" aria-label="Préférences par finalité">
          <p className="ttt-cookie-preferences-intro">
            Choisissez chaque finalité séparément. Les options facultatives sont refusées tant que vous ne les activez
            pas. Vous pourrez revenir sur votre décision à tout moment depuis le pied de page.
          </p>
          {CATEGORIES.map((cat) => {
            const enabled = cat.locked || prefs[cat.key];
            return (
              <article key={cat.key} className="ttt-cookie-category">
                <div className="ttt-cookie-category-heading">
                  <div>
                    <h3>{cat.label}</h3>
                    <span className="ttt-cookie-provider">Fournisseur : {cat.provider}</span>
                  </div>
                  <label className="ttt-cookie-switch">
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={cat.locked}
                      onChange={(event) => setPrefs((current) => ({ ...current, [cat.key]: event.target.checked }))}
                    />
                    <span aria-hidden="true" />
                    <span className="ttt-cookie-switch-label">{cat.locked ? 'Toujours actif' : enabled ? 'Accepté' : 'Refusé'}</span>
                  </label>
                </div>
                <p>{cat.description}</p>
                <p className="ttt-cookie-details">{cat.details}</p>
              </article>
            );
          })}
        </div>
      )}

      <div className="ttt-cookie-actions">
        <Button variant="solid" size="sm" onClick={acceptAll}>
          Tout accepter
        </Button>
        <Button variant="outline-green" size="sm" onClick={refuseAll}>
          Tout refuser
        </Button>
        {showPreferences ? (
          <Button variant="ghost" size="sm" onClick={saveChoices}>
            Enregistrer mes choix
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setShowPreferences(true)}>
            Personnaliser
          </Button>
        )}
      </div>
    </aside>
  );
}
