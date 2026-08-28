import { useEffect, useMemo, useState } from 'react';

const START_DATE = new Date('2026-09-01T00:00:00+02:00');
const END_DATE = new Date('2026-09-30T23:59:59+02:00');
const CLAIM_END_DATE = new Date('2026-10-30T23:59:59+01:00');

function getRemainingParts(targetDate) {
  const diff = Math.max(targetDate.getTime() - Date.now(), 0);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function CountdownItem({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 700, color: 'var(--gold)' }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.68)' }}>
        {label}
      </div>
    </div>
  );
}

export default function ContestCountdown() {
  const [remaining, setRemaining] = useState(() => getRemainingParts(END_DATE));
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
      setRemaining(getRemainingParts(END_DATE));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const status = useMemo(() => {
    const now = currentTime;

    if (now < START_DATE.getTime()) {
      return 'Le jeu commence le 1 septembre 2026.';
    }

    if (now <= END_DATE.getTime()) {
      return 'Temps restant avant la fin du jeu concours.';
    }

    if (now <= CLAIM_END_DATE.getTime()) {
      return 'Le jeu est termine, les lots peuvent encore etre reclames jusqu au 30 octobre 2026.';
    }

    return 'Le jeu concours et la periode de reclamation sont termines.';
  }, [currentTime]);

  return (
    <section className="ttt-section" style={{ paddingTop: 34, paddingBottom: 34 }}>
      <div
        style={{
          background: 'radial-gradient(120% 100% at 50% 0%, #21462C, #132C19)',
          borderRadius: 22,
          color: '#fff',
          padding: '30px 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 26,
          alignItems: 'center',
        }}
      >
        <div>
          <div className="ttt-eyebrow" style={{ color: 'var(--gold-soft)' }}>
            Compte a rebours
          </div>
          <h2 style={{ fontWeight: 600, fontSize: 'clamp(28px,4vw,42px)', margin: '0 0 10px' }}>
            30 jours pour jouer, 30 jours pour reclamer votre lot.
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,.78)', lineHeight: 1.65, fontSize: 15.5 }}>
            Le jeu se deroule du 1 septembre au 30 septembre 2026. Les participants disposent ensuite de 30 jours
            supplementaires pour tester leurs codes et reclamer leur lot en magasin ou en ligne.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <CountdownItem label="jours" value={remaining.days} />
          <CountdownItem label="heures" value={remaining.hours} />
          <CountdownItem label="min" value={remaining.minutes} />
          <CountdownItem label="sec" value={remaining.seconds} />
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: 13, color: 'var(--gold-soft)' }}>
            {status}
          </div>
        </div>
      </div>
    </section>
  );
}
