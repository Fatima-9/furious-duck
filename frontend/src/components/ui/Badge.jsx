import './ui.css';

const VARIANT_CLASS = {
  success: 'badge-success',
  warn: 'badge-warn',
  gold: 'badge-gold',
  'outline-gold': 'badge-outline-gold',
};

export default function Badge({ variant = 'success', className = '', ...props }) {
  const classes = ['badge', VARIANT_CLASS[variant] || VARIANT_CLASS.success, className].filter(Boolean).join(' ');
  return <span className={classes} {...props} />;
}
