import { Link, useNavigate } from 'react-router-dom';
import Button from './Button.jsx';
import { useSesion } from '../contexto/Sesion.jsx';
import { cerrarSesion } from '../lib/api.js';

export default function Encabezado() {
  const { perfil } = useSesion();
  const navegar = useNavigate();
  async function salir() {
    await cerrarSesion();
    navegar('/acceso');
  }
  return (
    <header className="encabezado">
      <Link to="/" className="marca" aria-label="Beeuty me!, inicio">Beeuty me!<span className="corazon" aria-hidden="true">♥</span></Link>
      {perfil && (
        <nav aria-label="Principal">
          {perfil.rol === 'proveedor' ? (
            <>
              <Link to="/proveedor/servicios">Mis servicios</Link>
              <Link to="/proveedor/horario">Mi horario</Link>
            </>
          ) : (
            <Link to="/proveedores">Profesionales</Link>
          )}
          <span className="usuario">{perfil.nombre} · {perfil.rol}</span>
          <Button variant="ghost" size="sm" onClick={salir}>Cerrar sesión</Button>
        </nav>
      )}
    </header>
  );
}
