/**
 * Reglas de validación de los formularios (RF-01, RF-02, RF-04).
 * Cada función regresa un objeto { valido, errores } donde errores
 * asocia el nombre del campo con un mensaje para la persona usuaria.
 */

export const ROLES = ['proveedor', 'consumidor'];
export const DURACION_MIN = 15;
export const DURACION_MAX = 480;
export const PRECIO_MAX = 100000;

function resultado(errores) {
  return { valido: Object.keys(errores).length === 0, errores };
}

export function validarRegistro({ nombre = '', correo = '', contrasena = '', rol = '' }) {
  const errores = {};
  const limpio = nombre.trim();
  if (limpio.length < 1) errores.nombre = 'Escribe tu nombre';
  else if (limpio.length > 80) errores.nombre = 'El nombre no puede tener más de 80 caracteres';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) errores.correo = 'Escribe un correo válido';
  if (contrasena.length < 8) errores.contrasena = 'La contraseña debe tener al menos 8 caracteres';
  if (!ROLES.includes(rol)) errores.rol = 'Elige si eres proveedor o consumidor';
  return resultado(errores);
}

export function validarAcceso({ correo = '', contrasena = '' }) {
  const errores = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) errores.correo = 'Escribe un correo válido';
  if (contrasena.length === 0) errores.contrasena = 'Escribe tu contraseña';
  return resultado(errores);
}

export function validarServicio({ nombre = '', duracionMin, precio }) {
  const errores = {};
  const limpio = String(nombre).trim();
  if (limpio.length < 1) errores.nombre = 'Escribe el nombre del servicio';
  else if (limpio.length > 80) errores.nombre = 'El nombre no puede tener más de 80 caracteres';

  const duracion = Number(duracionMin);
  if (!Number.isInteger(duracion) || duracion < DURACION_MIN || duracion > DURACION_MAX) {
    errores.duracionMin = `La duración debe ser un número entero entre ${DURACION_MIN} y ${DURACION_MAX} minutos`;
  }

  const monto = Number(precio);
  if (precio === '' || precio === null || precio === undefined || Number.isNaN(monto)) {
    errores.precio = 'Escribe el precio';
  } else if (monto < 0 || monto > PRECIO_MAX) {
    errores.precio = `El precio debe estar entre 0 y ${PRECIO_MAX.toLocaleString('es-MX')}`;
  } else if (Math.round(monto * 100) !== monto * 100) {
    errores.precio = 'El precio admite máximo dos decimales';
  }
  return resultado(errores);
}

export function validarHorarioDia({ activo, hora_inicio = '', hora_fin = '' }) {
  const errores = {};
  if (!activo) return resultado(errores);
  if (!hora_inicio) errores.hora_inicio = 'Indica la hora de inicio';
  if (!hora_fin) errores.hora_fin = 'Indica la hora de fin';
  if (hora_inicio && hora_fin && hora_fin <= hora_inicio) {
    errores.hora_fin = 'La hora de fin debe ser posterior a la de inicio';
  }
  return resultado(errores);
}
