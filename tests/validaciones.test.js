import { describe, it, expect } from 'vitest';
import { validarRegistro, validarAcceso, validarServicio, validarHorarioDia } from '../src/lib/validaciones.js';

describe('validarRegistro (RF-01)', () => {
  const base = { nombre: 'Ana', correo: 'ana@correo.com', contrasena: '12345678', rol: 'proveedor' };
  it('acepta datos válidos', () => expect(validarRegistro(base).valido).toBe(true));
  it('rechaza contraseña de 7 caracteres (valor límite)', () => {
    expect(validarRegistro({ ...base, contrasena: '1234567' }).errores.contrasena).toBeDefined();
  });
  it('rechaza correo sin dominio', () => {
    expect(validarRegistro({ ...base, correo: 'ana@' }).errores.correo).toBeDefined();
  });
  it('rechaza un rol fuera de la lista', () => {
    expect(validarRegistro({ ...base, rol: 'admin' }).errores.rol).toBeDefined();
  });
  it('rechaza nombre vacío', () => {
    expect(validarRegistro({ ...base, nombre: '   ' }).errores.nombre).toBeDefined();
  });
});

describe('validarAcceso (RF-01)', () => {
  it('pide la contraseña', () => {
    expect(validarAcceso({ correo: 'ana@correo.com', contrasena: '' }).valido).toBe(false);
  });
});

describe('validarServicio (RF-02)', () => {
  const base = { nombre: 'Corte de cabello', duracionMin: 60, precio: 250 };
  it('acepta un servicio válido', () => expect(validarServicio(base).valido).toBe(true));
  it.each([
    [14, false], [15, true], [480, true], [481, false], [30.5, false],
  ])('duración %s minutos es válida: %s', (duracionMin, esperado) => {
    expect(validarServicio({ ...base, duracionMin }).valido).toBe(esperado);
  });
  it.each([
    [-1, false], [0, true], [100000, true], [100001, false], [99.999, false], ['', false],
  ])('precio %s es válido: %s', (precio, esperado) => {
    expect(validarServicio({ ...base, precio }).valido).toBe(esperado);
  });
  it('rechaza nombre de 81 caracteres (valor límite)', () => {
    expect(validarServicio({ ...base, nombre: 'a'.repeat(81) }).errores.nombre).toBeDefined();
  });
});

describe('validarHorarioDia (RF-04)', () => {
  it('un día inactivo siempre es válido', () => {
    expect(validarHorarioDia({ activo: false }).valido).toBe(true);
  });
  it('la hora de fin debe ser posterior a la de inicio', () => {
    expect(validarHorarioDia({ activo: true, hora_inicio: '18:00', hora_fin: '09:00' }).valido).toBe(false);
    expect(validarHorarioDia({ activo: true, hora_inicio: '09:00', hora_fin: '09:00' }).valido).toBe(false);
    expect(validarHorarioDia({ activo: true, hora_inicio: '09:00', hora_fin: '18:00' }).valido).toBe(true);
  });
});
