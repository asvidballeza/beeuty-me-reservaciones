/**
 * Capa de acceso a datos. Concentra las llamadas a Supabase para que las
 * pantallas no dependan directamente de la base de datos (pruebas de integración).
 */
import { supabase } from './supabase.js';
import { aISO, diaSemana } from './disponibilidad.js';

function revisar({ data, error }) {
  if (error) throw new Error(traducirError(error.message));
  return data;
}

export function traducirError(mensaje = '') {
  if (mensaje.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos';
  if (mensaje.includes('User already registered')) return 'Ya existe una cuenta con ese correo';
  if (mensaje.includes('citas_servicio_id_fkey')) return 'No puedes eliminar un servicio que tiene citas';
  if (mensaje.includes('row-level security')) return 'No tienes permiso para realizar esta acción';
  return mensaje || 'Ocurrió un error inesperado';
}

// RF-01
export async function registrarse({ nombre, correo, contrasena, rol }) {
  return revisar(await supabase.auth.signUp({
    email: correo.trim(), password: contrasena, options: { data: { nombre: nombre.trim(), rol } },
  }));
}
export async function iniciarSesion({ correo, contrasena }) {
  return revisar(await supabase.auth.signInWithPassword({ email: correo.trim(), password: contrasena }));
}
export async function cerrarSesion() {
  return revisar(await supabase.auth.signOut());
}
export async function obtenerPerfil(id) {
  return revisar(await supabase.from('perfiles').select('*').eq('id', id).single());
}

// RF-02 y RF-03
export async function listarServicios(proveedorId) {
  return revisar(await supabase.from('servicios').select('*').eq('proveedor_id', proveedorId).order('creado_en'));
}
export async function crearServicio(proveedorId, { nombre, duracionMin, precio }) {
  return revisar(await supabase.from('servicios').insert({
    proveedor_id: proveedorId, nombre: nombre.trim(), duracion_min: Number(duracionMin), precio: Number(precio),
  }).select().single());
}
export async function eliminarServicio(id) {
  return revisar(await supabase.from('servicios').delete().eq('id', id));
}
export async function listarProveedores() {
  return revisar(await supabase.from('perfiles').select('id, nombre').eq('rol', 'proveedor').order('nombre'));
}

// RF-04
export async function obtenerHorario(proveedorId) {
  return revisar(await supabase.from('horarios').select('*').eq('proveedor_id', proveedorId));
}
export async function guardarHorario(proveedorId, dias) {
  revisar(await supabase.from('horarios').delete().eq('proveedor_id', proveedorId));
  const activos = dias.filter((d) => d.activo).map((d) => ({
    proveedor_id: proveedorId, dia_semana: d.dia_semana, hora_inicio: d.hora_inicio, hora_fin: d.hora_fin,
  }));
  if (activos.length) revisar(await supabase.from('horarios').insert(activos));
}

// RF-05 y RF-06
export async function obtenerDatosDelDia(proveedorId, fecha) {
  const [horarios, ocupados] = await Promise.all([
    supabase.from('horarios').select('*').eq('proveedor_id', proveedorId).eq('dia_semana', diaSemana(fecha)),
    supabase.rpc('horarios_ocupados', {
      p_proveedor: proveedorId, p_desde: aISO(fecha, 0), p_hasta: aISO(fecha, 24 * 60 - 1),
    }),
  ]);
  return { horario: revisar(horarios)[0] ?? null, ocupados: revisar(ocupados) };
}
export async function reservarCita(servicioId, inicio) {
  return revisar(await supabase.rpc('reservar_cita', { p_servicio: servicioId, p_inicio: inicio }));
}
