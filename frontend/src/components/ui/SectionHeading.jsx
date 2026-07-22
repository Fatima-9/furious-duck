export default function SectionHeading({ eyebrow, title, center = false, dark = false, style }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left', ...style }}>
      <div className="ttt-eyebrow" style={dark ? { color: 'var(--gold-soft)' } : undefined}>
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontWeight: 600,
          fontSize: 'clamp(30px,4vw,46px)',
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {title}
      </h2>
    </div>
  );
}
