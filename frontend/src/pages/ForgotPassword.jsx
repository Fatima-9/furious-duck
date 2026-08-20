import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { requestPasswordReset } from '../services/api';
import { ROUTES } from '../routes';
import logoEmblem from '../assets/brand/logo-emblem-t.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await requestPasswordReset(email);
      setSent(true);
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
          <h1 style={{ fontWeight: 600, fontSize: 30, margin: 0 }}>Mot de passe oublié</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>
            Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {sent ? (
          <div role="status" style={successStyle}>
            Si un compte correspond à cette adresse, un e-mail vient de vous être envoyé.
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              id="forgot-email"
              label="Adresse e-mail"
              type="email"
              required
              autoComplete="email"
              placeholder="vous@exemple.fr"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {error && <p role="alert" style={errorStyle}>{error}</p>}
            <Button type="submit" variant="solid" block disabled={submitting}>
              {submitting ? 'Envoi en cours...' : 'Envoyer le lien'}
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
  lineHeight: 1.55,
};

const errorStyle = {
  margin: 0,
  padding: 12,
  borderRadius: 10,
  color: 'var(--error)',
  background: 'var(--error-bg)',
  fontSize: 13,
};
