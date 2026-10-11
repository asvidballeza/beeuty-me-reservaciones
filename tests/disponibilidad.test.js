import { describe, it, expect } from 'vitest';
import {
  aMinutos, aHora, diaSemana, traslapan, calcularHorariosDisponibles,
} from '../src/lib/disponibilidad.js';

const HORARIO = { hora_inicio: '09:00:00', hora_fin: '12:00:00' };
const ANTES = new Date('2026-10-14T12:00:00-06:00'); // un día antes

describe('conversión de horas', () => {
  it('convierte HH:MM y HH:MM:SS a minutos', () => {
    expect(aMinutos('09:30')).toBe(570);
    expect(aMinutos('18:00:00')).toBe(1080);
  });
  it('rechaza horas inválidas', () => {
    expect(() => aMinutos('25:00')).toThrow();
    expect(() => aMinutos('9:00')).toThrow();
  });
  it('convierte minutos a HH:MM', () => {
    expect(aHora(570)).toBe('09:30');
  });
  it('calcula el día de la semana (jueves = 4)', () => {
    expect(diaSemana('2026-10-15')).toBe(4);
  });
});

describe('traslapes', () => {
  it('detecta intervalos que se cruzan', () => {
    expect(traslapan({ inicio: 0, fin: 60 }, { inicio: 30, fin: 90 })).toBe(true);
  });
  it('intervalos contiguos no se traslapan (valor límite)', () => {
    expect(traslapan({ inicio: 0, fin: 60 }, { inicio: 60, fin: 120 })).toBe(false);
  });
});

describe('calcularHorariosDisponibles (RF-05)', () => {
  it('sin horario de atención no hay horarios disponibles', () => {
    expect(calcularHorariosDisponibles({ fecha: '2026-10-15', horario: null, duracionMin: 60, ahora: ANTES })).toEqual([]);
  });

  it('genera horarios cada 30 minutos que caben completos en el horario', () => {
    const r = calcularHorariosDisponibles({ fecha: '2026-10-15', horario: HORARIO, duracionMin: 60, ahora: ANTES });
    expect(r.map((h) => h.etiqueta)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
  });

  it('un servicio que dura exactamente todo el horario tiene un solo horario (valor límite)', () => {
    const r = calcularHorariosDisponibles({ fecha: '2026-10-15', horario: HORARIO, duracionMin: 180, ahora: ANTES });
    expect(r.map((h) => h.etiqueta)).toEqual(['09:00']);
  });

  it('un servicio más largo que el horario no tiene horarios', () => {
    const r = calcularHorariosDisponibles({ fecha: '2026-10-15', horario: HORARIO, duracionMin: 181, ahora: ANTES });
    expect(r).toEqual([]);
  });

  it('excluye los horarios que se traslapan con citas existentes (RF-06)', () => {
    const ocupados = [{ inicio: '2026-10-15T10:00:00-06:00', fin: '2026-10-15T11:00:00-06:00' }];
    const r = calcularHorariosDisponibles({ fecha: '2026-10-15', horario: HORARIO, duracionMin: 60, ocupados, ahora: ANTES });
    expect(r.map((h) => h.etiqueta)).toEqual(['09:00', '11:00']);
  });

  it('acepta citas guardadas en otra zona horaria (UTC)', () => {
    const ocupados = [{ inicio: '2026-10-15T16:00:00Z', fin: '2026-10-15T17:00:00Z' }]; // 10:00 a 11:00 en CDMX
    const r = calcularHorariosDisponibles({ fecha: '2026-10-15', horario: HORARIO, duracionMin: 60, ocupados, ahora: ANTES });
    expect(r.map((h) => h.etiqueta)).toEqual(['09:00', '11:00']);
  });

  it('excluye los horarios que ya pasaron', () => {
    const ahora = new Date('2026-10-15T09:45:00-06:00');
    const r = calcularHorariosDisponibles({ fecha: '2026-10-15', horario: HORARIO, duracionMin: 60, ahora });
    expect(r.map((h) => h.etiqueta)).toEqual(['10:00', '10:30', '11:00']);
  });

  it('regresa inicio y fin en formato ISO con la zona del negocio', () => {
    const [primero] = calcularHorariosDisponibles({ fecha: '2026-10-15', horario: HORARIO, duracionMin: 45, ahora: ANTES });
    expect(primero).toEqual({ etiqueta: '09:00', inicio: '2026-10-15T09:00:00-06:00', fin: '2026-10-15T09:45:00-06:00' });
  });

  it('rechaza duraciones no válidas', () => {
    expect(() => calcularHorariosDisponibles({ fecha: '2026-10-15', horario: HORARIO, duracionMin: 0, ahora: ANTES })).toThrow();
  });
});
