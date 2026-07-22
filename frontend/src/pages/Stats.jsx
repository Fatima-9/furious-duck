import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';

const MONTHS = [
  { label: 'Jan', height: 34, color: 'var(--border-strong)' },
  { label: 'Fév', height: 58, color: 'var(--green2)' },
  { label: 'Mar', height: 46, color: 'var(--green2)' },
  { label: 'Avr', height: 76, color: 'var(--green)' },
  { label: 'Mai', height: 62, color: 'var(--green)' },
  { label: 'Juin', height: 100, gold: true },
];

const LOT_SPLIT = [
  { label: 'Infuseurs', count: 3, pct: 43, color: 'var(--green3)' },
  { label: 'Détox', count: 2, pct: 29, color: 'var(--green)' },
  { label: 'Coffrets', count: 1, pct: 14, color: 'var(--green2)' },
  { label: 'Signature', count: 1, pct: 14, color: 'var(--gold)' },
];

export default function Stats() {
  return (
    <section className="ttt-section" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div style={{ marginBottom: 30 }}>
        <div className="ttt-eyebrow">Mon suivi</div>
        <h1 style={{ fontWeight: 600, fontSize: 'clamp(32px,4.5vw,48px)', margin: 0 }}>Statistiques de participation.</h1>
      </div>

      <div className="ttt-auto-fit-160" style={{ marginBottom: 22 }}>
        <StatCard label="Total participations" value="7" />
        <StatCard label="Taux de retrait" value="86%" />
        <StatCard label="Meilleur lot" value="Signature" valueStyle={{ fontSize: 24, marginTop: 6 }} />
        <StatCard label="Codes ce mois" value="2" />
      </div>

      <div className="ttt-cols-stats" style={{ marginBottom: 22 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Participations sur 6 mois</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Jan → Juin</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 150 }}>
            {MONTHS.map((m) => (
              <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 38,
                    height: `${m.height}%`,
                    background: m.gold ? 'linear-gradient(180deg,#D2B95F,var(--gold))' : m.color,
                    borderRadius: '7px 7px 0 0',
                    boxShadow: m.gold ? '0 6px 16px -8px rgba(196,168,78,.8)' : 'none',
                  }}
                />
                <span style={{ fontSize: 11, color: m.gold ? 'var(--ink)' : 'var(--muted)', fontWeight: m.gold ? 700 : 400 }}>{m.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>État de mes codes</div>
          <ProgressBar label="Récupérés" value={6} total={7} color="var(--success)" delay={0.1} />
          <ProgressBar label="À retirer" value={1} total={7} color="var(--warn)" delay={0.2} />
          <ProgressBar label="Expirés" value={0} total={7} color="var(--muted)" delay={0.3} />
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--muted)' }}>
            Dernière participation
            <br />
            <span style={{ color: 'var(--ink)', fontWeight: 700, fontSize: 13.5 }}>Il y a 3 jours · TTT-9F4K-21</span>
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Répartition de mes lots</div>
        <div style={{ display: 'flex', height: 26, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          {LOT_SPLIT.map((s) => (
            <div key={s.label} style={{ width: `${s.pct}%`, background: s.color }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 13 }}>
          {LOT_SPLIT.map((s) => (
            <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: s.color }} />
              {s.label} · {s.count}
            </span>
          ))}
        </div>
      </Card>
    </section>
  );
}
