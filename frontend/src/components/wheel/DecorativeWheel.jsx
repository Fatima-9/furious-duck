import logoEmblemLight from '../../assets/brand/logo-emblem-light.png';

export default function DecorativeWheel() {
  return (
    <div style={{ position: 'relative', display: 'grid', placeItems: 'center', animation: 'ttt-scalein .8s .2s both' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          margin: 'auto',
          width: 270,
          height: 270,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,168,78,.22), transparent 66%)',
        }}
      />
      <svg
        viewBox="0 0 300 300"
        width={300}
        height={300}
        style={{ position: 'relative', filter: 'drop-shadow(0 22px 44px rgba(0,0,0,.5))', animation: 'ttt-spin 44s linear infinite' }}
      >
        <circle cx="150" cy="150" r="146" fill="none" stroke="#C4A84E" strokeWidth="4" />
        <path d="M150,150 L150,6 A144,144 0 0 1 251.8,48.2 Z" fill="#17331F" />
        <path d="M150,150 L251.8,48.2 A144,144 0 0 1 294,150 Z" fill="#22482D" />
        <path d="M150,150 L294,150 A144,144 0 0 1 251.8,251.8 Z" fill="#17331F" />
        <path d="M150,150 L251.8,251.8 A144,144 0 0 1 150,294 Z" fill="#22482D" />
        <path d="M150,150 L150,294 A144,144 0 0 1 48.2,251.8 Z" fill="#17331F" />
        <path d="M150,150 L48.2,251.8 A144,144 0 0 1 6,150 Z" fill="#22482D" />
        <path d="M150,150 L6,150 A144,144 0 0 1 48.2,48.2 Z" fill="#17331F" />
        <path d="M150,150 L48.2,48.2 A144,144 0 0 1 150,6 Z" fill="url(#homeg)" />
        <defs>
          <linearGradient id="homeg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#EBD583" />
            <stop offset="1" stopColor="#C4A84E" />
          </linearGradient>
        </defs>
        <circle cx="150" cy="150" r="36" fill="#0c2012" stroke="#C4A84E" strokeWidth="3" />
      </svg>
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 58,
          height: 58,<w
          borderRadius: '50%',
          background: '#0c2012',
          display: 'grid',
          placeItems: 'center',
          zIndex: 2,
        }}
      >
        <img src={logoEmblemLight} alt="Thé Tip Top" style={{ width: 44, height: 44, objectFit: 'contain' }} />
      </span>
    </div>
  );
}
