import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import './styles/tokens.css';
import './styles/app.css';
import { configurado } from './lib/supabase.js';
import { ProveedorSesion, useSesion } from './contexto/Sesion.jsx';
import Encabezado from './components/Encabezado.jsx';
import Acceso from './pages/Acceso.jsx';
import MisServicios from './pages/MisServicios.jsx';
import MiHorario from './pages/MiHorario.jsx';
import Proveedores from './pages/Proveedores.jsx';
import Reservar from './pages/Reservar.jsx';

function Protegida({ rol, children }) {
  const { perfil, cargando } = useSesion();
  if (cargando) return <p className="contenedor secundario">Cargando…</p>;
  if (!perfil) return <Navigate to="/acceso" replace />;
  if (rol && perfil.rol !== rol) return <Navigate to="/" replace />;
  return children;
}

function Inicio() {
  const { perfil, cargando } = useSesion();
  if (cargando) return <p className="contenedor secundario">Cargando…</p>;
  if (!perfil) return <Navigate to="/acceso" replace />;
  return <Navigate to={perfil.rol === 'proveedor' ? '/proveedor/servicios' : '/proveedores'} replace />;
}

function App() {
  return (
    <ProveedorSesion>
      <HashRouter>
        <Encabezado />
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/acceso" element={<Acceso />} />
          <Route path="/proveedor/servicios" element={<Protegida rol="proveedor"><MisServicios /></Protegida>} />
          <Route path="/proveedor/horario" element={<Protegida rol="proveedor"><MiHorario /></Protegida>} />
          <Route path="/proveedores" element={<Protegida rol="consumidor"><Proveedores /></Protegida>} />
          <Route path="/proveedores/:proveedorId" element={<Protegida rol="consumidor"><Reservar /></Protegida>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ProveedorSesion>
  );
}

const raiz = createRoot(document.getElementById('root'));
raiz.render(
  <StrictMode>
    {configurado ? <App /> : (
      <main className="contenedor">
        <div className="alerta alerta--error">Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env</div>
      </main>
    )}
  </StrictMode>,
);
