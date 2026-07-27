import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useGame } from '../../context/useGame';
import { loadScript } from './loadScript';

const GOOGLE_SDK = 'https://accounts.google.com/gsi/client';
const FACEBOOK_SDK = 'https://connect.facebook.net/en_US/sdk.js';

export default function SocialLogin({ redirectTo }) {
  const googleButtonRef = useRef(null);
  const navigate = useNavigate();
  const { signInWithOAuth, refreshProfile } = useAuth();
  const { fireToast } = useGame();
  const [busy, setBusy] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

  // Envoie le token du fournisseur au backend, qui cree/connecte le compte.
  const completeOAuth = useCallback(
    async (provider, token) => {
      try {
        setBusy(true);
        await signInWithOAuth({ provider, token });
        await refreshProfile();
        fireToast('Connexion reussie, bon retour !');
        navigate(redirectTo, { replace: true });
      } catch (error) {
        fireToast(error.message || 'La connexion a echoue.');
      } finally {
        setBusy(false);
      }
    },
    [signInWithOAuth, refreshProfile, fireToast, navigate, redirectTo]
  );

  // Google Identity Services : renvoie un ID token (JWT) dans response.credential.
  useEffect(() => {
    if (!googleClientId) {
      return undefined;
    }

    let cancelled = false;

    loadScript(GOOGLE_SDK)
      .then(() => {
        if (cancelled || !window.google || !googleButtonRef.current) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response?.credential) {
              completeOAuth('google', response.credential);
            }
          },
        });

        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'center',
          width: 300,
        });
      })
      .catch(() => {
        /* SDK indisponible : le bouton reste simplement absent */
      });

    return () => {
      cancelled = true;
    };
  }, [googleClientId, completeOAuth]);

  // Facebook JS SDK : FB.login renvoie un access token dans authResponse.
  useEffect(() => {
    if (!facebookAppId) {
      return undefined;
    }

    let cancelled = false;

    loadScript(FACEBOOK_SDK)
      .then(() => {
        if (cancelled || !window.FB) {
          return;
        }

        window.FB.init({
          appId: facebookAppId,
          cookie: true,
          xfbml: false,
          version: 'v21.0',
        });
      })
      .catch(() => {
        /* SDK indisponible */
      });

    return () => {
      cancelled = true;
    };
  }, [facebookAppId]);

  const loginWithFacebook = useCallback(() => {
    if (!window.FB) {
      fireToast("Facebook n'est pas disponible pour le moment.");
      return;
    }

    window.FB.login(
      (response) => {
        if (response?.authResponse?.accessToken) {
          completeOAuth('facebook', response.authResponse.accessToken);
        }
      },
      { scope: 'email' }
    );
  }, [completeOAuth, fireToast]);

  if (!googleClientId && !facebookAppId) {
    return null;
  }

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 16px' }}>
        <span style={{ flex: 1, height: 1, background: 'var(--line, rgba(255,255,255,0.14))' }} />
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>ou continuer avec</span>
        <span style={{ flex: 1, height: 1, background: 'var(--line, rgba(255,255,255,0.14))' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {googleClientId && <div ref={googleButtonRef} style={{ minHeight: 40 }} />}

        {facebookAppId && (
          <button
            type="button"
            onClick={loginWithFacebook}
            disabled={busy}
            style={{
              width: 300,
              maxWidth: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '10px 16px',
              borderRadius: 999,
              border: 'none',
              cursor: busy ? 'default' : 'pointer',
              background: '#1877F2',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              opacity: busy ? 0.7 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
            </svg>
            Continuer avec Facebook
          </button>
        )}
      </div>
    </div>
  );
}
