import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import { validarHorarioDia } from '../lib/validaciones.js';
import { guardarHorario, obtenerHorario } from '../lib/api.js';
import { useSesion } from '../contexto/Sesion.jsx';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ORDEN = [1, 2, 3, 4, 5, 6, 0];

// RF-04: horario semanal de atención, un bloque por día
export default function MiHorario() {
  const { perfil } = useSesion();
  const [dias, setDias] = useState(DIAS.map((_, i) => ({ dia_semana: i, activo: false, hora_inicio: '09:00', hora_fin: '18:00' })));
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    obtenerHorario(perfil.id).then((guardados) => {
      setDias((actuales) => actuales.map((d) => {
        const g = guardados.find((x) => x.dia_semana === d.dia_semana);
        return g ? { ...d, activo: true, hora_inicio: g.hora_inicio.slice(0, 5), hora_fin: g.hora_fin.slice(0, 5) } : d;
      }));
    }).catch((e) => setAviso({ tipo: 'error', texto: e.message }));
  }, [perfil.id]);

  const actualizar = (dia, campo, valor) => setDias(dias.map((d) => (d.dia_semana === dia ? { ...d, [campo]: valor } : d)));

  async function guardar() {
    const nuevos = {};
    dias.forEach((d) => {
      const r = validarHorarioDia(d);
      if (!r.valido) nuevos[d.dia_semana] = r.errores;
    });
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;
    try {
      await guardarHorario(perfil.id, dias);
      setAviso({ tipo: 'exito', texto: 'Horario guardado' });
    } catch (error) {
      setAviso({ tipo: 'error', texto: error.message });
    }
  }

  return (
    <main className="contenedor pila">
      <h1>Mi horario de atención</h1>
      <p className="secundario">Marca los días que atiendes y tu hora de inicio y fin. Hora del centro de México.</p>
      <section className="tarjeta">
        {ORDEN.map((i) => {
          const d = dias[i];
          return (
            <div className="dia-fila" key={i}>
              <label className="check">
                <input type="checkbox" checked={d.activo} onChange={(e) => actualizar(i, 'activo', e.target.checked)} />
                {DIAS[i]}
              </label>
              <Input label="Inicio" type="time" value={d.hora_inicio} disabled={!d.activo}
                onChange={(e) => actualizar(i, 'hora_inicio', e.target.value)} error={errores[i]?.hora_inicio} />
              <Input label="Fin" type="time" value={d.hora_fin} disabled={!d.activo}
                onChange={(e) => actualizar(i, 'hora_fin', e.target.value)} error={errores[i]?.hora_fin} />
            </div>
          );
        })}
      </section>
      {aviso && <div className={`alerta alerta--${aviso.tipo}`} role="status">{aviso.texto}</div>}
      <Button onClick={guardar}>Guardar horario</Button>
    </main>
  );
}
