import { useGame } from '../../context/useGame';
import './layout.css';

export default function Toast() {
  const { toastMsg, hideToast } = useGame();
  if (!toastMsg) return null;

  return (
    <div className="ttt-toast" role="status">
      <span style={{ color: 'var(--gold)', fontSize: 18 }}>✦</span>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{toastMsg}</div>
      <button className="ttt-toast-close" onClick={hideToast} aria-label="Fermer">
        ×
      </button>
    </div>
  );
}
