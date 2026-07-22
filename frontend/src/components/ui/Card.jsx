import './ui.css';

export default function Card({ hover = false, className = '', style, ...props }) {
  const classes = ['card', hover ? 'card-hover' : '', className].filter(Boolean).join(' ');
  return <div className={classes} style={style} {...props} />;
}
