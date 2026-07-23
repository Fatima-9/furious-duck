import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useGame } from '../context/useGame';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function Result() {
  const navigate = useNavigate();
  const { hasWon, prize } = useGame();

  return (
    <div>
      <section className="ttt-hero-dark" style={{ background: 'radial-gradient(120% 100% at 50% -10%, #21462C, #132C19)' }}>
        <div className="ttt-grain" />
        <div style={{ position: 'relative', maxWidth: 780, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
          {hasWon ? (
            <div style={{ animation: 'ttt-scalein .55s cubic-bezier(.2,.8,.2,1) both' }}>
              <div style={{ display: 'inline-block', fontSize: 11.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--green3)', background: 'var(--gold)', padding: '5px 14px', borderRadius: 99, fontWeight: 800, marginBottom: 14 }}>
                {prize?.tier}
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,.7)' }}>Felicitations, vous avez gagne</div>
              <h1 style={{ fontWeight: 600, fontSize: 'clamp(38px,6vw,58px)', lineHeight: 1.05, margin: '6px 0 8px' }}>{prize?.name}</h1>
              <div style={{ color: 'var(--gold-soft)', fontSize: 18, fontWeight: 700 }}>{prize?.value}</div>
            </div>
          ) : (
            <div>
              <h1 style={{ fontWeight: 600, fontSize: 'clamp(34px,5vw,50px)', margin: '0 0 12px' }}>Votre lot vous attend.</h1>
              <p style={{ maxWidth: 460, margin: '0 auto 26px', fontSize: 16, color: 'rgba(255,255,255,.75)' }}>
                Lancez la roue pour decouvrir votre cadeau.
              </p>
              <Button variant="gold" onClick={() => navigate(ROUTES.play)}>
                Tourner la roue
              </Button>
            </div>
          )}
        </div>
      </section>

      {hasWon && (
        <section className="ttt-section ttt-section--narrow" style={{ paddingTop: 56, paddingBottom: 80 }}>
          <div className="ttt-cols-2-tight" style={{ marginBottom: 26 }}>
            <Card>
              <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
                Comment recuperer
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.9 }}>
                <li>Presentez ce code ticket en boutique.</li>
                <li>Un employe verifiera que le lot n'a pas deja ete remis.</li>
                <li>Votre historique est disponible dans votre espace.</li>
              </ol>
            </Card>
            <div style={{ background: 'var(--green3)', borderRadius: 18, padding: 26, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--gold-soft)' }}>Code ticket</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, letterSpacing: '.1em' }}>{prize?.ticket?.code_ticket}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="solid" onClick={() => navigate(ROUTES.profile)}>
              Voir dans mon espace
            </Button>
            <Button variant="outline-green" onClick={() => navigate(ROUTES.play)}>
              Rejouer
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
