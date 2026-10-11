import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import { validarAcceso, validarRegistro } from '../lib/validaciones.js';
import { iniciarSesion, registrarse } from '../lib/api.js';
import { useSesion } from '../contexto/Sesion.jsx';

// RF-01: registro e inicio de sesión con rol
export default function Acceso() {
  const { perfil } = useSesion();
  const [modo, setModo] = useState('entrar');
  const [datos, setDatos] = useState({ nombre: '', correo: '', contrasena: '', rol: 'consumidor' });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (perfil) return <Navigate to="/" replace />;

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setMensaje(null);
    const { valido, errores: nuevos } = modo === 'entrar' ? validarAcceso(datos) : validarRegistro(datos);
    setErrores(nuevos);
    if (!valido) return;
    setEnviando(true);
    try {
      if (modo === 'entrar') await iniciarSesion(datos);
      else await registrarse(datos);
    } catch (error) {
      setMensaje(error.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="contenedor">
      <section className="acceso tarjeta">
        <h1>Beeuty me!</h1>
        <p className="secundario" style={{ textAlign: 'center' }}>Reserva con quien mejor te trata, cuando te queda.</p>
        <div className="pestanas" role="tablist">
          <Button variant={modo === 'entrar' ? 'primary' : 'ghost'} role="tab" aria-selected={modo === 'entrar'} onClick={() => setModo('entrar')}>Iniciar sesión</Button>
          <Button variant={modo === 'registro' ? 'primary' : 'ghost'} role="tab" aria-selected={modo === 'registro'} onClick={() => setModo('registro')}>Crear cuenta</Button>
        </div>
        <form className="pila" onSubmit={enviar} noValidate>
          {modo === 'registro' && (
            <>
              <Input label="Nombre" value={datos.nombre} onChange={cambiar('nombre')} error={errores.nombre} autoComplete="name" />
              <div className={`campo${errores.rol ? ' campo--error' : ''}`}>
                <label htmlFor="rol">¿Cómo usarás Beeuty me!?</label>
                <select id="rol" value={datos.rol} onChange={cambiar('rol')}>
                  <option value="consumidor">Quiero reservar servicios</option>
                  <option value="proveedor">Ofrezco servicios de belleza</option>
                </select>
              </div>
            </>
          )}
          <Input label="Correo" type="email" value={datos.correo} onChange={cambiar('correo')} error={errores.correo} autoComplete="email" />
          <Input label="Contraseña" type="password" value={datos.contrasena} onChange={cambiar('contrasena')} error={errores.contrasena}
            helper={modo === 'registro' ? 'Mínimo 8 caracteres' : undefined} autoComplete={modo === 'registro' ? 'new-password' : 'current-password'} />
          {mensaje && <div className="alerta alerta--error" role="alert">{mensaje}</div>}
          <Button type="submit" fullWidth disabled={enviando}>
            {enviando ? 'Un momento…' : modo === 'entrar' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </form>
      </section>
    </main>
  );
}
