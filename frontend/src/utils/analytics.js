import { getConsent } from '../components/cookies/cookieConsent';

export function trackEvent(name, params = {}) {
  const consent = getConsent();

  if (!consent?.analytics || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', name, params);
}

export function trackParticipationClick(label) {
  trackEvent('participation_click', {
    event_category: 'jeu_concours',
    event_label: label,
  });
}
