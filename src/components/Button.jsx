/** Botón del design system: variantes primary, secondary y ghost; tamaños sm, md y lg. */
export default function Button({ variant = 'primary', size = 'md', fullWidth = false, selected = false, className = '', ...props }) {
  const clases = [
    'boton', `boton--${variant}`, size !== 'md' && `boton--${size}`,
    fullWidth && 'boton--bloque', selected && 'boton--seleccionado', className,
  ].filter(Boolean).join(' ');
  return <button type="button" className={clases} {...props} />;
}
