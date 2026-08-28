import { Link } from 'react-router-dom';
import { ROUTES } from '../routes';
import Card from '../components/ui/Card';

const LINKS = [
  ['Accueil', ROUTES.home],
  ['Le concept', ROUTES.about],
  ['Participer', ROUTES.play],
  ['Mes statistiques', ROUTES.stats],
  ['FAQ', ROUTES.faq],
  ['Contact', ROUTES.contact],
  ['Connexion / inscription', ROUTES.auth],
  ['Mon espace', ROUTES.profile],
  ['Mentions legales', ROUTES.legal],
];

export default function SiteMap() {
  return (
    <section className="ttt-section ttt-section--narrow" style={{ paddingTop: 70, paddingBottom: 90 }}>
      <div className="ttt-eyebrow">Navigation</div>
      <h1 style={{ fontWeight: 600, fontSize: 'clamp(34px,5vw,52px)', margin: '0 0 18px' }}>Plan du site.</h1>
      <p style={{ margin: '0 0 28px', color: 'var(--muted)', lineHeight: 1.7 }}>
        Retrouvez rapidement les principales pages du jeu-concours The Tip Top.
      </p>
      <Card>
        <div style={{ display: 'grid', gap: 12 }}>
          {LINKS.map(([label, path]) => (
            <Link key={path} to={path} style={{ color: 'var(--green)', fontWeight: 700, textDecoration: 'none' }}>
              {label}
            </Link>
          ))}
        </div>
      </Card>
    </section>
  );
}
