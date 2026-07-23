import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import Button from '../components/ui/Button';
import { useAuth } from '../context/useAuth';
import { useGame } from '../context/useGame';
import { getMyGainHistory } from '../services/api';
import { ROUTES } from '../routes';
import { canParticipate, getRoleDisplayName } from '../utils/roles';

function getMonthKey(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function Stats() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { fireToast } = useGame();
  const [history, setHistory] = useState(null);
  const userCanParticipate = isAuthenticated && canParticipate(user);

  useEffect(() => {
    if (!userCanParticipate) return;

    getMyGainHistory()
      .then(setHistory)
      .catch((error) => fireToast(error.message));
  }, [fireToast, userCanParticipate]);

  const gains = useMemo(() => history || [], [history]);
  const remis = gains.filter((item) => item.remis).length;
  const aRetirer = gains.length - remis;
  const tauxRetrait = gains.length ? Math.round((remis / gains.length) * 100) : 0;
  const currentMonth = getMonthKey(new Date());
  const codesCeMois = gains.filter((item) => getMonthKey(item.date_utilisation) === currentMonth).length;

  const split = useMemo(() => {
    const counts = new Map();
    gains.forEach((item) => {
      const label = item.gain?.libelle || 'Autre';
      counts.set(label, (counts.get(label) || 0) + 1);
    });

    return [...counts.entries()].map(([label, count]) => ({
      label,
      count,
      pct: gains.length ? Math.round((count / gains.length) * 100) : 0,
    }));
  }, [gains]);

  const bestPrize = split.slice().sort((a, b) => b.count - a.count)[0]?.label || '-';
  const lastParticipation = gains[0];

  if (isAuthenticated && !userCanParticipate) {
    return (
      <section className="ttt-section" style={{ paddingTop: 80, paddingBottom: 120, textAlign: 'center' }}>
        <div className="ttt-eyebrow">Acces reserve aux clients</div>
        <h1 style={{ fontWeight: 600, fontSize: 'clamp(32px,4.5vw,48px)', margin: '0 0 16px' }}>
          Ce compte n'a pas de statistiques de participation.
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto 24px', color: 'var(--muted)', lineHeight: 1.7 }}>
          Vous etes connecte avec un compte {getRoleDisplayName(user).toLowerCase()}. Les statistiques personnelles existent uniquement pour les comptes clients.
        </p>
        <Button variant="solid" onClick={() => navigate(ROUTES.profile)}>
          Retourner a mon espace
        </Button>
      </section>
    );
  }

  return (
    <section className="ttt-section" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div style={{ marginBottom: 30 }}>
        <div className="ttt-eyebrow">Mon suivi</div>
        <h1 style={{ fontWeight: 600, fontSize: 'clamp(32px,4.5vw,48px)', margin: 0 }}>Mes statistiques de participation.</h1>
      </div>

      <div className="ttt-auto-fit-160" style={{ marginBottom: 22 }}>
        <StatCard label="Total participations" value={gains.length} />
        <StatCard label="Taux de retrait" value={`${tauxRetrait}%`} />
        <StatCard label="Meilleur lot" value={bestPrize} valueStyle={{ fontSize: 20, marginTop: 6 }} />
        <StatCard label="Codes ce mois" value={codesCeMois} />
      </div>

      <div className="ttt-cols-stats" style={{ marginBottom: 22 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Etat de mes codes</div>
          <ProgressBar label="Recuperes" value={remis} total={Math.max(gains.length, 1)} color="var(--success)" delay={0.1} />
          <ProgressBar label="A retirer" value={aRetirer} total={Math.max(gains.length, 1)} color="var(--warn)" delay={0.2} />
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--muted)' }}>
            Derniere participation
            <br />
            <span style={{ color: 'var(--ink)', fontWeight: 700, fontSize: 13.5 }}>
              {lastParticipation ? lastParticipation.code_ticket : history ? 'Aucune participation' : 'Chargement...'}
            </span>
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Repartition de mes lots</div>
          {split.length === 0 ? (
            <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>{history ? 'Aucun lot pour le moment.' : 'Chargement...'}</div>
          ) : (
            <>
              <div style={{ display: 'flex', height: 26, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                {split.map((item, index) => (
                  <div key={item.label} style={{ width: `${item.pct}%`, background: index % 2 ? 'var(--green)' : 'var(--gold)' }} />
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 13 }}>
                {split.map((item) => (
                  <span key={item.label}>
                    {item.label} - {item.count}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}
