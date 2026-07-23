import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPrizeFromGainLabel, getSegmentIndexForPrize } from '../data/prizes';
import { GameContext } from './gameContextInstance';
import { participateWithTicket, verifyTicket } from '../services/api';

const SEGMENT_ANGLE = 45;
const FULL_TURNS = 5;
const SPIN_DURATION = 4.4;
const REDUCED_SPIN_DURATION = 0.7;

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function GameProvider({ children }) {
  const [code, setCodeRaw] = useState('');
  const [drawState, setDrawState] = useState('idle');
  const [ticketCheck, setTicketCheck] = useState({ status: 'idle', ticket: null, message: '' });
  const [prize, setPrize] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [spinDuration, setSpinDuration] = useState(SPIN_DURATION);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);
  const spinTimer = useRef(null);

  const fireToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 3600);
  }, []);

  const hideToast = useCallback(() => setToastMsg(''), []);

  const setCode = useCallback((value) => {
    const nextCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setCodeRaw(nextCode);
    setTicketCheck({
      status: nextCode.length === 0 ? 'idle' : nextCode.length < 10 ? 'format_incomplete' : 'checking',
      ticket: null,
      message: '',
    });
    setDrawState((current) => (current === 'won' ? 'idle' : current));
    setPrize(null);
  }, []);

  const codeHasValidFormat = (code || '').replace(/[^A-Z0-9]/gi, '').length === 10;
  const codeValid = codeHasValidFormat && ticketCheck.status === 'valid';

  useEffect(() => {
    if (!codeHasValidFormat) {
      return undefined;
    }

    let active = true;
    const timer = setTimeout(() => {
      setTicketCheck({ status: 'checking', ticket: null, message: 'Verification du code...' });

      verifyTicket(code)
        .then((ticket) => {
          if (!active) return;

          if (!ticket.exists) {
            setTicketCheck({ status: 'invalid', ticket, message: "Ce code n'existe pas." });
            return;
          }

          if (!ticket.canParticipate) {
            const message = ticket.reason === 'already_used'
              ? 'Ce code a deja ete utilise.'
              : "Ce code ne peut pas etre utilise pour le moment.";
            setTicketCheck({ status: 'invalid', ticket, message });
            return;
          }

          setTicketCheck({ status: 'valid', ticket, message: 'Code trouve en base, vous pouvez tourner la roue.' });
        })
        .catch((error) => {
          if (!active) return;
          setTicketCheck({ status: 'invalid', ticket: null, message: error.message });
        });
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [code, codeHasValidFormat]);

  const spin = useCallback(async () => {
    if (drawState === 'spinning') return;
    if (!codeValid) {
      fireToast(codeHasValidFormat ? ticketCheck.message || 'Ce code est invalide.' : 'Saisissez un code de 10 caracteres pour lancer la roue.');
      return;
    }

    setDrawState('spinning');

    let ticket;
    try {
      ticket = await participateWithTicket(code);
    } catch (error) {
      setDrawState('idle');
      fireToast(error.message);
      return;
    }

    const reduce = prefersReducedMotion();
    const won = getPrizeFromGainLabel(ticket?.gain?.libelle);
    const idx = getSegmentIndexForPrize(won);
    const centerAngle = idx * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const jitter = (Math.random() * 2 - 1) * 14;
    const targetMod = (((360 - centerAngle - jitter) % 360) + 360) % 360;
    const curMod = ((rotation % 360) + 360) % 360;
    const delta = (((targetMod - curMod) % 360) + 360) % 360;
    const turns = reduce ? 1 : FULL_TURNS;
    const nextRotation = rotation + turns * 360 + delta;
    const dur = reduce ? REDUCED_SPIN_DURATION : SPIN_DURATION;

    setSpinDuration(dur);
    setRotation(nextRotation);

    clearTimeout(spinTimer.current);
    spinTimer.current = setTimeout(() => {
      setPrize({
        ...won,
        ticket,
      });
      setDrawState('won');
    }, dur * 1000 + 160);
  }, [code, codeHasValidFormat, codeValid, drawState, fireToast, rotation, ticketCheck.message]);

  const resetDraw = useCallback(() => {
    setDrawState('idle');
    setPrize(null);
  }, []);

  const value = useMemo(
    () => ({
      code,
      setCode,
      codeValid,
      codeHasValidFormat,
      ticketCheck,
      drawState,
      isSpinning: drawState === 'spinning',
      hasWon: drawState === 'won',
      notWon: drawState !== 'won',
      prize,
      rotation,
      spinDuration,
      spin,
      resetDraw,
      toastMsg,
      fireToast,
      hideToast,
    }),
    [code, setCode, codeValid, codeHasValidFormat, ticketCheck, drawState, prize, rotation, spinDuration, spin, resetDraw, toastMsg, fireToast, hideToast]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
