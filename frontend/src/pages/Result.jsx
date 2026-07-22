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
              <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto 22px', display: 'grid', placeItems: 'center' }}>
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: -10,
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, transparent, rgba(196,168,78,.6), transparent 60%)',
                    animation: 'ttt-halo 3.5s linear infinite',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    width: 110,
                    height: 110,
                    borderRadius: '50%',
                    background: 'rgba(196,168,78,.14)',
                    border: '1px solid rgba(196,168,78,.5)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--gold)',
                  }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M6 9h12l-1 3a5 5 0 01-10 0z" />
                    <path d="M9 3h6l-.5 3h-5z" />
                    <path d="M8 21h8M12 15v6" />
                  </svg>
                </div>
              </div>
              <div style={{ display: 'inline-block', fontSize: 11.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--green3)', background: 'var(--gold)', padding: '5px 14px', borderRadius: 99, fontWeight: 800, marginBottom: 14 }}>
                {prize?.tier}
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,.7)' }}>Félicitations, vous avez gagné</div>
              <h1 style={{ fontWeight: 600, fontSize: 'clamp(38px,6vw,58px)', lineHeight: 1.05, margin: '6px 0 8px' }}>{prize?.name}</h1>
              <div style={{ color: 'var(--gold-soft)', fontSize: 18, fontWeight: 700 }}>{prize?.value}</div>
            </div>
          ) : (
            <div>
              <div style={{ width: 90, height: 90, margin: '0 auto 20px', borderRadius: '50%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(196,168,78,.4)', display: 'grid', placeItems: 'center', color: 'var(--gold-soft)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
                </svg>
              </div>
              <h1 style={{ fontWeight: 600, fontSize: 'clamp(34px,5vw,50px)', margin: '0 0 12px' }}>Votre lot vous attend.</h1>
              <p style={{ maxWidth: 460, margin: '0 auto 26px', fontSize: 16, color: 'rgba(255,255,255,.75)' }}>
                Lancez la roue pour découvrir votre cadeau — chaque participation est gagnante.
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
                Comment récupérer
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.9 }}>
                <li>Un e-mail de confirmation vient de vous être envoyé.</li>
                <li>Présentez le QR code en boutique, ou choisissez la livraison.</li>
                <li>Votre lot est disponible pendant 60 jours.</li>
              </ol>
            </Card>
            <div style={{ background: 'var(--green3)', borderRadius: 18, padding: 26, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ width: 120, height: 120, borderRadius: 16, background: '#fff', display: 'grid', placeItems: 'center', marginBottom: 14 }}>
                <svg width="88" height="88" viewBox="0 0 24 24" fill="var(--green3)">
                  <path d="M3 3h7v7H3zM5 5v3h3V5zM14 3h7v7h-7zM16 5v3h3V5zM3 14h7v7H3zM5 16v3h3v-3zM14 14h3v3h-3zM19 14h2v2h-2zM14 19h3v2h-3zM19 18h2v3h-2z" />
                </svg>
              </div>
              <div style={{ fontSize: 13, color: 'var(--gold-soft)' }}>Code de retrait</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, letterSpacing: '.1em' }}>TTT-9F4K-21</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="solid" onClick={() => navigate(ROUTES.profile)}>
              Voir dans mon espace
            </Button>
            <Button variant="outline-green" onClick={() => navigate(ROUTES.play)}>
              ↺ Rejouer
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
