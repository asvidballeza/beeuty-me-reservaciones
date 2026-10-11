/**
 * Lógica de disponibilidad del módulo de reservaciones (RF-05, RF-06).
 * Funciones puras, sin dependencias de React ni de Supabase, para que
 * puedan probarse de forma unitaria.
 *
 * Zona horaria del negocio: Ciudad de México (UTC-06:00, sin horario de verano).
 */

export const ZONA_HORARIA = '-06:00';
export const INTERVALO_MINUTOS = 30;

/** Convierte "HH:MM" o "HH:MM:SS" a minutos desde la medianoche. */
export function aMinutos(hora) {
  if (typeof hora !== 'string' || !/^\d{2}:\d{2}(:\d{2})?$/.test(hora)) {
    throw new Error(`Hora inválida: ${hora}`);
  }
  const [h, m] = hora.split(':').map(Number);
  if (h > 23 || m > 59) throw new Error(`Hora inválida: ${hora}`);
  return h * 60 + m;
}

/** Convierte minutos desde la medianoche a "HH:MM". */
export function aHora(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/** Día de la semana de una fecha "YYYY-MM-DD" (0 = domingo ... 6 = sábado). */
export function diaSemana(fecha) {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

/** Fecha y hora local del negocio en formato ISO con zona horaria. */
export function aISO(fecha, minutos) {
  return `${fecha}T${aHora(minutos)}:00${ZONA_HORARIA}`;
}

/** Dos intervalos [inicio, fin) se traslapan si cada uno empieza antes de que el otro termine. */
export function traslapan(a, b) {
  return a.inicio < b.fin && b.inicio < a.fin;
}

/**
 * Calcula los horarios disponibles de un día.
 *
 * @param {object} p
 * @param {string} p.fecha              Fecha "YYYY-MM-DD".
 * @param {{hora_inicio:string, hora_fin:string}|null} p.horario  Horario de atención de ese día.
 * @param {number} p.duracionMin        Duración del servicio en minutos.
 * @param {{inicio:string, fin:string}[]} [p.ocupados]  Citas confirmadas del proveedor.
 * @param {Date} [p.ahora]              Momento actual (para excluir horarios pasados).
 * @param {number} [p.intervaloMin]     Separación entre horarios ofrecidos.
 * @returns {{etiqueta:string, inicio:string, fin:string}[]}
 */
export function calcularHorariosDisponibles({
  fecha,
  horario,
  duracionMin,
  ocupados = [],
  ahora = new Date(),
  intervaloMin = INTERVALO_MINUTOS,
}) {
  if (!horario) return [];
  if (!Number.isInteger(duracionMin) || duracionMin <= 0) {
    throw new Error('La duración del servicio debe ser un número entero positivo');
  }

  const apertura = aMinutos(horario.hora_inicio);
  const cierre = aMinutos(horario.hora_fin);
  const citas = ocupados.map((c) => ({
    inicio: new Date(c.inicio).getTime(),
    fin: new Date(c.fin).getTime(),
  }));
  const momentoActual = ahora.getTime();
  const disponibles = [];

  for (let inicio = apertura; inicio + duracionMin <= cierre; inicio += intervaloMin) {
    const isoInicio = aISO(fecha, inicio);
    const isoFin = aISO(fecha, inicio + duracionMin);
    const candidato = { inicio: new Date(isoInicio).getTime(), fin: new Date(isoFin).getTime() };

    if (candidato.inicio <= momentoActual) continue;
    if (citas.some((cita) => traslapan(candidato, cita))) continue;

    disponibles.push({ etiqueta: aHora(inicio), inicio: isoInicio, fin: isoFin });
  }

  return disponibles;
}
