import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useGame } from '../context/useGame';
import Button from '../components/ui/Button';
import { Input, Select, FieldRow } from '../components/ui/Field';
import logoEmblem from '../assets/brand/logo-emblem-t.png';

export default function Auth() {
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const navigate = useNavigate();
  const { fireToast } = useGame();

  function submit(e) {
    e.preventDefault();
    fireToast(mode === 'signup' ? 'Bienvenue chez Thé Tip Top !' : 'Connexion réussie — bon retour !');
    navigate(ROUTES.profile);
  }

  return (
    <section
      className="ttt-hero-dark"
      style={{
        background: 'radial-gradient(120% 100% at 80% 0%, #21462C, #132C19)',
        minHeight: 'calc(100vh - 69px)',
        display: 'grid',
        placeItems: 'center',
        padding: '60px 24px',
      }}
    >
      <div className="ttt-grain" />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -120,
          top: -90,
          width: 380,
          height: 380,
          border: '1.5px dashed rgba(196,168,78,.3)',
          borderRadius: '50%',
          animation: 'ttt-spin 80s linear infinite',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          background: 'var(--surface)',
          borderRadius: 24,
          padding: '38px 34px',
          boxShadow: '0 40px 80px -40px rgba(0,0,0,.6)',
          animation: 'ttt-scalein .5s both',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <img src={logoEmblem} alt="Thé Tip Top" style={{ width: 76, height: 76, objectFit: 'contain', marginBottom: 12 }} />
          <h1 style={{ fontWeight: 600, fontSize: 30, margin: 0 }}>Bienvenue</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--muted)' }}>
            Connectez-vous pour participer et suivre vos lots.
          </p>
        </div>

        <div style={{ display: 'flex', background: 'var(--paper2)', borderRadius: 12, padding: 4, marginBottom: 22 }}>
          <button
            type="button"
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: 9,
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13.5,
              fontWeight: 700,
              background: mode === 'signup' ? 'var(--surface)' : 'transparent',
              color: mode === 'signup' ? 'var(--green)' : 'var(--muted)',
              boxShadow: mode === 'signup' ? '0 2px 6px -3px rgba(0,0,0,.2)' : 'none',
            }}
          >
            Inscription
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: 9,
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13.5,
              fontWeight: 700,
              background: mode === 'login' ? 'var(--surface)' : 'transparent',
              color: mode === 'login' ? 'var(--green)' : 'var(--muted)',
              boxShadow: mode === 'login' ? '0 2px 6px -3px rgba(0,0,0,.2)' : 'none',
            }}
          >
            Connexion
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <>
              <FieldRow>
                <Input label="Prénom" required placeholder="Camille" />
                <Input label="Nom" required placeholder="Martin" />
              </FieldRow>
              <FieldRow>
                <Input label="Date de naissance" type="date" required />
                <Select label="Sexe" required defaultValue="">
                  <option value="" disabled>
                    Choisir…
                  </option>
                  <option>Femme</option>
                  <option>Homme</option>
                  <option>Non précisé</option>
                </Select>
              </FieldRow>
            </>
          )}
          <Input label="Adresse e-mail" type="email" required placeholder="vous@exemple.fr" />
          <Input label="Mot de passe" type="password" required placeholder="••••••••" />
          {mode === 'signup' && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginTop: 2 }}>
              <input type="checkbox" required style={{ marginTop: 2, accentColor: 'var(--green)', width: 15, height: 15 }} />
              <span>
                J'accepte le{' '}
                <a onClick={() => navigate(ROUTES.legal)} style={{ color: 'var(--green)', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
                  règlement du jeu
                </a>{' '}
                et la{' '}
                <a onClick={() => navigate(ROUTES.legal)} style={{ color: 'var(--green)', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
                  politique de confidentialité
                </a>{' '}
                (RGPD).
              </span>
            </label>
          )}
          <Button type="submit" variant="solid" style={{ marginTop: 6 }} block>
            {mode === 'signup' ? 'Créer mon compte' : 'Me connecter'}
          </Button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--muted)', margin: '18px 0 0' }}>
          🔒 Vos données ne sont jamais revendues.
        </p>
      </div>
    </section>
  );
}
