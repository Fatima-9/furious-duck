import { useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '../routes';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';

const HISTORY = [
  { code: 'TTT-9F4K-21', lot: 'Thé signature', date: '01 juil.', status: 'Récupéré', variant: 'success' },
  { code: 'TTT-3B8M-07', lot: 'Coffret découverte', date: '24 juin', status: 'À retirer', variant: 'warn' },
  { code: 'TTT-1QZ2-88', lot: 'Infuseur', date: '12 juin', status: 'Récupéré', variant: 'success' },
  { code: 'TTT-7KP5-33', lot: 'Thé détox', date: '02 juin', status: 'Récupéré', variant: 'success' },
];

export default function Profile() {
  const navigate = useNavigate();

  return (
    <section className="ttt-section" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28, flexWrap: 'wrap' }}>
        <span
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--green3)',
            color: 'var(--gold)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          C
        </span>
        <div>
          <h1 style={{ fontWeight: 600, fontSize: 32, lineHeight: 1, margin: '0 0 4px' }}>Bonjour, Camille</h1>
          <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>Membre depuis mars 2026 · Île-de-France</div>
        </div>
        <Badge variant="outline-gold" style={{ marginLeft: 'auto' }}>
          ✦ Statut Fidèle
        </Badge>
        <Button variant="solid" onClick={() => navigate(ROUTES.play)}>
          Nouveau code
        </Button>
      </div>

      <div className="ttt-auto-fit-160" style={{ marginBottom: 26 }}>
        <StatCard label="Participations" value="7" foot="+2 ce mois-ci" />
        <StatCard label="Lots gagnés" value="7" foot="100 % gagnant" />
        <StatCard label="Valeur cumulée" value="214€" foot="de lots reçus" />
        <StatCard label="À retirer" value="1" foot="coffret en attente" dark />
      </div>

      <Card style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Historique de participation
          </div>
          <Link to={ROUTES.stats} style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, textDecoration: 'none' }}>
            Voir mes statistiques →
          </Link>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1.2fr 1fr .9fr',
            fontSize: 11.5,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            padding: '0 4px 10px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span>Code</span>
          <span>Lot</span>
          <span>Date</span>
          <span style={{ textAlign: 'right' }}>Statut</span>
        </div>
        {HISTORY.map((row, i) => (
          <div
            key={row.code}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1.2fr 1fr .9fr',
              alignItems: 'center',
              padding: '13px 4px',
              borderBottom: i < HISTORY.length - 1 ? '1px solid var(--border)' : 'none',
              fontSize: 13.5,
            }}
          >
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16 }}>{row.code}</span>
            <span>{row.lot}</span>
            <span style={{ color: 'var(--muted)' }}>{row.date}</span>
            <span style={{ textAlign: 'right' }}>
              <Badge variant={row.variant}>{row.status}</Badge>
            </span>
          </div>
        ))}
      </Card>

      <div className="ttt-cols-2-tight">
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Mes informations</h3>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 2 }}>
            camille.martin@exemple.fr
            <br />
            Newsletter thé <span style={{ color: 'var(--success)', fontWeight: 700 }}>· activée</span>
          </div>
          <Button variant="ghost" size="sm" style={{ marginTop: 16 }}>
            Modifier
          </Button>
        </Card>
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Confidentialité (RGPD)</h3>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Vous gardez le contrôle total de vos données.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm">
              Exporter mes données
            </Button>
            <Button variant="danger" size="sm">
              Supprimer mon compte
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
