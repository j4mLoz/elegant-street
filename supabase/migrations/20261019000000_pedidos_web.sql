-- ═══════════════════════════════════════════════════════════════════════
-- Elegant Street · Web de pedidos · migración única
--
-- Crea: ajustes, productos, jornadas, pedidos, pedido_items y visitas,
-- más las funciones públicas estado_servicio, crear_pedido y
-- registrar_visita.
--
-- Seguridad: RLS activo en TODAS las tablas y SIN políticas. Nadie con la
-- llave pública puede leer ni escribir tablas directamente. El público solo
-- usa las 3 funciones de abajo (security definer), que validan todo.
-- Sebas ve y edita los datos desde el Table Editor de Supabase.
--
-- Se puede pegar completo en el SQL Editor de un proyecto nuevo.
-- ═══════════════════════════════════════════════════════════════════════

create schema if not exists private;
revoke all on schema private from public;

-- ───────────────────────────────────────────────────────────────────────
-- 1. Ajustes (una sola fila): días de servicio, horario, cupo, domicilio
-- ───────────────────────────────────────────────────────────────────────
create table public.ajustes (
  id smallint primary key default 1 check (id = 1),
  -- 0 = domingo, 1 = lunes … 5 = viernes, 6 = sábado
  dias_servicio smallint[] not null default '{5,6,0}'
    check (dias_servicio <@ '{0,1,2,3,4,5,6}'::smallint[]),
  abre_a time not null default '16:00',
  cierra_a time not null default '22:00',
  -- Cupo de hamburguesas por día (unidades, no pedidos)
  cupo_por_dia integer not null default 30 check (cupo_por_dia between 0 and 1000),
  -- Valor del domicilio en pesos (0 = gratis)
  domicilio integer not null default 0 check (domicilio between 0 and 100000),
  -- Llave o número para transferencias; vacío = "te la enviamos por WhatsApp"
  llave_transferencia text not null default '' check (char_length(llave_transferencia) <= 200),
  zona_horaria text not null default 'America/Bogota',
  -- Límite anti-spam: máximo de pedidos por teléfono en la ventana de minutos
  max_pedidos_por_telefono smallint not null default 3 check (max_pedidos_por_telefono between 1 and 50),
  ventana_minutos smallint not null default 10 check (ventana_minutos between 1 and 1440),
  updated_at timestamptz not null default now(),
  check (cierra_a > abre_a)
);
comment on table public.ajustes is 'Una sola fila. Días de servicio (0=dom … 6=sáb), horario, cupo por día, domicilio y llave de transferencia.';

insert into public.ajustes (id) values (1);

-- ───────────────────────────────────────────────────────────────────────
-- 2. Productos: el precio se toma SIEMPRE de aquí, nunca del navegador
-- ───────────────────────────────────────────────────────────────────────
create table public.productos (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  nombre text not null check (char_length(nombre) between 1 and 60),
  precio integer not null check (precio between 0 and 1000000),
  activo boolean not null default true,
  orden smallint not null default 0,
  created_at timestamptz not null default now()
);
comment on table public.productos is 'Catálogo. El id debe coincidir con el de la web. Para pausar un producto: activo = false.';

insert into public.productos (id, nombre, precio, orden) values
  ('street-carioca', 'Street Carioca', 30000, 1),
  ('street-abacaxi', 'Street Abacaxi', 30000, 2);

-- ───────────────────────────────────────────────────────────────────────
-- 3. Jornadas: un día de servicio. Si no existe la fila, se usan los
--    valores de "ajustes". Sirve para cambiar el cupo de un día, cerrar un
--    día puntual (abierta = false) o abrir un día extra (p. ej. un festivo).
-- ───────────────────────────────────────────────────────────────────────
create table public.jornadas (
  fecha date primary key,
  abre_a time not null default '16:00',
  cierra_a time not null default '22:00',
  cupo integer not null default 30 check (cupo between 0 and 1000),
  abierta boolean not null default true,
  nota text check (char_length(nota) <= 200),
  created_at timestamptz not null default now(),
  check (cierra_a > abre_a)
);
comment on table public.jornadas is 'Días de servicio. Editar cupo/horario de un día, o abierta=false para cerrarlo. Los días sin fila usan los ajustes.';

