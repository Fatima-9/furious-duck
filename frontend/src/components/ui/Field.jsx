import './ui.css';

export function FieldRow({ children }) {
  return <div className="field-row">{children}</div>;
}

function Wrapper({ label, id, children }) {
  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

export function Input({ label, id, ...props }) {
  return (
    <Wrapper label={label} id={id}>
      <input id={id} {...props} />
    </Wrapper>
  );
}

export function Select({ label, id, children, ...props }) {
  return (
    <Wrapper label={label} id={id}>
      <select id={id} {...props}>
        {children}
      </select>
    </Wrapper>
  );
}

export function Textarea({ label, id, ...props }) {
  return (
    <Wrapper label={label} id={id}>
      <textarea id={id} {...props} />
    </Wrapper>
  );
}
