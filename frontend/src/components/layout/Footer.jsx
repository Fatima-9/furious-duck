import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';
import { openCookiePreferences } from '../cookies/cookieConsent';
import logoEmblemLight from '../../assets/brand/logo-emblem-light.png';
import './layout.css';

export default function Footer() {
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
