import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useAuth } from '../context/useAuth';
import { useGame } from '../context/useGame';
import Button from '../components/ui/Button';
import { Input, Select, FieldRow } from '../components/ui/Field';
import SocialLogin from '../components/auth/SocialLogin';
import logoEmblem from '../assets/brand/logo-emblem-t.png';

const initialForm = {
  prenom: '',
  nom: '',
  date_de_naissance: '',
  sexe: '',
  email: '',
  mot_de_passe: '',
};

const adultBirthDateLimit = new Date();
adultBirthDateLimit.setFullYear(adultBirthDateLimit.getFullYear() - 18);
const adultBirthDateMax = adultBirthDateLimit.toISOString().slice(0, 10);

export default function Auth() {
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, refreshProfile } = useAuth();
  const { fireToast } = useGame();
  const from = location.state?.from;
  const redirectTo = from ? `${from.pathname}${from.search || ''}${from.hash || ''}` : ROUTES.profile;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        await signUp(form);
        await refreshProfile();
        fireToast('Bienvenue chez The Tip Top !');
      } else {
        await signIn({
          email: form.email,
          mot_de_passe: form.mot_de_passe,
        });
        await refreshProfile();
        fireToast('Connexion reussie, bon retour !');
      }

      navigate(redirectTo, { replace: true });
    } catch (error) {
      fireToast(error.message);
    } finally {
      setSubmitting(false);
    }
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
          <img src={logoEmblem} alt="The Tip Top" style={{ width: 76, height: 76, objectFit: 'contain', marginBottom: 12 }} />
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
            Creer un compte
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
                <Input label="Prenom" required placeholder="Camille" value={form.prenom} onChange={(event) => updateField('prenom', event.target.value)} />
                <Input label="Nom" required placeholder="Martin" value={form.nom} onChange={(event) => updateField('nom', event.target.value)} />
              </FieldRow>
              <FieldRow>
                <Input label="Date de naissance" type="date" required max={adultBirthDateMax} value={form.date_de_naissance} onChange={(event) => updateField('date_de_naissance', event.target.value)} />
                <Select label="Sexe" required value={form.sexe} onChange={(event) => updateField('sexe', event.target.value)}>
                  <option value="" disabled>
                    Choisir...
                  </option>
                  <option value="F">Femme</option>
                  <option value="M">Homme</option>
                  <option value="N">Non precise</option>
                </Select>
              </FieldRow>
            </>
          )}
          <Input label="Adresse e-mail" type="email" required placeholder="vous@exemple.fr" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
          <Input
            label="Mot de passe"
            type="password"
            required
            placeholder="********"
            value={form.mot_de_passe}
            onChange={(event) => updateField('mot_de_passe', event.target.value)}
            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
            title="8 caracteres minimum, avec 1 majuscule, 1 minuscule, 1 chiffre et 1 caractere special."
          />
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => navigate(ROUTES.forgotPassword)}
              style={{
                alignSelf: 'flex-end',
                margin: '-6px 0 0',
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: 'var(--green)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Mot de passe oublié ?
            </button>
          )}
          {mode === 'signup' && (
            <p style={{ margin: '-6px 0 0', fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>
              Minimum 8 caracteres, avec 1 majuscule, 1 minuscule, 1 chiffre et 1 caractere special.
            </p>
          )}
          {mode === 'signup' && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginTop: 2 }}>
              <input type="checkbox" required style={{ marginTop: 2, accentColor: 'var(--green)', width: 15, height: 15 }} />
              <span>
                J'accepte le{' '}
                <a onClick={() => navigate(`${ROUTES.legal}#lg-reglement`)} style={{ color: 'var(--green)', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
                  reglement du jeu
                </a>{' '}
                et la{' '}
                <a onClick={() => navigate(`${ROUTES.legal}#lg-rgpd`)} style={{ color: 'var(--green)', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
                  politique de confidentialite
                </a>{' '}
                (RGPD).
              </span>
            </label>
          )}
          <Button type="submit" variant="solid" style={{ marginTop: 6 }} block disabled={submitting}>
            {submitting ? 'Veuillez patienter...' : mode === 'signup' ? 'Creer mon compte' : 'Me connecter'}
          </Button>
        </form>

        <SocialLogin redirectTo={redirectTo} />

        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--muted)', margin: '18px 0 0' }}>
          Vos donnees ne sont jamais revendues.
        </p>
      </div>
    </section>
  );
}
