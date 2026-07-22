import { useGame } from '../../context/useGame';
import { SEGMENT_LABELS } from '../../data/prizes';

const LABEL_POS = [
  [209.8, 78],
  [266.1, 134],
  [266.1, 214],
  [209.8, 270],
  [130.2, 270],
  [73.9, 214],
  [73.9, 134],
  [130.2, 78],
];

export default function PrizeWheel() {
  const { rotation, spinDuration, isSpinning, spin } = useGame();

  return (
    <div style={{ position: 'relative', width: 340, height: 340, flex: '0 0 auto' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -26,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,168,78,.24), transparent 66%)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          width: 0,
          height: 0,
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderTop: '27px solid var(--gold)',
          filter: 'drop-shadow(0 4px 5px rgba(0,0,0,.45))',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -15,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          width: 15,
          height: 15,
          borderRadius: '50%',
          background: 'var(--gold)',
          boxShadow: '0 0 0 4px rgba(196,168,78,.25)',
        }}
      />

      <svg
        viewBox="0 0 340 340"
        width={340}
        height={340}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'block',
          transformOrigin: '50% 50%',
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? `transform ${spinDuration}s cubic-bezier(.16,.84,.28,1)` : 'none',
          filter: 'drop-shadow(0 22px 44px rgba(0,0,0,.5))',
        }}
      >
        <defs>
          <linearGradient id="play-seggold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#EBD583" />
            <stop offset="1" stopColor="#C4A84E" />
          </linearGradient>
        </defs>
        <circle cx="170" cy="170" r="168" fill="none" stroke="#C4A84E" strokeWidth="4" />
        <path d="M170,170 L170,5 A165,165 0 0 1 286.67,53.33 Z" fill="#17331F" />
        <path d="M170,170 L286.67,53.33 A165,165 0 0 1 335,170 Z" fill="#22482D" />
        <path d="M170,170 L335,170 A165,165 0 0 1 286.67,286.67 Z" fill="#17331F" />
        <path d="M170,170 L286.67,286.67 A165,165 0 0 1 170,335 Z" fill="#22482D" />
        <path d="M170,170 L170,335 A165,165 0 0 1 53.33,286.67 Z" fill="#17331F" />
        <path d="M170,170 L53.33,286.67 A165,165 0 0 1 5,170 Z" fill="#22482D" />
        <path d="M170,170 L5,170 A165,165 0 0 1 53.33,53.33 Z" fill="#17331F" />
        <path d="M170,170 L53.33,53.33 A165,165 0 0 1 170,5 Z" fill="url(#play-seggold)" />
        <g stroke="rgba(196,168,78,.5)" strokeWidth="1.5">
          <line x1="170" y1="170" x2="170" y2="5" />
          <line x1="170" y1="170" x2="286.67" y2="53.33" />
          <line x1="170" y1="170" x2="335" y2="170" />
          <line x1="170" y1="170" x2="286.67" y2="286.67" />
          <line x1="170" y1="170" x2="170" y2="335" />
          <line x1="170" y1="170" x2="53.33" y2="286.67" />
          <line x1="170" y1="170" x2="5" y2="170" />
          <line x1="170" y1="170" x2="53.33" y2="53.33" />
        </g>
        <g fontFamily="Mulish, sans-serif" fontWeight="800" fontSize="12.5" textAnchor="middle" letterSpacing=".3">
          {SEGMENT_LABELS.map((label, i) => (
            <text key={label + i} x={LABEL_POS[i][0]} y={LABEL_POS[i][1]} fill={i === 7 ? '#13260F' : '#E7D49A'}>
              {label}
            </text>
          ))}
        </g>
      </svg>

      <button
        onClick={spin}
        aria-label="Tourner la roue"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 4,
          width: 88,
          height: 88,
          borderRadius: '50%',
          border: '3px solid var(--gold)',
          background: 'radial-gradient(circle at 50% 32%, #2a5738, #0c2012)',
          color: 'var(--gold-soft)',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 12px 28px -8px rgba(0,0,0,.75), inset 0 2px 10px rgba(196,168,78,.3)',
          transition: 'transform .18s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translate(-50%,-50%) scale(1.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translate(-50%,-50%) scale(1)')}
      >
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontWeight: 700, letterSpacing: '.16em' }}>
          TOURNER
        </span>
      </button>
    </div>
  );
}
