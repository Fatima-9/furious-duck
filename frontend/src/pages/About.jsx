import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import FaqItem from '../components/ui/FaqItem';

export default function About() {
  const navigate = useNavigate();

  return (
    <div>
      <section className="ttt-hero-dark" style={{ background: 'radial-gradient(120% 100% at 20% 0%, #21462C, #132C19)' }}>
        <div className="ttt-grain" />
        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', padding: '88px 40px', textAlign: 'center' }}>
          <div className="ttt-eyebrow" style={{ color: 'var(--gold-soft)' }}>
            Notre maison
          </div>
          <h1 style={{ fontWeight: 600, fontSize: 'clamp(38px,5.5vw,66px)', lineHeight: 1.05, margin: 0 }}>
            Le thé bio, célébré comme il se doit.
          </h1>
          <p style={{ maxWidth: 620, margin: '22px auto 0', fontSize: 18, lineHeight: 1.65, color: 'rgba(255,255,255,.82)' }}>
            Thé Tip Top ouvre 60 boutiques à travers la France. Pour partager ce moment, nous offrons un lot à chaque
            participant — une façon simple de vous remercier et de vous faire découvrir nos infusions.
          </p>
        </div>
      </section>

      <section className="ttt-section ttt-section--narrow" style={{ paddingTop: 80, paddingBottom: 20 }}>
        <div className="ttt-cols-2">
          <div>
            <div className="ttt-eyebrow">Notre engagement</div>
            <h2 style={{ fontWeight: 600, fontSize: 38, lineHeight: 1.1, margin: '0 0 18px' }}>Une tasse qui a du sens.</h2>
            <p style={{ fontSize: 15.5, color: 'var(--ink-soft)', lineHeight: 1.75, margin: '0 0 16px' }}>
              Chaque thé Tip Top est certifié biologique, cultivé sans pesticides et assemblé dans notre atelier
              français. Nous travaillons en direct avec des jardins engagés, pour une traçabilité totale de la feuille
              à la tasse.
            </p>
            <p style={{ fontSize: 15.5, color: 'var(--ink-soft)', lineHeight: 1.75, margin: 0 }}>
              Le jeu-concours prolonge cette promesse : transparent, sans obligation d'achat, et pensé pour le plaisir
              avant tout.
            </p>
          </div>
          <div
            style={{
              aspectRatio: '4/3',
              borderRadius: 22,
              background: 'linear-gradient(140deg,#EEF0EA,#DCE4D8)',
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--green)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(rgba(43,88,57,.05) 1px, transparent 1.4px)',
                backgroundSize: '14px 14px',
              }}
            />
            <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ position: 'relative' }}>
              <path d="M12 3c-3 5-6 6-6 10a6 6 0 0012 0c0-4-3-5-6-10z" />
              <path d="M12 8v9" />
            </svg>
          </div>
        </div>
      </section>

      <section className="ttt-section">
        <div className="ttt-auto-fit-240">
          <Card>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, color: 'var(--gold)' }}>60</div>
            <h3 style={{ margin: '6px 0 6px', fontSize: 16 }}>boutiques</h3>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>Un réseau national, du producteur à votre quartier.</p>
          </Card>
          <Card>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, color: 'var(--gold)' }}>100 %</div>
            <h3 style={{ margin: '6px 0 6px', fontSize: 16 }}>bio certifié</h3>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>Label AB & Ecocert sur l'ensemble de la gamme.</p>
          </Card>
          <Card>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, color: 'var(--gold)' }}>1 lot</div>
            <h3 style={{ margin: '6px 0 6px', fontSize: 16 }}>par participation</h3>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>Sans exception, et sans obligation d'achat.</p>
          </Card>
        </div>
      </section>

      <section className="ttt-section ttt-section--tight" style={{ paddingTop: 20, paddingBottom: 80 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="ttt-eyebrow">Le jeu en bref</div>
          <h2 style={{ fontWeight: 600, fontSize: 34, margin: 0 }}>Les règles essentielles.</h2>
        </div>
        <FaqItem question="Qui peut participer ?">
          Toute personne majeure résidant en France métropolitaine, dans la limite d'une participation par code.
        </FaqItem>
        <FaqItem question="Où trouver mon code ?">
          Sur votre ticket de caisse en boutique, ou à l'intérieur de chaque boîte de thé Tip Top.
        </FaqItem>
        <FaqItem question="Jusqu'à quand ?">
          L'opération se déroule du 1ᵉʳ mars au 30 septembre 2026. Les lots sont à retirer sous 60 jours.
        </FaqItem>
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Button variant="solid" size="lg" style={{ padding: '15px 30px', fontSize: 15 }} onClick={() => navigate(ROUTES.play)}>
            Je participe maintenant
          </Button>
        </div>
      </section>
    </div>
  );
}
