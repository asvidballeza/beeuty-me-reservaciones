import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import TarjetaServicio from '../components/TarjetaServicio.jsx';
import { validarServicio } from '../lib/validaciones.js';
import { crearServicio, eliminarServicio, listarServicios } from '../lib/api.js';
import { useSesion } from '../contexto/Sesion.jsx';

const VACIO = { nombre: '', duracionMin: '60', precio: '' };

// RF-02: crear y eliminar servicios
export default function MisServicios() {
  const { perfil } = useSesion();
  const [servicios, setServicios] = useState([]);
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    listarServicios(perfil.id).then(setServicios).catch((e) => setAviso({ tipo: 'error', texto: e.message }));
  }, [perfil.id]);

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  async function agregar(e) {
    e.preventDefault();
    const { valido, errores: nuevos } = validarServicio(datos);
    setErrores(nuevos);
    if (!valido) return;
    try {
      const nuevo = await crearServicio(perfil.id, datos);
      setServicios([...servicios, nuevo]);
      setDatos(VACIO);
      setAviso({ tipo: 'exito', texto: 'Servicio publicado' });
    } catch (error) {
      setAviso({ tipo: 'error', texto: error.message });
    }
  }

  async function quitar(id) {
    try {
      await eliminarServicio(id);
      setServicios(servicios.filter((s) => s.id !== id));
      setAviso({ tipo: 'exito', texto: 'Servicio eliminado' });
    } catch (error) {
      setAviso({ tipo: 'error', texto: error.message });
    }
  }

  return (
    <main className="contenedor pila">
      <h1>Mis servicios</h1>
      <form className="tarjeta pila" onSubmit={agregar} noValidate>
        <h2>Publicar un servicio</h2>
        <Input label="Nombre del servicio" value={datos.nombre} onChange={cambiar('nombre')} error={errores.nombre} placeholder="Corte de cabello" />
        <div className="fila">
          <Input label="Duración (minutos)" type="number" min="15" max="480" step="15" value={datos.duracionMin} onChange={cambiar('duracionMin')} error={errores.duracionMin} />
          <Input label="Precio (MXN)" type="number" min="0" step="0.01" value={datos.precio} onChange={cambiar('precio')} error={errores.precio} />
        </div>
        <Button type="submit">Publicar servicio</Button>
      </form>
      {aviso && <div className={`alerta alerta--${aviso.tipo}`} role="status">{aviso.texto}</div>}
      {servicios.length === 0 ? (
        <p className="secundario">Aún no has publicado servicios.</p>
      ) : (
        <div className="rejilla">
          {servicios.map((s) => (
            <TarjetaServicio key={s.id} servicio={s}
              accion={<Button variant="secondary" size="sm" onClick={() => quitar(s.id)}>Eliminar</Button>} />
          ))}
        </div>
      )}
    </main>
  );
}
