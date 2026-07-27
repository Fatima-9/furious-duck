// Gestion du consentement cookies (RGPD).
// Le choix de l'utilisateur est conserve dans le navigateur : tant qu'il n'a pas
// repondu, le bandeau reste affiche. Les cookies non essentiels ne doivent etre
// actives que si le consentement correspondant est a true.

export const CONSENT_STORAGE_KEY = 'ttt_cookie_consent';
export const CONSENT_VERSION = 1;
// Evenement permettant de rouvrir le bandeau depuis n'importe ou (ex: footer).
export const OPEN_PREFERENCES_EVENT = 'ttt:open-cookie-preferences';

export function getConsent() {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    // Si la version du bandeau a change, on redemande le consentement.
    if (parsed.version !== CONSENT_VERSION) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent({ analytics = false, marketing = false } = {}) {
  const consent = {
    version: CONSENT_VERSION,
    necessary: true, // toujours actif, indispensable au fonctionnement
    analytics: Boolean(analytics),
    marketing: Boolean(marketing),
    date: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // localStorage indisponible (navigation privee stricte) : on ignore,
    // le bandeau se reaffichera a la prochaine visite.
  }

  return consent;
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT));
}
