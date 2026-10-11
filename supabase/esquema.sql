-- Beeuty me! Módulo de reservaciones
-- Esquema de base de datos para Supabase (PostgreSQL)
-- Ejecutar completo en: Supabase > SQL Editor > New query > Run

create extension if not exists btree_gist;

-- 1. Perfiles: uno por usuario registrado, con su rol
create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  rol text not null check (rol in ('proveedor', 'consumidor')),
  creado_en timestamptz not null default now()
);

-- 2. Servicios que publica cada proveedor (RF-02)
create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.perfiles(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  duracion_min integer not null check (duracion_min between 15 and 480),
  precio numeric(10, 2) not null check (precio >= 0 and precio <= 100000),
  creado_en timestamptz not null default now()
);

-- 3. Horario de atención: un bloque por día de la semana (RF-04)
--    dia_semana: 0 = domingo ... 6 = sábado
create table public.horarios (
  proveedor_id uuid not null references public.perfiles(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin time not null,
  primary key (proveedor_id, dia_semana),
  check (hora_fin > hora_inicio)
);

-- 4. Citas (RF-06). La restricción de exclusión impide que dos citas
--    confirmadas del mismo proveedor se traslapen, incluso si llegan
--    al mismo tiempo (RNF-03).
create table public.citas (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.perfiles(id) on delete cascade,
  consumidor_id uuid not null references public.perfiles(id) on delete cascade,
  servicio_id uuid not null references public.servicios(id) on delete restrict,
  inicio timestamptz not null,
  fin timestamptz not null,
  estado text not null default 'confirmada' check (estado in ('confirmada', 'cancelada')),
  creado_en timestamptz not null default now(),
  check (fin > inicio),
  constraint citas_sin_traslape exclude using gist (
    proveedor_id with =,
    tstzrange(inicio, fin, '[)') with &&
  ) where (estado = 'confirmada')
);

-- 5. Crear el perfil automáticamente al registrarse (RF-01)
create function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, rol)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'rol', 'consumidor')
  );
  return new;
end;
$$;

create trigger al_crear_usuario
after insert on auth.users
for each row execute function public.crear_perfil();

-- 6. Seguridad por fila (RNF-02)
alter table public.perfiles enable row level security;
alter table public.servicios enable row level security;
alter table public.horarios enable row level security;
alter table public.citas enable row level security;

create function public.es_proveedor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'proveedor');
$$;

create policy "perfiles visibles" on public.perfiles
  for select to authenticated using (true);
create policy "editar mi perfil" on public.perfiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "servicios visibles" on public.servicios
  for select to authenticated using (true);
create policy "proveedor crea servicios" on public.servicios
  for insert to authenticated with check (proveedor_id = auth.uid() and public.es_proveedor());
create policy "proveedor elimina servicios" on public.servicios
  for delete to authenticated using (proveedor_id = auth.uid());

create policy "horarios visibles" on public.horarios
  for select to authenticated using (true);
create policy "proveedor gestiona su horario" on public.horarios
  for all to authenticated
  using (proveedor_id = auth.uid())
  with check (proveedor_id = auth.uid() and public.es_proveedor());

-- Cada usuario solo ve sus propias citas. No hay políticas de insert,
-- update ni delete: las citas solo se crean con la función reservar_cita.
create policy "ver mis citas" on public.citas
  for select to authenticated
  using (consumidor_id = auth.uid() or proveedor_id = auth.uid());

-- 7. Horarios ocupados de un proveedor (solo inicio y fin, sin datos
--    personales), para calcular los horarios disponibles (RF-05)
create function public.horarios_ocupados(p_proveedor uuid, p_desde timestamptz, p_hasta timestamptz)
returns table (inicio timestamptz, fin timestamptz)
language sql stable security definer set search_path = public as $$
  select c.inicio, c.fin
  from citas c
  where c.proveedor_id = p_proveedor
    and c.estado = 'confirmada'
    and c.inicio < p_hasta
    and c.fin > p_desde;
$$;

-- 8. Reservar una cita (RF-06). Valida rol, servicio, fecha futura y
--    horario de atención; el traslape lo impide la restricción de la tabla.
--    Zona horaria del negocio: Ciudad de México.
create function public.reservar_cita(p_servicio uuid, p_inicio timestamptz)
returns public.citas
language plpgsql security definer set search_path = public as $$
declare
  v_servicio servicios;
  v_horario horarios;
  v_inicio_local timestamp;
  v_fin timestamptz;
  v_fin_local timestamp;
  v_cita citas;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para reservar';
  end if;
  if not exists (select 1 from perfiles where id = auth.uid() and rol = 'consumidor') then
    raise exception 'Solo los consumidores pueden reservar citas';
  end if;

  select * into v_servicio from servicios where id = p_servicio;
  if not found then
    raise exception 'El servicio no existe';
  end if;

  if p_inicio <= now() then
    raise exception 'No puedes reservar en un horario que ya pasó';
  end if;

  v_fin := p_inicio + make_interval(mins => v_servicio.duracion_min);
  v_inicio_local := p_inicio at time zone 'America/Mexico_City';
  v_fin_local := v_fin at time zone 'America/Mexico_City';

  select * into v_horario from horarios
  where proveedor_id = v_servicio.proveedor_id
    and dia_semana = extract(dow from v_inicio_local);

  if not found
     or v_inicio_local::time < v_horario.hora_inicio
     or v_fin_local::time > v_horario.hora_fin
     or v_fin_local::date <> v_inicio_local::date then
    raise exception 'El horario elegido está fuera del horario de atención';
  end if;

  insert into citas (proveedor_id, consumidor_id, servicio_id, inicio, fin)
  values (v_servicio.proveedor_id, auth.uid(), p_servicio, p_inicio, v_fin)
  returning * into v_cita;

  return v_cita;
exception
  when exclusion_violation then
    raise exception 'Ese horario acaba de ser reservado por alguien más';
end;
$$;

revoke execute on function public.horarios_ocupados(uuid, timestamptz, timestamptz) from anon;
revoke execute on function public.reservar_cita(uuid, timestamptz) from anon;

-- 9. Permisos explícitos para el rol de usuarios autenticados
--    (la seguridad por fila sigue limitando qué filas ve y modifica cada quien)
grant usage on schema public to authenticated;
grant select on public.perfiles, public.servicios, public.horarios, public.citas to authenticated;
grant update on public.perfiles to authenticated;
grant insert, delete on public.servicios to authenticated;
grant insert, update, delete on public.horarios to authenticated;
grant execute on function public.horarios_ocupados(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.reservar_cita(uuid, timestamptz) to authenticated;
