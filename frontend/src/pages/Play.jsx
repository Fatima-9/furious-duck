import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useAuth } from '../context/useAuth';
import { useGame } from '../context/useGame';
import Button from '../components/ui/Button';
import PrizeWheel from '../components/wheel/PrizeWheel';
import { canParticipate, getRoleDisplayName } from '../utils/roles';

function Step({ state, label, num }) {
  const done = state === 'done';
  const active = state === 'active';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flex: '0 0 auto' }}>
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          fontSize: 13,
          background: done || active ? 'var(--green)' : 'var(--paper2)',
          color: done || active ? '#fff' : 'var(--muted)',
          border: active || done ? 'none' : '1.5px solid var(--border-strong)',
          boxShadow: active ? '0 0 0 4px var(--success-bg)' : 'none',
        }}
      >
        {done ? 'OK' : num}
      </span>
      <span style={{ fontSize: 11, color: active ? 'var(--ink)' : 'var(--muted)', fontWeight: active ? 700 : 400 }}>{label}</span>
    </div>
  );
}

export default function Play() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { code, setCode, codeHasValidFormat, codeValid, ticketCheck, isSpinning, hasWon, prize, resetDraw } = useGame();
  const userCanParticipate = isAuthenticated && canParticipate(user);

  if (isAuthenticated && !userCanParticipate) {
    return (
      <section className="ttt-section" style={{ paddingTop: 80, paddingBottom: 120, textAlign: 'center' }}>
        <div className="ttt-eyebrow">Acces reserve aux clients</div>
        <h1 style={{ fontWeight: 600, fontSize: 'clamp(32px,4.5vw,52px)', margin: '0 0 16px' }}>
          Ce compte ne peut pas participer au jeu.
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto 24px', color: 'var(--muted)', lineHeight: 1.7 }}>
          Vous etes connecte avec un compte {getRoleDisplayName(user).toLowerCase()}. Seuls les comptes clients peuvent saisir un code et tenter leur chance.
        </p>
        <Button variant="solid" onClick={() => navigate(ROUTES.profile)}>
          Retourner a mon espace
        </Button>
      </section>
    );
  }

  return (
    <section className="ttt-section" style={{ paddingTop: 56, paddingBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', maxWidth: 560, margin: '0 auto 44px' }}>
        <Step state="done" label="Compte" num="1" />
        <div style={{ height: 2, flex: 1, background: 'var(--green)', margin: '0 6px 22px' }} />
        <Step state="active" label="Tirage" num="2" />
        <div style={{ height: 2, flex: 1, background: 'var(--border-strong)', margin: '0 6px 22px' }} />
        <Step state="idle" label="Lot" num="3" />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 34 }}>
        <div className="ttt-eyebrow">Votre tirage</div>
        <h1 style={{ fontWeight: 600, fontSize: 'clamp(32px,4.5vw,52px)', margin: 0 }}>La roue des lots.</h1>
      </div>

      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 26,
          padding: '52px 36px',
          background: 'radial-gradient(130% 130% at 12% -15%, #1d4029 0%, #0d2213 52%, #081810 100%)',
        }}
      >
        <div
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, opacity: 0.55, background: 'radial-gradient(52% 62% at 42% 46%, rgba(196,168,78,.18), transparent 70%)' }}
        />
        <div className="ttt-grain" style={{ opacity: 0.6 }} />
        <div className="ttt-wheel-stage" style={{ position: 'relative' }}>
          <PrizeWheel />

          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 410, minWidth: 270, color: '#fff' }}>
            {hasWon ? (
              <div style={{ position: 'relative', animation: 'ttt-scalein .5s cubic-bezier(.2,.8,.2,1) both' }}>
                <div style={{ display: 'inline-block', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--green3)', background: 'var(--gold)', padding: '5px 14px', borderRadius: 99, fontWeight: 800, marginBottom: 14 }}>
                  {prize?.tier}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,.62)' }}>Felicitations, vous avez gagne</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(34px,5vw,50px)', color: '#fff', lineHeight: 1.04, margin: '6px 0 8px' }}>
                  {prize?.name}
                </div>
                <div style={{ color: 'var(--gold-soft)', fontSize: 17, fontWeight: 700, marginBottom: 26 }}>{prize?.value}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Button variant="gold" onClick={() => navigate(ROUTES.result)}>
                    Voir mon lot
                  </Button>
                  <Button variant="outline-light" onClick={resetDraw}>
                    Rejouer
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ animation: 'ttt-fadeup .5s both' }}>
                <div style={{ fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold-soft)', marginBottom: 14 }}>
                  Votre code de participation
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'rgba(255,255,255,.06)',
                    border: '1.5px solid rgba(196,168,78,.4)',
                    borderRadius: 13,
                    padding: '12px 16px',
                    marginBottom: 8,
                  }}
                >
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="AB12CD34EF"
                    maxLength={10}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: '#fff',
                      fontFamily: "'Cormorant Garamond',serif",
                      fontSize: 23,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                    }}
                  />
                  {ticketCheck.status === 'checking' && <span style={{ color: 'var(--gold)', fontWeight: 800 }}>...</span>}
                  {ticketCheck.status === 'valid' && <span style={{ color: 'var(--gold)', fontWeight: 800 }}>OK</span>}
                </div>
                <div style={{ minHeight: 20, fontSize: 12.5, marginBottom: 18 }}>
                  {!codeHasValidFormat && code && <span style={{ color: 'var(--gold-soft)', fontWeight: 700 }}>Le code doit contenir 10 caracteres.</span>}
                  {ticketCheck.status === 'checking' && <span style={{ color: 'var(--gold-soft)', fontWeight: 700 }}>Verification du code en base...</span>}
                  {ticketCheck.status === 'invalid' && <span style={{ color: '#F4A6A6', fontWeight: 700 }}>{ticketCheck.message}</span>}
                  {codeValid && <span style={{ color: '#8FCBA6', fontWeight: 700 }}>{ticketCheck.message}</span>}
                </div>
                {!isAuthenticated && (
                  <p style={{ margin: '0 0 12px', fontSize: 13.5, color: 'var(--gold-soft)', lineHeight: 1.6 }}>
                    Connectez-vous avant de lancer la roue.
                  </p>
                )}
                <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.6 }}>
                  Le tirage est realise cote serveur. Resultat instantane, 100 % gagnant.
                </p>
                <div style={{ minHeight: 22, marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--gold-soft)', fontWeight: 700 }}>
                  {isSpinning && <span>Verification du ticket et tirage...</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--muted)', margin: '20px 0 60px' }}>
        Besoin d'aide ? Consultez la{' '}
        <a onClick={() => navigate(ROUTES.faq)} style={{ color: 'var(--green)', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
          FAQ
        </a>{' '}
        ou le{' '}
        <a onClick={() => navigate(ROUTES.legal)} style={{ color: 'var(--green)', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
          reglement
        </a>
        .
      </p>
    </section>
  );
}
