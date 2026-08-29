import { useId } from 'react';
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
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <Wrapper label={label} id={fieldId}>
      <input id={fieldId} {...props} />
    </Wrapper>
  );
}

export function Select({ label, id, children, ...props }) {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <Wrapper label={label} id={fieldId}>
      <select id={fieldId} {...props}>
        {children}
      </select>
    </Wrapper>
  );
}

export function Textarea({ label, id, ...props }) {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <Wrapper label={label} id={fieldId}>
      <textarea id={fieldId} {...props} />
    </Wrapper>
  );
}
