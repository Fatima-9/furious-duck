import './ui.css';

export default function StatCard({ label, value, foot, dark = false, valueStyle }) {
  const classes = ['kpi', dark ? 'kpi-dark' : ''].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={valueStyle}>
        {value}
      </div>
      {foot && <div className="kpi-foot">{foot}</div>}
    </div>
  );
}
