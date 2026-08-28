import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ContestCountdown from '../components/contest/ContestCountdown';
import DecorativeWheel from '../components/wheel/DecorativeWheel';
import { trackParticipationClick } from '../utils/analytics';

const STEPS = [
  {
    num: '01',
    title: 'Créez votre compte',
    text: 'Un e-mail, un mot de passe, et le tour est joué. Vos données restent protégées.',
    bg: 'var(--success-bg)',
    color: 'var(--green)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M4 8l8 5 8-5" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Saisissez votre code',
    text: 'Le code figure sur votre ticket de caisse ou votre boîte de thé Tip Top.',
    bg: 'var(--warn-bg)',
    color: 'var(--warn)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M7 9h4M7 13h10M7 17h7" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Tournez & gagnez',
    text: "La roue s'élance, ralentit… et révèle votre lot. Toujours gagnant, sans exception.",
    bg: '#F5EAD9',
    color: 'var(--gold)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      </svg>
    ),
  },
];

const LOTS = [
  {
    tag: 'Participation',
    tagColor: 'var(--muted)',
    title: 'Infuseur à thé',
    sub: 'Cadeau de bienvenue',
    bg: 'linear-gradient(135deg,#EEF0EA,#E3E6DA)',
    color: 'var(--green)',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 3c-3 5-6 6-6 10a6 6 0 0012 0c0-4-3-5-6-10z" />
      </svg>
    ),
  },
  {
    tag: 'Standard',
    tagColor: 'var(--muted)',
    title: 'Thé détox',
    sub: 'Valeur 39 €',
    bg: 'linear-gradient(135deg,#E7EFE9,#D8E5DC)',
    color: 'var(--green)',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="4" y="7" width="16" height="13" rx="2" />
        <path d="M4 10h16M9 7V4h6v3" />
      </svg>
    ),
  },
  {
    tag: 'Standard',
    tagColor: 'var(--muted)',
    title: 'Coffret découverte',
    sub: 'Valeur 39 €',
    bg: 'linear-gradient(135deg,#E7EFE9,#D8E5DC)',
    color: 'var(--green)',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="4" y="6" width="16" height="14" rx="2" />
        <path d="M4 11h16M12 6v14" />
      </svg>
    ),
  },
  {
    tag: 'Premium',
    tagColor: 'var(--gold)',
    title: 'Boîte signature',
    sub: 'Valeur 69 €',
    bg: 'linear-gradient(135deg,#F0E7CF,#E7D9AE)',
    color: '#9A7E28',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M6 9h12l-1 3a5 5 0 01-10 0z" />
        <path d="M9 3h6l-.5 3h-5z" />
        <path d="M8 21h8M12 15v6" />
      </svg>
    ),
  },
];

const REASSURANCE = [
  {
    title: 'Données protégées',
    text: 'Conformité RGPD, aucune revente, désinscription en un clic.',
    bg: 'var(--success-bg)',
    color: 'var(--success)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: '100 % bio',
    text: 'Des thés certifiés, cultivés sans pesticides, fabriqués en France.',
    bg: '#EEF0EA',
    color: 'var(--green)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3c-3 5-6 6-6 10a6 6 0 0012 0c0-4-3-5-6-10z" />
      </svg>
    ),
  },
  {
    title: 'Toujours gagnant',
    text: "Chaque participation donne un lot. Sans obligation d'achat.",
    bg: '#F5EAD9',
    color: 'var(--gold)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l2.5 2.5L16 9" />
      </svg>
    ),
  },
];

