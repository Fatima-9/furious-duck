import './ui.css';

const VARIANT_CLASS = {
  solid: 'btn-solid',
  gold: 'btn-gold',
  'outline-light': 'btn-outline-light',
  'outline-green': 'btn-outline-green',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export default function Button({
  as: Component = 'button',
  variant = 'solid',
  size = 'md',
  block = false,
  className = '',
  type,
  ...props
}) {
  const classes = [
    'btn',
    `btn-${size}`,
    VARIANT_CLASS[variant] || VARIANT_CLASS.solid,
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <Component type={Component === 'button' ? type || 'button' : undefined} className={classes} {...props} />;
}
