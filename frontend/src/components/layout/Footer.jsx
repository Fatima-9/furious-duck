import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';
import { subscribeNewsletter } from '../../services/api';
import { openCookiePreferences } from '../cookies/cookieConsent';
import logoEmblemLight from '../../assets/brand/logo-emblem-light.png';
import './layout.css';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 8.2h2.2V4.5A25 25 0 0 0 13 4.3c-3.2 0-5.4 2-5.4 5.6V13H4v4.1h3.6V22h4.3v-4.9h3.4L16 13h-4.1v-2.7c0-1.2.3-2.1 2.1-2.1Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.2 8.8h4V21h-4V8.8ZM7.2 3a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6ZM11.5 8.8h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.8c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V21h-4V8.8Z" />
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submitNewsletter(event) {
    event.preventDefault();
    setSubmitting(true);
    setNewsletterMessage('');

    try {
      await subscribeNewsletter(email);
      setEmail('');
      setNewsletterMessage('Inscription confirmee.');
    } catch (error) {
      setNewsletterMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer className="ttt-footer">
      <div className="ttt-footer-grid">
        <div>
          <div className="ttt-footer-brand">
            <img src={logoEmblemLight} alt="The Tip Top" />
            <span>The Tip Top</span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, maxWidth: 280 }}>
            Maison de the bio. Jeu-concours 100 % gagnant pour celebrer l'ouverture de nos 10 boutiques.
          </p>
          <div className="ttt-social-icons" aria-label="Reseaux sociaux">
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">
              <FacebookIcon />
            </a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <LinkedInIcon />
            </a>
          </div>
        </div>
        <div>
          <div className="ttt-footer-heading">Le jeu</div>
          <div className="ttt-footer-links">
            <Link to={ROUTES.play}>Participer</Link>
            <Link to={ROUTES.about}>Le concept</Link>
            <Link to={ROUTES.stats}>Mes statistiques</Link>
            <Link to={ROUTES.faq}>FAQ</Link>
          </div>
        </div>
        <div>
          <div className="ttt-footer-heading">Aide</div>
          <div className="ttt-footer-links">
            <Link to={ROUTES.contact}>Contact</Link>
            <Link to={ROUTES.profile}>Mon espace</Link>
            <Link to={ROUTES.auth}>Connexion / inscription</Link>
            <Link to={ROUTES.siteMap}>Plan du site</Link>
          </div>
        </div>
        <div className="ttt-footer-stack">
          <div>
            <div className="ttt-footer-heading">Légal</div>
            <div className="ttt-footer-links">
              <Link to={`${ROUTES.legal}#lg-mentions`}>Mentions légales</Link>
              <Link to={`${ROUTES.legal}#lg-cgu`}>CGU</Link>
              <Link to={`${ROUTES.legal}#lg-rgpd`}>Confidentialité (RGPD)</Link>
              <Link to={`${ROUTES.legal}#lg-cookies`}>Cookies</Link>
              <button type="button" className="ttt-footer-linkbtn" onClick={openCookiePreferences}>
                Gérer les cookies
              </button>
            </div>
          </div>
          <div>
            <div className="ttt-footer-heading">Newsletter</div>
            <form onSubmit={submitNewsletter} style={{ display: 'grid', gap: 10 }}>
              <input
                required
                type="email"
                placeholder="votre@email.fr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid rgba(255,255,255,.18)',
                  borderRadius: 10,
                  padding: '11px 12px',
                  background: 'rgba(255,255,255,.08)',
                  color: '#fff',
                }}
              />
              <button type="submit" className="ttt-footer-linkbtn" disabled={submitting} style={{ textAlign: 'left' }}>
                {submitting ? 'Inscription...' : "S'inscrire"}
              </button>
              {newsletterMessage && <span style={{ fontSize: 12.5, color: 'var(--gold-soft)' }}>{newsletterMessage}</span>}
            </form>
          </div>
        </div>
      </div>
      <div className="ttt-footer-bottom">
        <span>2026 The Tip Top - Tous droits reserves.</span>
        <span>Jeu sans obligation d'achat - Bio - Fabrique en France</span>
      </div>
    </footer>
  );
}
