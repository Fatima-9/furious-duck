import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useGame } from '../context/useGame';
import { sendContactMessage } from '../services/api';
import Button from '../components/ui/Button';
import { Input, Select, Textarea, FieldRow } from '../components/ui/Field';

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

const initialForm = {
  prenom: '',
  nom: '',
  email: '',
  motif: 'Question sur le jeu',
  message: '',
};

export default function Contact() {
  const navigate = useNavigate();
  const { fireToast } = useGame();
  const [form, setForm] = useState(initialForm);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();

    if (!turnstileSiteKey) {
      fireToast('La verification captcha est mal configuree.');
      return;
    }

    if (!turnstileToken) {
      fireToast('Veuillez valider le captcha.');
      return;
    }

    setSubmitting(true);

    try {
      await sendContactMessage({
        ...form,
        turnstile_token: turnstileToken,
      });

      fireToast('Message envoye — nous repondons sous 48 h.');
      setForm(initialForm);
      setTurnstileToken('');
    } catch (error) {
      setTurnstileToken('');
      fireToast(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ttt-section" style={{ paddingTop: 60, paddingBottom: 80 }}>
      <div className="ttt-cols-contact">
        <div>
          <div className="ttt-eyebrow">Contact</div>
          <h1 style={{ fontWeight: 600, fontSize: 'clamp(32px,4.5vw,48px)', lineHeight: 1.08, margin: '0 0 16px' }}>
            Une question ? Écrivez-nous.
          </h1>
          <p style={{ fontSize: 15.5, color: 'var(--ink-soft)', lineHeight: 1.7, margin: '0 0 28px' }}>
            Notre équipe vous répond sous 48 heures ouvrées. Pour une réponse immédiate, la{' '}
            <a onClick={() => navigate(ROUTES.faq)} style={{ color: 'var(--green)', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
              FAQ
            </a>{' '}
            couvre l'essentiel.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--success-bg)', color: 'var(--green)', display: 'grid', placeItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="M4 7l8 6 8-6" />
                </svg>
              </span>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>E-mail</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>bonjour@thetiptop.fr</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: '#EEF0EA', color: 'var(--green)', display: 'grid', placeItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 4h4l2 5-3 2a12 12 0 006 6l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
                </svg>
              </span>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Téléphone</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>01 86 00 00 00 · lun–ven 9h-18h</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: '#F5EAD9', color: 'var(--gold)', display: 'grid', placeItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-7-5-7-11a7 7 0 0114 0c0 6-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Siège</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>18 rue des Jardins, 75011 Paris</div>
              </div>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 30, borderRadius: 20 }}>
          <FieldRow>
            <Input label="Prénom" required value={form.prenom} onChange={(event) => updateField('prenom', event.target.value)} />
            <Input label="Nom" required value={form.nom} onChange={(event) => updateField('nom', event.target.value)} />
          </FieldRow>
          <Input label="E-mail" type="email" required placeholder="vous@exemple.fr" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
          <Select label="Motif" value={form.motif} onChange={(event) => updateField('motif', event.target.value)}>
            <option>Question sur le jeu</option>
            <option>Probleme avec un code</option>
            <option>Recuperation d'un lot</option>
            <option>Donnees personnelles</option>
            <option>Autre</option>
          </Select>
          <Textarea label="Message" required rows={4} placeholder="Votre message..." value={form.message} onChange={(event) => updateField('message', event.target.value)} />

          {turnstileSiteKey && (
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: 65 }}>
              <Turnstile
                key={turnstileToken ? 'verified' : 'pending'}
                siteKey={turnstileSiteKey}
                options={{
                  theme: 'light',
                  size: 'normal',
                  language: 'fr',
                }}
                onSuccess={setTurnstileToken}
                onExpire={() => setTurnstileToken('')}
                onError={() => setTurnstileToken('')}
              />
            </div>
          )}

          <Button type="submit" variant="solid" block disabled={submitting}>
            {submitting ? 'Envoi en cours...' : 'Envoyer le message'}
          </Button>
        </form>
      </div>
    </section>
  );
}
