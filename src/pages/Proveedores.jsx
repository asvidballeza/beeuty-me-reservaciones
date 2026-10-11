import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarProveedores } from '../lib/api.js';

// Punto de entrada del consumidor para llegar al catálogo de cada proveedor (RF-03)
export default function Proveedores() {
  const [proveedores, setProveedores] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { listarProveedores().then(setProveedores).catch((e) => setError(e.message)); }, []);

  return (
    <main className="contenedor pila">
      <p className="ceja">Profesionales</p>
      <h1>Belleza cerca de ti</h1>
      {error && <div className="alerta alerta--error" role="alert">{error}</div>}
      {proveedores === null ? <p className="secundario">Cargando…</p>
        : proveedores.length === 0 ? <p className="secundario">Todavía no hay profesionales registrados.</p>
          : (
            <div className="rejilla">
              {proveedores.map((p) => (
                <Link key={p.id} to={`/proveedores/${p.id}`} className="tarjeta" style={{ textDecoration: 'none' }}>
                  <h3>{p.nombre}</h3>
                  <span className="secundario">Ver servicios y reservar</span>
                </Link>
              ))}
            </div>
          )}
    </main>
  );
}
