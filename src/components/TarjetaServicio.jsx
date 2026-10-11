const formatoPrecio = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** Tarjeta de servicio construida sobre los tokens del design system. */
export default function TarjetaServicio({ servicio, accion }) {
  return (
    <article className="tarjeta pila" data-testid="tarjeta-servicio">
      <div>
        <h3>{servicio.nombre}</h3>
        <p className="secundario">{servicio.duracion_min} minutos</p>
      </div>
      <div className="fila" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="precio">{formatoPrecio.format(servicio.precio)}</span>
        {accion}
      </div>
    </article>
  );
}
