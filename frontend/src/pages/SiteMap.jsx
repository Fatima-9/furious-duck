import { Link } from 'react-router-dom';
import { ROUTES } from '../routes';

const SECTIONS = [
  {
    title: 'Découvrir le jeu',
    description: 'Les pages publiques pour comprendre le concours et ses conditions.',
    links: [
      ['Accueil', ROUTES.home, 'Présentation du jeu-concours et accès rapide à la participation.'],
      ['Le concept', ROUTES.about, 'Fonctionnement, lots, calendrier et règlement du jeu.'],
      ['FAQ', ROUTES.faq, 'Réponses aux questions fréquentes.'],
      ['Contact', ROUTES.contact, 'Formulaire de contact et demande d’assistance.'],
    ],
  },
  {
    title: 'Participer',
    description: 'Les pages liées au compte, aux tickets et au suivi des gains.',
    links: [
      ['Connexion / inscription', ROUTES.auth, 'Créer un compte ou se connecter.'],
      ['Mot de passe oublié', ROUTES.forgotPassword, 'Recevoir un lien de réinitialisation.'],
      ['Participer', ROUTES.play, 'Tester un code ticket et découvrir son gain.'],
      ['Mon espace', ROUTES.profile, 'Modifier son profil, voir ses lots et gérer son compte.'],
      ['Mes statistiques', ROUTES.stats, 'Suivre ses participations et résultats.'],
    ],
  },
  {
    title: 'Informations légales',
    description: 'Les pages de transparence, confidentialité et navigation.',
    links: [
      ['Mentions légales', `${ROUTES.legal}#lg-mentions`, 'Éditeur, hébergement et responsabilité.'],
      ['Conditions d’utilisation', `${ROUTES.legal}#lg-cgu`, 'Règles d’accès et d’utilisation du service.'],
      ['Confidentialité', `${ROUTES.legal}#lg-rgpd`, 'Données personnelles, droits RGPD et destinataires.'],
      ['Cookies & Analytics', `${ROUTES.legal}#lg-cookies`, 'Google Analytics, consentement et durée de conservation.'],
      ['Plan du site', ROUTES.siteMap, 'Vue d’ensemble des pages disponibles.'],
    ],
  },
];

export default function SiteMap() {
  return (
    <section className="ttt-section ttt-section--narrow" style={{ paddingTop: 70, paddingBottom: 90 }}>
      <div className="ttt-eyebrow">Navigation</div>
      <h1 style={{ fontWeight: 600, fontSize: 'clamp(34px,5vw,52px)', margin: '0 0 18px' }}>Plan du site.</h1>
      <p style={{ margin: '0 0 34px', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 720 }}>
        Retrouvez les pages principales du jeu-concours The Tip Top, regroupées par usage pour accéder rapidement aux
        informations utiles.
      </p>

      <div className="ttt-sitemap-groups">
        {SECTIONS.map((section) => (
          <section key={section.title} className="ttt-sitemap-group" aria-labelledby={`sitemap-${section.title}`}>
            <div>
              <h2 id={`sitemap-${section.title}`}>{section.title}</h2>
              <p>{section.description}</p>
            </div>
            <div className="ttt-sitemap-links">
              {section.links.map(([label, path, description]) => (
                <Link key={`${section.title}-${path}-${label}`} to={path} className="ttt-sitemap-link">
                  <span>{label}</span>
                  <small>{description}</small>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
