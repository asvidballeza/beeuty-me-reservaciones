/**
 * Casos de prueba de la Actividad 3 que se ejecutan de forma automatizada.
 * CC-04: pruebas de caminos de calcularHorariosDisponibles (V(G) = 7).
 * CE-03: pruebas estructurales con valores límite de validarServicio.
 */
import { describe, it, expect } from 'vitest';
import { calcularHorariosDisponibles as calcular } from '../src/lib/disponibilidad.js';
import { validarServicio } from '../src/lib/validaciones.js';

const fecha = '2026-10-12'; // lunes
const horario = { hora_inicio: '10:00:00', hora_fin: '14:00:00' };
const antes = new Date('2026-10-11T12:00:00-06:00');
const etiquetas = (r) => r.map((x) => x.etiqueta);

describe('CC-04 caminos independientes de calcularHorariosDisponibles', () => {
  it('Camino 1: día sin horario de atención devuelve lista vacía', () => {
    expect(calcular({ fecha, horario: null, duracionMin: 60, ahora: antes })).toEqual([]);
  });
  it('Camino 2: duración no entera lanza error', () => {
    expect(() => calcular({ fecha, horario, duracionMin: 60.5, ahora: antes })).toThrow();
  });
  it('Camino 3: duración entera menor o igual a cero lanza error', () => {
    expect(() => calcular({ fecha, horario, duracionMin: 0, ahora: antes })).toThrow();
  });
  it('Camino 4: el bucle no itera si el servicio es más largo que el horario', () => {
    expect(calcular({ fecha, horario, duracionMin: 300, ahora: antes })).toEqual([]);
  });
  it('Camino 5: omite los horarios que ya pasaron', () => {
    const ahora = new Date('2026-10-12T12:15:00-06:00');
    expect(etiquetas(calcular({ fecha, horario, duracionMin: 60, ahora }))).toEqual(['12:30', '13:00']);
  });
  it('Camino 6: omite los horarios que se traslapan con una cita', () => {
    const ocupados = [{ inicio: '2026-10-12T10:30:00-06:00', fin: '2026-10-12T11:30:00-06:00' }];
    expect(etiquetas(calcular({ fecha, horario, duracionMin: 60, ahora: antes, ocupados }))).toEqual([
      '11:30', '12:00', '12:30', '13:00',
    ]);
  });
  it('Camino 7: día libre ofrece todos los horarios', () => {
    expect(etiquetas(calcular({ fecha, horario, duracionMin: 60, ahora: antes }))).toEqual([
      '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00',
    ]);
  });
  it('Frontera del bucle: una iteración cuando el servicio ocupa todo el bloque', () => {
    expect(etiquetas(calcular({ fecha, horario, duracionMin: 240, ahora: antes }))).toEqual(['10:00']);
  });
});

describe('CE-03 decisiones y valores límite de validarServicio', () => {
  const base = { nombre: 'Corte de cabello', duracionMin: 60, precio: 250 };
  const ok = (cambio) => validarServicio({ ...base, ...cambio }).valido;

  it.each([
    ['nombre vacío', { nombre: '' }, false],
    ['nombre de 80 caracteres', { nombre: 'a'.repeat(80) }, true],
    ['nombre de 81 caracteres', { nombre: 'a'.repeat(81) }, false],
    ['duración 14', { duracionMin: 14 }, false],
    ['duración 15', { duracionMin: 15 }, true],
    ['duración 480', { duracionMin: 480 }, true],
    ['duración 481', { duracionMin: 481 }, false],
    ['duración 60.5', { duracionMin: 60.5 }, false],
    ['precio -1', { precio: -1 }, false],
    ['precio 0', { precio: 0 }, true],
    ['precio 100000', { precio: 100000 }, true],
    ['precio 100001', { precio: 100001 }, false],
    ['precio con tres decimales', { precio: 99.999 }, false],
    ['precio vacío', { precio: '' }, false],
  ])('%s', (_nombre, cambio, esperado) => {
    expect(ok(cambio)).toBe(esperado);
  });
});