-- Las próximas 4 semanas de viernes, sábado y domingo, para que se vean en el Table Editor
insert into public.jornadas (fecha)
select d::date
from generate_series(
  (now() at time zone 'America/Bogota')::date,
  (now() at time zone 'America/Bogota')::date + 27,
  interval '1 day'
) as d
where extract(dow from d)::int in (5, 6, 0)
on conflict do nothing;

-- ───────────────────────────────────────────────────────────────────────
-- 4. Pedidos y sus productos
-- ───────────────────────────────────────────────────────────────────────
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero integer generated always as identity unique,
  jornada date not null references public.jornadas (fecha) on update cascade,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado')),
  cliente text not null check (char_length(cliente) between 2 and 60),
  telefono text not null check (telefono ~ '^3[0-9]{9}$'),
  torre text not null check (char_length(torre) between 1 and 10),
  apto text not null check (char_length(apto) between 1 and 10),
  pago text not null check (pago in ('efectivo', 'transferencia')),
  notas text check (char_length(notas) <= 300),
  -- Resumen legible para el Table Editor: "2x Street Carioca, 1x Street Abacaxi"
  detalle text not null,
  unidades integer not null check (unidades between 1 and 100),
  subtotal integer not null check (subtotal >= 0),
  domicilio integer not null default 0 check (domicilio >= 0),
  total integer not null check (total >= 0),
  -- Atribución: de dónde vino el cliente (?src=ig, tiktok, wa, fb, qr, pauta…)
  origen text not null default 'directo' check (origen ~ '^[a-z0-9_-]{1,30}$'),
  campana text check (char_length(campana) <= 60),
  referrer text check (char_length(referrer) <= 300),
  sesion_id uuid,
  created_at timestamptz not null default now(),
  confirmado_at timestamptz,
  entregado_at timestamptz
);
comment on table public.pedidos is 'Pedidos de la web. Cambiar "estado" a confirmado / en_camino / entregado / cancelado. Un pedido cancelado libera su cupo.';

create index pedidos_jornada_estado_idx on public.pedidos (jornada, estado);
create index pedidos_telefono_creado_idx on public.pedidos (telefono, created_at desc);
create index pedidos_origen_creado_idx on public.pedidos (origen, created_at);

create table public.pedido_items (
  id bigint generated always as identity primary key,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  producto_id text not null references public.productos (id),
  nombre text not null,
  cantidad integer not null check (cantidad between 1 and 10),
  -- Precio copiado del catálogo en el momento del pedido
  precio_unitario integer not null check (precio_unitario >= 0)
);

create index pedido_items_pedido_idx on public.pedido_items (pedido_id);
create index pedido_items_producto_idx on public.pedido_items (producto_id);

-- ───────────────────────────────────────────────────────────────────────
-- 5. Visitas (para "¿de dónde vienen los pedidos?")
-- ───────────────────────────────────────────────────────────────────────
create table public.visitas (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  origen text not null default 'directo' check (origen ~ '^[a-z0-9_-]{1,30}$'),
  campana text check (char_length(campana) <= 60),
  referrer text check (char_length(referrer) <= 300),
  sesion_id uuid not null,
  pidio boolean not null default false
);

create index visitas_origen_creado_idx on public.visitas (origen, created_at);
create index visitas_sesion_idx on public.visitas (sesion_id);

-- Resumen por origen, para mirarlo en el Table Editor (solo el dueño lo ve)
create view public.resumen_por_origen
with (security_invoker = true) as
select
  origen,
  coalesce(v.visitas, 0) as visitas,
  coalesce(p.pedidos, 0) as pedidos,
  coalesce(p.ventas, 0) as ventas,
  case when coalesce(v.visitas, 0) > 0
    then round(100.0 * coalesce(p.pedidos, 0) / v.visitas, 1)
  end as conversion_pct
from (
  select origen, count(*)::int as visitas from public.visitas group by origen
) v
full join (
  select origen, count(*)::int as pedidos, sum(total)::int as ventas
  from public.pedidos where estado <> 'cancelado' group by origen
) p using (origen)
order by pedidos desc nulls last;

