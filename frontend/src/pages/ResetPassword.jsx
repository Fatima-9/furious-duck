import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { resetPassword } from '../services/api';
import { ROUTES } from '../routes';
import logoEmblem from '../assets/brand/logo-emblem-t.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ttt-hero-dark" style={pageStyle}>
      <div className="ttt-grain" />
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <img src={logoEmblem} alt="The Tip Top" style={{ width: 76, height: 76, objectFit: 'contain', marginBottom: 12 }} />
          <h1 style={{ fontWeight: 600, fontSize: 30, margin: 0 }}>Nouveau mot de passe</h1>
        </div>

        {!token ? (
          <p role="alert" style={errorStyle}>Ce lien de réinitialisation est incomplet ou invalide.</p>
        ) : done ? (
          <div role="status" style={successStyle}>Votre mot de passe a bien été modifié.</div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              id="new-password"
              label="Nouveau mot de passe"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Input
              id="confirm-password"
              label="Confirmer le mot de passe"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            <p style={{ margin: '-6px 0 0', fontSize: 12, color: 'var(--muted)' }}>8 caractères minimum.</p>
            {error && <p role="alert" style={errorStyle}>{error}</p>}
            <Button type="submit" variant="solid" block disabled={submitting}>
              {submitting ? 'Modification...' : 'Modifier mon mot de passe'}
            </Button>
          </form>
        )}

        <p style={{ textAlign: 'center', margin: '20px 0 0', fontSize: 13 }}>
          <Link to={ROUTES.auth} style={{ color: 'var(--green)', fontWeight: 700, textDecoration: 'none' }}>
            Retour à la connexion
          </Link>
        </p>
      </div>
    </section>
  );
}

const pageStyle = {
  background: 'radial-gradient(120% 100% at 80% 0%, #21462C, #132C19)',
  minHeight: 'calc(100vh - 69px)',
  display: 'grid',
  placeItems: 'center',
  padding: '60px 24px',
};

const cardStyle = {
  position: 'relative',
  width: '100%',
  maxWidth: 440,
  background: 'var(--surface)',
  borderRadius: 24,
  padding: '38px 34px',
  boxShadow: '0 40px 80px -40px rgba(0,0,0,.6)',
  animation: 'ttt-scalein .5s both',
};

const successStyle = {
  padding: 16,
  borderRadius: 12,
  color: 'var(--success)',
  background: 'var(--success-bg)',
  fontSize: 14,
};

const errorStyle = {
  margin: 0,
  padding: 12,
  borderRadius: 10,
  color: 'var(--error)',
  background: 'var(--error-bg)',
  fontSize: 13,
};
