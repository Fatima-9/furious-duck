import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import Button from '../components/ui/Button';

export default function ServerError() {
  const navigate = useNavigate();

  return (
    <section className="ttt-section ttt-section--narrow" style={{ paddingTop: 90, paddingBottom: 120, textAlign: 'center' }}>
      <div className="ttt-eyebrow">Erreur 500</div>
      <h1 style={{ fontWeight: 600, fontSize: 'clamp(38px,6vw,62px)', margin: '0 0 14px' }}>
        Une erreur est survenue.
      </h1>
      <p style={{ maxWidth: 560, margin: '0 auto 28px', color: 'var(--muted)', lineHeight: 1.7 }}>
        Le service rencontre un probleme temporaire. Vous pouvez revenir a l'accueil et reessayer.
      </p>
      <Button variant="solid" onClick={() => navigate(ROUTES.home)}>
        Retour a l'accueil
      </Button>
    </section>
  );
}
