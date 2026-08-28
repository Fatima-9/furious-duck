import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';
import { subscribeNewsletter } from '../../services/api';
import { openCookiePreferences } from '../cookies/cookieConsent';
import logoEmblemLight from '../../assets/brand/logo-emblem-light.png';
import './layout.css';

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
            Maison de the bio. Jeu-concours 100 % gagnant pour celebrer l'ouverture de nos 60 boutiques.
          </p>
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
          <div className="ttt-footer-links" style={{ marginTop: 16 }}>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook</a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>
        <div>
          <div className="ttt-footer-heading">Légal</div>
          <div className="ttt-footer-links">
            <Link to={`${ROUTES.legal}#lg-reglement`}>Règlement du jeu</Link>
            <Link to={`${ROUTES.legal}#lg-mentions`}>Mentions légales</Link>
            <Link to={`${ROUTES.legal}#lg-rgpd`}>Confidentialité (RGPD)</Link>
            <Link to={`${ROUTES.legal}#lg-cookies`}>Cookies</Link>
            <button type="button" className="ttt-footer-linkbtn" onClick={openCookiePreferences}>
              Gérer les cookies
            </button>
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