export default function Home() {
  const navigate = useNavigate();

  function goToPlay(label) {
    trackParticipationClick(label);
    navigate(ROUTES.play);
  }

  return (
    <div>
      {/* HERO */}
      <section
        className="ttt-hero-dark"
        style={{ background: 'radial-gradient(120% 90% at 82% 8%, #21462C 0%, #132C19 62%)' }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.5,
            background: 'radial-gradient(50% 50% at 88% 30%, rgba(196,168,78,.22), transparent 70%)',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -120,
            top: -90,
            width: 440,
            height: 440,
            border: '1.5px dashed rgba(196,168,78,.4)',
            borderRadius: '50%',
            animation: 'ttt-spin 70s linear infinite',
          }}
        />
        <div className="ttt-grain" />
        <div
          className="ttt-hero-grid"
          style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '96px 40px 100px' }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 15px',
                border: '1px solid rgba(196,168,78,.45)',
                borderRadius: 999,
                fontSize: 11.5,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: 'var(--gold-soft)',
                animation: 'ttt-fadeup .6s .05s both',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  boxShadow: '0 0 0 4px rgba(196,168,78,.18)',
                }}
              />
              Jeu-concours · 100 % gagnant
            </div>
            <h1
              style={{
                fontWeight: 600,
                fontSize: 'clamp(44px,6vw,80px)',
                lineHeight: 1.03,
                margin: '24px 0 0',
                letterSpacing: '-.01em',
                animation: 'ttt-fadeup .7s .12s both',
              }}
            >
              Tournez la roue,
              <br />
              <span style={{ fontStyle: 'italic', color: 'var(--gold-soft)' }}>savourez la victoire.</span>
            </h1>
            <p
              style={{
                maxWidth: 520,
                fontSize: 18,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,.82)',
                margin: '24px 0 0',
                animation: 'ttt-fadeup .7s .2s both',
              }}
            >
              Pour fêter l'ouverture de nos 10 boutiques bio, chaque code gagne un lot. Un infuseur, un coffret, une
              boîte signature… et un tirage au sort final permet de gagner un an de thé offert.
            </p>
            <div
              style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 36, animation: 'ttt-fadeup .7s .28s both' }}
            >
              <Button variant="gold" size="lg" onClick={() => goToPlay('home_hero')}>
                ✦ Tenter ma chance
              </Button>
              <Button variant="outline-light" size="lg" style={{ padding: '16px 26px', fontSize: 15 }} onClick={() => navigate(ROUTES.about)}>
                Comment ça marche
              </Button>
            </div>
          </div>
          <DecorativeWheel />
        </div>
      </section>

      <ContestCountdown />

      {/* ÉTAPES */}
      <section className="ttt-section" style={{ paddingTop: 90, paddingBottom: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="ttt-eyebrow">Jouer en 3 étapes</div>
          <h2 style={{ fontWeight: 600, fontSize: 'clamp(30px,4vw,46px)', margin: 0 }}>Simple comme une tasse de thé.</h2>
        </div>
        <div className="ttt-grid-3">
          {STEPS.map((s) => (
            <div key={s.num} style={{ textAlign: 'center', padding: '34px 26px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 }}>
              <div style={{ width: 56, height: 56, margin: '0 auto 18px', borderRadius: 16, background: s.bg, color: s.color, display: 'grid', placeItems: 'center' }}>
                {s.icon}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: 'var(--gold)', marginBottom: 6 }}>{s.num}</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{s.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LOTS */}
      <section className="ttt-section" style={{ paddingTop: 56, paddingBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
          <div>
            <div className="ttt-eyebrow">La dotation</div>
            <h2 style={{ fontWeight: 600, fontSize: 'clamp(30px,4vw,46px)', margin: 0 }}>Cinq façons de se faire plaisir.</h2>
          </div>
          <Button variant="outline-green" onClick={() => goToPlay('home_prizes')}>
            Je participe →
          </Button>
        </div>
        <div className="ttt-auto-fit-200">
          {LOTS.map((lot) => (
            <Card hover key={lot.title} style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 120, background: lot.bg, display: 'grid', placeItems: 'center', color: lot.color }}>{lot.icon}</div>
              <div style={{ padding: 18 }}>
                <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: lot.tagColor, marginBottom: 6 }}>{lot.tag}</div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{lot.title}</h3>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{lot.sub}</div>
              </div>
            </Card>
          ))}
          <div
            style={{
              background: 'radial-gradient(120% 100% at 50% 0%,#21462C,#132C19)',
              border: '1px solid var(--green3)',
              borderRadius: 18,
              overflow: 'hidden',
              color: '#fff',
              position: 'relative',
            }}
          >
            <div style={{ height: 120, display: 'grid', placeItems: 'center', color: 'var(--gold)', position: 'relative' }}>
              <div
                aria-hidden="true"
                style={{ position: 'absolute', inset: 0, background: 'radial-gradient(50% 60% at 50% 40%, rgba(196,168,78,.25), transparent 70%)' }}
              />
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ position: 'relative' }}>
                <path d="M5 8l3 3 4-5 4 5 3-3v9H5z" />
                <path d="M5 20h14" />
              </svg>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold-soft)', marginBottom: 6 }}>✦ Grand prix</div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Un an de thé offert</h3>
              <div style={{ fontSize: 13, color: 'var(--gold-soft)' }}>Valeur 360 €</div>
            </div>
          </div>
        </div>
      </section>

      {/* RÉASSURANCE */}
      <section className="ttt-section" style={{ paddingTop: 56, paddingBottom: 90 }}>
        <div
          className="ttt-auto-fit-240"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: 14 }}
        >
          {REASSURANCE.map((item, i) => (
            <div
              key={item.title}
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                padding: 22,
                borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span
                style={{
                  flex: '0 0 auto',
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: item.bg,
                  color: item.color,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {item.icon}
              </span>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
