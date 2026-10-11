import { useId } from 'react';

/** Campo de texto del design system: estados default, focus, error y disabled, con etiqueta y ayuda. */
export default function Input({ label, error, helper, id, ...props }) {
  const generado = useId();
  const campoId = id ?? generado;
  const mensajeId = `${campoId}-mensaje`;
  return (
    <div className={`campo${error ? ' campo--error' : ''}`}>
      <label htmlFor={campoId}>{label}</label>
      <input id={campoId} aria-invalid={Boolean(error)} aria-describedby={error || helper ? mensajeId : undefined} {...props} />
      {error ? <span id={mensajeId} className="error" role="alert">{error}</span>
        : helper ? <span id={mensajeId} className="ayuda">{helper}</span> : null}
    </div>
  );
}
