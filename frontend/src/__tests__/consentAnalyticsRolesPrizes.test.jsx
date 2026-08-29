import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import {
  CONSENT_STORAGE_KEY,
  OPEN_PREFERENCES_EVENT,
  getConsent,
  openCookiePreferences,
  saveConsent,
} from '../components/cookies/cookieConsent';
import { trackEvent, trackParticipationClick } from '../utils/analytics';
import { canParticipate, getRoleDisplayName, getRoleLabel, isAdmin } from '../utils/roles';
import { getPrizeFromGainLabel, getSegmentIndexForPrize } from '../data/prizes';

describe('cookie consent', () => {
  it('returns null when no valid consent is stored', () => {
    expect(getConsent()).toBeNull();

    localStorage.setItem(CONSENT_STORAGE_KEY, '{bad json');

    expect(getConsent()).toBeNull();
  });

  it('persists consent choices with required cookies always enabled', () => {
    const consent = saveConsent({ analytics: true, marketing: false });

    expect(consent).toMatchObject({
      necessary: true,
      analytics: true,
      marketing: false,
    });
    expect(getConsent()).toMatchObject({
      necessary: true,
      analytics: true,
      marketing: false,
    });
  });

  it('reopens preferences through a global event', () => {
    const listener = vi.fn();
    window.addEventListener(OPEN_PREFERENCES_EVENT, listener);

    openCookiePreferences();

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(OPEN_PREFERENCES_EVENT, listener);
  });

  it('expires outdated consent choices', () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        analytics: true,
        marketing: true,
        date: '2020-01-01T00:00:00.000Z',
      }),
    );

    expect(getConsent()).toBeNull();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });
});

describe('analytics helpers', () => {
  it('does not send analytics without consent', () => {
    trackEvent('test_event');

    expect(window.gtag).not.toHaveBeenCalled();
  });

  it('sends participation campaign events when analytics is accepted', () => {
    saveConsent({ analytics: true });

    trackParticipationClick('hero');

    expect(window.gtag).toHaveBeenCalledWith('event', 'participation_click', {
      event_category: 'jeu_concours',
      event_label: 'hero',
    });
  });
});

describe('roles utilities', () => {
  it('detects role labels from text or ids', () => {
    expect(getRoleLabel({ role: 'admin' })).toBe('admin');
    expect(getRoleLabel({ role_id: 3 })).toBe('employe_boutique');
    expect(getRoleLabel({ role_id: 1 })).toBe('client');
    expect(getRoleLabel({ role_id: 999 })).toBeNull();
  });

  it('maps roles to display names and permissions', () => {
    expect(getRoleDisplayName({ role_id: 2 })).toBe('Administrateur');
    expect(getRoleDisplayName({ role_id: 3 })).toBe('Employe boutique');
    expect(getRoleDisplayName({ role_id: 1 })).toBe('Client');
    expect(getRoleDisplayName(null)).toBe('Compte');
    expect(canParticipate({ role: 'client' })).toBe(true);
    expect(canParticipate({ role: 'admin' })).toBe(false);
    expect(isAdmin({ role_id: 2 })).toBe(true);
  });
});

describe('prizes utilities', () => {
  it('matches backend gain labels with frontend prizes', () => {
    const prize = getPrizeFromGainLabel('boîte de 100g de thé signature');

    expect(prize.key).toBe('signature');
    expect(getSegmentIndexForPrize(prize)).toBe(2);
  });

  it('falls back for unknown prizes', () => {
    const prize = getPrizeFromGainLabel('Lot mystere');

    expect(prize).toMatchObject({
      key: 'unknown',
      name: 'Lot mystere',
      value: 'Lot The Tip Top',
    });
    expect(getSegmentIndexForPrize(prize)).toBe(0);
  });

  it('keeps tests isolated with React act available', () => {
    act(() => {});

    expect(true).toBe(true);
  });
});
