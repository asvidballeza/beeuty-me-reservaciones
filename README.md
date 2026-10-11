# Beeuty me! Módulo de reservaciones

Incrementos **I1 (acceso y catálogo)** e **I2 (disponibilidad y reservación)**, versión `v0.2.0`.
Proyecto integrador de la materia Prueba y Mantenimiento de Software (ISU Universidad).

## Requerimientos cubiertos

| ID | Requerimiento | Dónde está |
|---|---|---|
| RF-01 | Registro e inicio de sesión con rol | `src/pages/Acceso.jsx`, `supabase/esquema.sql` (trigger `crear_perfil`) |
| RF-02 | Crear y eliminar servicios | `src/pages/MisServicios.jsx` |
| RF-03 | Consultar el catálogo de un proveedor | `src/pages/Proveedores.jsx`, `src/pages/Reservar.jsx` |
| RF-04 | Horario de atención, un bloque por día | `src/pages/MiHorario.jsx` |
| RF-05 | Calcular horarios disponibles | `src/lib/disponibilidad.js` |
| RF-06 | Reservar sin traslapes | `supabase/esquema.sql` (función `reservar_cita` y restricción `citas_sin_traslape`) |

## Tecnología

React 18 + Vite 5, Supabase (Auth, PostgreSQL y seguridad por fila), Vitest y ESLint.
Los estilos usan los tokens del design system de Beeuty me! (`src/styles/tokens.css`).

## Estructura

```
supabase/esquema.sql      Tablas, seguridad por fila y funciones de la base de datos
src/lib/disponibilidad.js Cálculo de horarios disponibles (funciones puras)
src/lib/validaciones.js   Reglas de validación de formularios
src/lib/api.js            Capa de acceso a datos (Supabase)
src/components/           Button, Input, TarjetaServicio, Encabezado
src/pages/                Pantallas
tests/                    Pruebas unitarias (Vitest)
```

## Cómo ejecutarlo en tu computadora

1. Instala Node.js 20 o superior.
2. Copia `.env.example` como `.env` y llena la URL y la llave anon de Supabase.
3. En la terminal, dentro de esta carpeta:

```bash
npm install
npm test            # pruebas unitarias
npm run lint        # análisis estático
npm run dev         # abre http://localhost:5173
```

## Cómo publicarlo en cPanel

```bash
npm run build       # genera la carpeta dist
```

Sube el **contenido** de `dist` a la carpeta del subdominio de pruebas con el
Administrador de archivos de cPanel. La app usa rutas con `#`, así que no
necesita reglas de reescritura en el servidor.

## Base de datos

Ejecuta `supabase/esquema.sql` completo en Supabase > SQL Editor.
Para pruebas, desactiva "Confirm email" en Authentication > Providers > Email.
Zona horaria del negocio: Ciudad de México (UTC-06:00).