-- ───────────────────────────────────────────────────────────────────────
-- 6. Seguridad: RLS activo, sin políticas, sin permisos directos
-- ───────────────────────────────────────────────────────────────────────
alter table public.ajustes enable row level security;
alter table public.productos enable row level security;
alter table public.jornadas enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.visitas enable row level security;

revoke all on table
  public.ajustes, public.productos, public.jornadas,
  public.pedidos, public.pedido_items, public.visitas,
  public.resumen_por_origen
from anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────
-- 7. Funciones internas (esquema private, no expuesto por la API)
-- ───────────────────────────────────────────────────────────────────────

-- Horario y cupo de un día: fila de jornadas si existe; si no, los ajustes
-- cuando es día de servicio. Devuelve 0 filas si ese día no hay servicio.
create or replace function private.jornada_de(p_fecha date)
returns table (abre_a time, cierra_a time, cupo integer, abierta boolean, existe boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select j.abre_a, j.cierra_a, j.cupo, j.abierta, true
  from public.jornadas j
  where j.fecha = p_fecha
  union all
  select a.abre_a, a.cierra_a, a.cupo_por_dia, true, false
  from public.ajustes a
  where a.id = 1
    and extract(dow from p_fecha)::smallint = any (a.dias_servicio)
    and not exists (select 1 from public.jornadas j2 where j2.fecha = p_fecha)
  limit 1;
$$;

-- Unidades ya pedidas en un día (los cancelados no cuentan)
create or replace function private.unidades_usadas(p_fecha date)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(p.unidades), 0)::int
  from public.pedidos p
  where p.jornada = p_fecha and p.estado <> 'cancelado';
$$;

-- Próxima apertura a partir de un instante (hasta 60 días adelante)
create or replace function private.proxima_apertura(p_ahora timestamptz)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_hoy date;
  v_hora time;
  v_dia date;
  j record;
begin
  select a.zona_horaria into v_tz from public.ajustes a where a.id = 1;
  v_hoy := (p_ahora at time zone v_tz)::date;
  v_hora := (p_ahora at time zone v_tz)::time;

  for i in 0..60 loop
    v_dia := v_hoy + i;
    select * into j from private.jornada_de(v_dia);
    if found and j.abierta and (i > 0 or v_hora < j.abre_a) then
      return (v_dia + j.abre_a) at time zone v_tz;
    end if;
  end loop;
  return null;
end;
$$;

-- Estado del servicio en un instante dado (separado para poder probarlo)
create or replace function private.estado_en(p_ahora timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  a public.ajustes;
  v_hoy date;
  v_hora time;
  j record;
  v_usadas integer := 0;
  v_quedan integer := 0;
  v_motivo text;
begin
  select * into a from public.ajustes where id = 1;
  v_hoy := (p_ahora at time zone a.zona_horaria)::date;
  v_hora := (p_ahora at time zone a.zona_horaria)::time;

  select * into j from private.jornada_de(v_hoy);

  if not found or not j.abierta then
    v_motivo := 'cerrado';
  else
    v_usadas := private.unidades_usadas(v_hoy);
    v_quedan := greatest(j.cupo - v_usadas, 0);
    if v_hora < j.abre_a then
      v_motivo := 'antes_de_abrir';
    elsif v_hora >= j.cierra_a then
      v_motivo := 'cerrado';
    elsif v_quedan <= 0 then
      v_motivo := 'cupo_lleno';
    else
      v_motivo := 'abierto';
    end if;
  end if;

  return jsonb_build_object(
    'abierto', v_motivo = 'abierto',
    'motivo', v_motivo,
    'hoy', v_hoy,
    'abre_a', case when j.abre_a is not null then to_char(j.abre_a, 'HH24:MI') end,
    'cierra_a', case when j.cierra_a is not null then to_char(j.cierra_a, 'HH24:MI') end,
    'cupo', j.cupo,
    'quedan', case when v_motivo in ('abierto', 'antes_de_abrir', 'cupo_lleno') then v_quedan end,
    'proxima_apertura', private.proxima_apertura(p_ahora),
    'domicilio', a.domicilio,
    'llave_transferencia', a.llave_transferencia,
    'productos', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'nombre', p.nombre, 'precio', p.precio) order by p.orden)
      from public.productos p where p.activo
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────
-- 8. Funciones públicas (las únicas que puede usar la web)
-- ───────────────────────────────────────────────────────────────────────

