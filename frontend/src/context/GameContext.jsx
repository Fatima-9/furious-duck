import { useCallback, useMemo, useRef, useState } from 'react';
import { PRIZES, SEGMENT_TO_PRIZE } from '../data/prizes';
import { GameContext } from './gameContextInstance';

const SEGMENT_ANGLE = 45; // 360 / 8 segments
const FULL_TURNS = 5;
const SPIN_DURATION = 4.4; // seconds
const REDUCED_SPIN_DURATION = 0.7;

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function GameProvider({ children }) {
  const [code, setCodeRaw] = useState('');
  const [drawState, setDrawState] = useState('idle'); // idle | spinning | won
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
    setCodeRaw(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
  }, []);

  const codeValid = (code || '').replace(/[^A-Z0-9]/gi, '').length >= 8;

  const spin = useCallback(() => {
    if (drawState === 'spinning') return;
    if (!codeValid) {
      fireToast('Saisissez un code de 8 caractères pour lancer la roue.');
      return;
    }
    const reduce = prefersReducedMotion();
    const idx = Math.floor(Math.random() * 8);
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
    setDrawState('spinning');

    const won = PRIZES[SEGMENT_TO_PRIZE[idx]];
    clearTimeout(spinTimer.current);
    spinTimer.current = setTimeout(() => {
      setPrize(won);
      setDrawState('won');
    }, dur * 1000 + 160);
  }, [codeValid, drawState, fireToast, rotation]);

  const resetDraw = useCallback(() => {
    setDrawState('idle');
    setPrize(null);
  }, []);

  const value = useMemo(
    () => ({
      code,
      setCode,
      codeValid,
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
    [code, setCode, codeValid, drawState, prize, rotation, spinDuration, spin, resetDraw, toastMsg, fireToast, hideToast]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
