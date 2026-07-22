import './ui.css';

export default function ProgressBar({ label, value, total, color, delay = 0 }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="progress-row">
      <div className="progress-head">
        <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: color, animationDelay: `${delay}s` }}
        />
      </div>
    </div>
  );
}