-- Estado para pintar la web: abierto, quedan X, próxima apertura, precios
create or replace function public.estado_servicio()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.estado_en(now());
$$;

-- Crea un pedido. Valida datos, horario, cupo y límite por teléfono.
-- El precio se recalcula desde public.productos.
create or replace function public.crear_pedido(
  p_cliente text,
  p_telefono text,
  p_torre text,
  p_apto text,
  p_pago text,
  p_notas text,
  p_items jsonb,
  p_origen text default 'directo',
  p_campana text default null,
  p_referrer text default null,
  p_sesion_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  a public.ajustes;
  v_ahora timestamptz := now();
  v_hoy date;
  v_hora time;
  v_jor public.jornadas;
  v_cliente text := btrim(coalesce(p_cliente, ''));
  v_tel text := regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g');
  v_torre text := btrim(coalesce(p_torre, ''));
  v_apto text := btrim(coalesce(p_apto, ''));
  v_notas text := nullif(btrim(coalesce(p_notas, '')), '');
  v_origen text := lower(btrim(coalesce(p_origen, '')));
  v_items jsonb := '[]'::jsonb;
  v_unidades integer := 0;
  v_subtotal integer := 0;
  v_detalle text;
  v_usadas integer;
  v_recientes integer;
  v_pedido public.pedidos;
  it record;
begin
  select * into a from public.ajustes where id = 1;
  v_hoy := (v_ahora at time zone a.zona_horaria)::date;
  v_hora := (v_ahora at time zone a.zona_horaria)::time;

  -- Datos del cliente
  if length(v_tel) = 12 and left(v_tel, 2) = '57' then
    v_tel := substr(v_tel, 3);
  end if;
  if v_origen !~ '^[a-z0-9_-]{1,30}$' then
    v_origen := 'directo';
  end if;
  if char_length(v_cliente) not between 2 and 60
     or v_tel !~ '^3[0-9]{9}$'
     or char_length(v_torre) not between 1 and 10
     or char_length(v_apto) not between 1 and 10
     or coalesce(p_pago, '') not in ('efectivo', 'transferencia')
     or char_length(coalesce(v_notas, '')) > 300 then
    return jsonb_build_object('ok', false, 'error', 'datos_invalidos');
  end if;

  -- Productos: ids existentes y activos, cantidades de 1 a 10, sin repetir
  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) not between 1 and 10 then
    return jsonb_build_object('ok', false, 'error', 'datos_invalidos');
  end if;

  for it in
    select x.id, sum(x.cantidad)::int as cantidad
    from jsonb_to_recordset(p_items) as x(id text, cantidad int)
    left join public.productos pr on pr.id = x.id
    group by x.id, pr.orden
    order by pr.orden nulls last, x.id
  loop
    if it.cantidad is null or it.cantidad not between 1 and 10 then
      return jsonb_build_object('ok', false, 'error', 'datos_invalidos');
    end if;
    select v_items || jsonb_build_object(
             'producto_id', p.id, 'nombre', p.nombre,
             'cantidad', it.cantidad, 'precio_unitario', p.precio)
      into v_items
    from public.productos p
    where p.id = it.id and p.activo;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'producto_invalido');
    end if;
    v_unidades := v_unidades + it.cantidad;
  end loop;

  select sum((e->>'cantidad')::int * (e->>'precio_unitario')::int)::int,
         string_agg((e->>'cantidad') || 'x ' || (e->>'nombre'), ', ')
    into v_subtotal, v_detalle
  from jsonb_array_elements(v_items) e;

  -- Límite por teléfono
  select count(*) into v_recientes
  from public.pedidos p
  where p.telefono = v_tel
    and p.created_at > v_ahora - make_interval(mins => a.ventana_minutos);
  if v_recientes >= a.max_pedidos_por_telefono then
    return jsonb_build_object('ok', false, 'error', 'demasiados_pedidos');
  end if;

  -- Jornada de hoy: se crea con los ajustes si es día de servicio y no existe
  if not exists (select 1 from public.jornadas j where j.fecha = v_hoy)
     and extract(dow from v_hoy)::smallint = any (a.dias_servicio) then
    insert into public.jornadas (fecha, abre_a, cierra_a, cupo)
    values (v_hoy, a.abre_a, a.cierra_a, a.cupo_por_dia)
    on conflict do nothing;
  end if;

  -- Bloquea la jornada: dos pedidos a la vez no pueden pasarse del cupo
  select * into v_jor from public.jornadas j where j.fecha = v_hoy for update;

  if not found or not v_jor.abierta
     or v_hora < v_jor.abre_a or v_hora >= v_jor.cierra_a then
    return jsonb_build_object(
      'ok', false, 'error', 'fuera_de_horario',
      'proxima_apertura', private.proxima_apertura(v_ahora));
  end if;

  v_usadas := private.unidades_usadas(v_hoy);
  if v_usadas + v_unidades > v_jor.cupo then
    return jsonb_build_object(
      'ok', false, 'error', 'cupo_lleno',
      'quedan', greatest(v_jor.cupo - v_usadas, 0),
      'proxima_apertura', private.proxima_apertura(v_ahora));
  end if;

  insert into public.pedidos (
    jornada, cliente, telefono, torre, apto, pago, notas, detalle,
    unidades, subtotal, domicilio, total,
    origen, campana, referrer, sesion_id
  ) values (
    v_hoy, v_cliente, v_tel, v_torre, v_apto, p_pago, v_notas, v_detalle,
    v_unidades, v_subtotal, a.domicilio, v_subtotal + a.domicilio,
    v_origen, left(nullif(btrim(coalesce(p_campana, '')), ''), 60),
    left(nullif(btrim(coalesce(p_referrer, '')), ''), 300), p_sesion_id
  )
  returning * into v_pedido;

  insert into public.pedido_items (pedido_id, producto_id, nombre, cantidad, precio_unitario)
  select v_pedido.id, e->>'producto_id', e->>'nombre',
         (e->>'cantidad')::int, (e->>'precio_unitario')::int
  from jsonb_array_elements(v_items) e;

  if p_sesion_id is not null then
    update public.visitas set pidio = true
    where sesion_id = p_sesion_id and not pidio;
  end if;

  return jsonb_build_object(
    'ok', true,
    'numero', v_pedido.numero,
    'items', v_items,
    'subtotal', v_pedido.subtotal,
    'domicilio', v_pedido.domicilio,
    'total', v_pedido.total,
    'telefono', v_pedido.telefono,
    'llave_transferencia', a.llave_transferencia,
    'quedan', greatest(v_jor.cupo - v_usadas - v_unidades, 0)
  );
