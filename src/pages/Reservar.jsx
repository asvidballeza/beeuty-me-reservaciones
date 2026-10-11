import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import TarjetaServicio from '../components/TarjetaServicio.jsx';
import { calcularHorariosDisponibles } from '../lib/disponibilidad.js';
import { listarProveedores, listarServicios, obtenerDatosDelDia, reservarCita } from '../lib/api.js';

function hoy() {
  // Fecha actual en la zona del negocio (UTC-06:00)
  return new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// RF-03 (catálogo), RF-05 (horarios disponibles) y RF-06 (reservación)
export default function Reservar() {
  const { proveedorId } = useParams();
  const [proveedor, setProveedor] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [servicio, setServicio] = useState(null);
  const [fecha, setFecha] = useState(hoy());
  const [dia, setDia] = useState({ horario: null, ocupados: [] });
  const [elegido, setElegido] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [confirmada, setConfirmada] = useState(null);

  useEffect(() => {
    listarProveedores().then((ps) => setProveedor(ps.find((p) => p.id === proveedorId) ?? null));
    listarServicios(proveedorId).then(setServicios).catch((e) => setAviso({ tipo: 'error', texto: e.message }));
  }, [proveedorId]);

  useEffect(() => {
    if (!servicio || !fecha) return;
    setElegido(null);
    obtenerDatosDelDia(proveedorId, fecha).then(setDia).catch((e) => setAviso({ tipo: 'error', texto: e.message }));
  }, [proveedorId, servicio, fecha]);

  const disponibles = useMemo(() => (servicio
    ? calcularHorariosDisponibles({ fecha, horario: dia.horario, duracionMin: servicio.duracion_min, ocupados: dia.ocupados })
    : []), [servicio, fecha, dia]);

  async function confirmar() {
    setAviso(null);
    try {
      await reservarCita(servicio.id, elegido.inicio);
      setConfirmada({ servicio: servicio.nombre, fecha, hora: elegido.etiqueta });
    } catch (error) {
      setAviso({ tipo: 'error', texto: error.message });
      setDia(await obtenerDatosDelDia(proveedorId, fecha));
    }
  }

  if (confirmada) {
    return (
      <main className="contenedor">
        <section className="tarjeta pila" style={{ maxWidth: 520 }}>
          <p className="ceja">Cita confirmada</p>
          <h1>¡Listo! Tu cita está agendada</h1>
          <p>{confirmada.servicio} con {proveedor?.nombre}, el {confirmada.fecha} a las {confirmada.hora}.</p>
          <Link to="/proveedores">Volver a profesionales</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="contenedor pila">
      <Link to="/proveedores">← Profesionales</Link>
      <h1>{proveedor?.nombre ?? 'Servicios'}</h1>
      {aviso && <div className={`alerta alerta--${aviso.tipo}`} role="alert">{aviso.texto}</div>}
      <h2>1. Elige un servicio</h2>
      {servicios.length === 0 ? <p className="secundario">Este profesional aún no publica servicios.</p> : (
        <div className="rejilla">
          {servicios.map((s) => (
            <TarjetaServicio key={s.id} servicio={s} accion={
              <Button size="sm" variant={servicio?.id === s.id ? 'primary' : 'secondary'} onClick={() => setServicio(s)}>
                {servicio?.id === s.id ? 'Elegido' : 'Elegir'}
              </Button>
            } />
          ))}
        </div>
      )}
      {servicio && (
        <section className="tarjeta pila">
          <h2>2. Elige fecha y hora</h2>
          <div style={{ maxWidth: 240 }}>
            <Input label="Fecha" type="date" min={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          {!dia.horario ? <p className="secundario">Este día no hay horario de atención.</p>
            : disponibles.length === 0 ? <p className="secundario">No quedan horarios disponibles este día.</p> : (
              <div className="horarios" role="group" aria-label="Horarios disponibles">
                {disponibles.map((h) => (
                  <Button key={h.inicio} size="sm" variant="secondary" selected={elegido?.inicio === h.inicio} onClick={() => setElegido(h)}>
                    {h.etiqueta}
                  </Button>
                ))}
              </div>
            )}
          <Button disabled={!elegido} onClick={confirmar}>
            {elegido ? `Reservar a las ${elegido.etiqueta}` : 'Elige un horario'}
          </Button>
        </section>
      )}
    </main>
  );
}