end;
$$;

-- Registra una visita (una por sesión cada 30 minutos)
create or replace function public.registrar_visita(
  p_origen text,
  p_campana text,
  p_referrer text,
  p_sesion_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_origen text := lower(btrim(coalesce(p_origen, '')));
begin
  if p_sesion_id is null then
    return;
  end if;
  if v_origen !~ '^[a-z0-9_-]{1,30}$' then
    v_origen := 'directo';
  end if;
  if exists (
    select 1 from public.visitas v
    where v.sesion_id = p_sesion_id and v.created_at > now() - interval '30 minutes'
  ) then
    return;
  end if;
  insert into public.visitas (origen, campana, referrer, sesion_id)
  values (
    v_origen,
    left(nullif(btrim(coalesce(p_campana, '')), ''), 60),
    left(nullif(btrim(coalesce(p_referrer, '')), ''), 300),
    p_sesion_id
  );
end;
$$;

revoke all on function public.estado_servicio() from public;
revoke all on function public.crear_pedido(text, text, text, text, text, text, jsonb, text, text, text, uuid) from public;
revoke all on function public.registrar_visita(text, text, text, uuid) from public;

grant execute on function public.estado_servicio() to anon, authenticated;
grant execute on function public.crear_pedido(text, text, text, text, text, text, jsonb, text, text, text, uuid) to anon, authenticated;
grant execute on function public.registrar_visita(text, text, text, uuid) to anon, authenticated;
