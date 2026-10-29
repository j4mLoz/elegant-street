-- ═══════════════════════════════════════════════════════════════════════
-- Elegant Street · Base de datos UNIFICADA (web de pedidos + panel de control)
--
-- Un solo proyecto Supabase para las dos apps.
--   WEB (publica, llave anon):  ajustes, jornadas, catalogo_web, pedidos,
--                               pedido_items, visitas  -> solo por 3 funciones
--   PANEL (login de Sebas):     categorias_insumo, insumos, movimientos_inventario,
--                               transacciones, productos, variantes_producto,
--                               receta, ventas, compras, compra_items, cierres_caja
--
-- Se pega COMPLETO en Supabase -> SQL Editor -> Run. Se puede correr mas de
-- una vez sin romper nada (idempotente).
--
-- SEGURIDAD
--   * RLS activo en todas las tablas.
--   * anon (la web) NO tiene ningun permiso sobre tablas. Solo puede ejecutar
--     estado_servicio(), crear_pedido() y registrar_visita(). Nunca lee pedidos.
--   * authenticated (Sebas, con correo y clave) lee y escribe lo del panel.
--   * Los GRANT son explicitos: en proyectos nuevos Supabase ya no concede
--     permisos automaticamente a las tablas creadas por SQL.
--   * Esta migracion NO toca Authentication. El proveedor Email debe quedar
--     ENCENDIDO; solo se apaga "Allow new users to sign up" (ver ENTREGA-ELEGANT.md).
--
-- Nota de nombres: la tabla "productos" es la del MENU del panel (uuid). El
-- catalogo de la web se llama "catalogo_web" y se conecta al menu con
-- catalogo_web.variante_id (asi el precio de la web sale del menu).
-- ═══════════════════════════════════════════════════════════════════════

create schema if not exists private;
revoke all on schema private from public;

-- ───────────────────────────────────────────────────────────────────────
-- 1. PANEL · inventario, menu, caja
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.categorias_insumo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 60),
  created_at timestamptz not null default now()
);
create unique index if not exists categorias_insumo_nombre_key
  on public.categorias_insumo (lower(nombre));

create table if not exists public.insumos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 80),
  unidad text not null default 'unidades' check (char_length(unidad) between 1 and 30),
  stock_actual numeric not null default 0 check (stock_actual >= 0),
  stock_minimo numeric not null default 0 check (stock_minimo >= 0),
  categoria_id uuid references public.categorias_insumo (id) on delete set null,
  unidades_por_paquete numeric not null default 1 check (unidades_por_paquete > 0),
  costo_unitario numeric not null default 0 check (costo_unitario >= 0),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists insumos_categoria_idx on public.insumos (categoria_id);

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 80),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.variantes_producto (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id) on delete cascade,
  nombre_variante text not null check (char_length(btrim(nombre_variante)) between 1 and 80),
  precio_venta numeric not null default 0 check (precio_venta >= 0),
  imagen_url text,
  mostrar_en_venta_rapida boolean not null default true,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists variantes_producto_producto_idx on public.variantes_producto (producto_id);

create table if not exists public.receta (
  id uuid primary key default gen_random_uuid(),
  variante_id uuid not null references public.variantes_producto (id) on delete cascade,
  insumo_id uuid not null references public.insumos (id) on delete cascade,
  cantidad_necesaria numeric not null check (cantidad_necesaria > 0),
  unique (variante_id, insumo_id)
);
create index if not exists receta_insumo_idx on public.receta (insumo_id);

-- ───────────────────────────────────────────────────────────────────────
-- 2. WEB · ajustes, jornadas, catalogo, pedidos, visitas
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.ajustes (
  id smallint primary key default 1 check (id = 1),
  -- 0 = domingo, 1 = lunes ... 5 = viernes, 6 = sabado
  dias_servicio smallint[] not null default '{5,6,0}'
    check (dias_servicio <@ '{0,1,2,3,4,5,6}'::smallint[]),
  abre_a time not null default '16:00',
  cierra_a time not null default '22:00',
  cupo_por_dia integer not null default 30 check (cupo_por_dia between 0 and 1000),
  domicilio integer not null default 0 check (domicilio between 0 and 100000),
  llave_transferencia text not null default '' check (char_length(llave_transferencia) <= 200),
  zona_horaria text not null default 'America/Bogota',
  max_pedidos_por_telefono smallint not null default 3 check (max_pedidos_por_telefono between 1 and 50),
  ventana_minutos smallint not null default 10 check (ventana_minutos between 1 and 1440),
  updated_at timestamptz not null default now(),
  check (cierra_a > abre_a)
);
insert into public.ajustes (id) values (1) on conflict (id) do nothing;

-- Catalogo de la web. Si variante_id esta lleno, el PRECIO y si esta ACTIVO
-- salen del menu del panel (variantes_producto); precio/activo de aqui son el respaldo.
create table if not exists public.catalogo_web (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  nombre text not null check (char_length(nombre) between 1 and 60),
  precio integer not null check (precio between 0 and 1000000),
  activo boolean not null default true,
  orden smallint not null default 0,
  variante_id uuid unique references public.variantes_producto (id) on delete set null,
  created_at timestamptz not null default now()
);
insert into public.catalogo_web (id, nombre, precio, orden) values
  ('street-carioca', 'Street Carioca', 30000, 1),
  ('street-abacaxi', 'Street Abacaxi', 30000, 2)
on conflict (id) do nothing;

-- Conecta (una sola vez) cada producto de la web con una variante del menu.
do $$
declare
  c record;
  v_prod uuid;
  v_var uuid;
begin
  for c in select id, nombre, precio from public.catalogo_web
           where variante_id is null and id in ('street-carioca', 'street-abacaxi') loop
    select p.id into v_prod from public.productos p where p.nombre = 'Hamburguesa' limit 1;
    if v_prod is null then
      insert into public.productos (nombre) values ('Hamburguesa') returning id into v_prod;
    end if;
    select v.id into v_var from public.variantes_producto v
      where v.producto_id = v_prod and v.nombre_variante = c.nombre
        and not exists (select 1 from public.catalogo_web w where w.variante_id = v.id)
      limit 1;
    if v_var is null then
      insert into public.variantes_producto (producto_id, nombre_variante, precio_venta)
      values (v_prod, c.nombre, c.precio) returning id into v_var;
    end if;
    update public.catalogo_web set variante_id = v_var where id = c.id;
  end loop;
end $$;

create table if not exists public.jornadas (
  fecha date primary key,
  abre_a time not null default '16:00',
  cierra_a time not null default '22:00',
  cupo integer not null default 30 check (cupo between 0 and 1000),
  abierta boolean not null default true,
  nota text check (char_length(nota) <= 200),
  created_at timestamptz not null default now(),
  check (cierra_a > abre_a)
);
-- Proximas 4 semanas de viernes, sabado y domingo
insert into public.jornadas (fecha)
select d::date
from generate_series(
  (now() at time zone 'America/Bogota')::date,
  (now() at time zone 'America/Bogota')::date + 27,
  interval '1 day'
) as d
where extract(dow from d)::int in (5, 6, 0)
on conflict do nothing;

create table if not exists public.pedidos (
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
  detalle text not null,
  unidades integer not null check (unidades between 1 and 100),
  subtotal integer not null check (subtotal >= 0),
  domicilio integer not null default 0 check (domicilio >= 0),
  total integer not null check (total >= 0),
  origen text not null default 'directo' check (origen ~ '^[a-z0-9_-]{1,30}$'),
  campana text check (char_length(campana) <= 60),
  referrer text check (char_length(referrer) <= 300),
  sesion_id uuid,
  created_at timestamptz not null default now(),
  confirmado_at timestamptz,
  entregado_at timestamptz
);
create index if not exists pedidos_jornada_estado_idx on public.pedidos (jornada, estado);
create index if not exists pedidos_telefono_creado_idx on public.pedidos (telefono, created_at desc);
create index if not exists pedidos_origen_creado_idx on public.pedidos (origen, created_at);
create index if not exists pedidos_creado_idx on public.pedidos (created_at desc);

create table if not exists public.pedido_items (
  id bigint generated always as identity primary key,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  producto_id text not null references public.catalogo_web (id),
  nombre text not null,
  cantidad integer not null check (cantidad between 1 and 10),
  precio_unitario integer not null check (precio_unitario >= 0)
);
create index if not exists pedido_items_pedido_idx on public.pedido_items (pedido_id);
create index if not exists pedido_items_producto_idx on public.pedido_items (producto_id);

create table if not exists public.visitas (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  origen text not null default 'directo' check (origen ~ '^[a-z0-9_-]{1,30}$'),
  campana text check (char_length(campana) <= 60),
  referrer text check (char_length(referrer) <= 300),
  sesion_id uuid not null,
  pidio boolean not null default false
);
create index if not exists visitas_origen_creado_idx on public.visitas (origen, created_at);
create index if not exists visitas_sesion_idx on public.visitas (sesion_id);

-- ───────────────────────────────────────────────────────────────────────
-- 3. PANEL · ventas, compras, caja (dependen de pedidos)
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.transacciones (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  monto numeric not null check (monto >= 0),
  categoria text,
  nota text,
  fecha date not null default ((now() at time zone 'America/Bogota')::date),
  created_at timestamptz not null default now(),
  pedido_id uuid references public.pedidos (id) on delete set null
);
create index if not exists transacciones_fecha_idx on public.transacciones (fecha);
create index if not exists transacciones_pedido_idx on public.transacciones (pedido_id) where pedido_id is not null;

create table if not exists public.movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  insumo_id uuid not null references public.insumos (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'salida')),
  cantidad numeric not null check (cantidad > 0),
  nota text,
  fecha date not null default ((now() at time zone 'America/Bogota')::date),
  created_at timestamptz not null default now(),
  pedido_id uuid references public.pedidos (id) on delete set null
);
create index if not exists movimientos_insumo_idx on public.movimientos_inventario (insumo_id);
create index if not exists movimientos_pedido_idx on public.movimientos_inventario (pedido_id) where pedido_id is not null;

create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  variante_id uuid not null references public.variantes_producto (id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric not null check (precio_unitario >= 0),
  costo_unitario numeric not null default 0 check (costo_unitario >= 0),
  fecha date not null default ((now() at time zone 'America/Bogota')::date),
  created_at timestamptz not null default now(),
  pedido_id uuid references public.pedidos (id) on delete set null
);
create index if not exists ventas_variante_idx on public.ventas (variante_id);
create index if not exists ventas_fecha_idx on public.ventas (fecha);
create index if not exists ventas_pedido_idx on public.ventas (pedido_id) where pedido_id is not null;

create table if not exists public.compras (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default ((now() at time zone 'America/Bogota')::date),
  created_at timestamptz not null default now()
);

create table if not exists public.compra_items (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras (id) on delete cascade,
  insumo_id uuid references public.insumos (id) on delete set null,
  cantidad numeric not null check (cantidad > 0),
  monto numeric not null check (monto >= 0)
);
create index if not exists compra_items_compra_idx on public.compra_items (compra_id);
create index if not exists compra_items_insumo_idx on public.compra_items (insumo_id);

create table if not exists public.cierres_caja (
  fecha date primary key,
  created_at timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────────────────
-- 4. Vistas (security_invoker: respetan RLS del que consulta)
-- ───────────────────────────────────────────────────────────────────────
create or replace view public.vista_resumen_diario with (security_invoker = true) as
select
  t.fecha,
  coalesce(sum(t.monto) filter (where t.tipo = 'ingreso'), 0) as ingresos,
  coalesce(sum(t.monto) filter (where t.tipo = 'gasto'), 0) as gastos,
  coalesce(sum(t.monto) filter (where t.tipo = 'ingreso'), 0)
    - coalesce(sum(t.monto) filter (where t.tipo = 'gasto'), 0) as ganancia_neta
from public.transacciones t
group by t.fecha;

create or replace view public.vista_alertas_stock with (security_invoker = true) as
select i.id, i.nombre, i.unidad, i.stock_actual, i.stock_minimo
from public.insumos i
where i.activo and i.stock_actual <= i.stock_minimo;

create or replace view public.vista_rentabilidad_productos with (security_invoker = true) as
select
  v.id as variante_id,
  p.nombre as producto,
  v.nombre_variante as variante,
  v.precio_venta,
  coalesce(sum(r.cantidad_necesaria * i.costo_unitario), 0) as costo,
  v.precio_venta - coalesce(sum(r.cantidad_necesaria * i.costo_unitario), 0) as margen
from public.variantes_producto v
join public.productos p on p.id = v.producto_id
left join public.receta r on r.variante_id = v.id
left join public.insumos i on i.id = r.insumo_id
group by v.id, p.nombre, v.nombre_variante, v.precio_venta;

-- Catalogo vigente de la web (privado: solo lo leen las funciones de abajo)
create or replace view private.catalogo_vigente as
select
  c.id,
  c.nombre,
  coalesce(v.precio_venta, c.precio)::integer as precio,
  (c.activo and coalesce(v.activo, true)) as activo,
  c.orden,
  c.variante_id
from public.catalogo_web c
left join public.variantes_producto v on v.id = c.variante_id;

-- ───────────────────────────────────────────────────────────────────────
-- 5. Triggers del panel (stock, ventas, compras)
-- ───────────────────────────────────────────────────────────────────────

-- Cada movimiento mueve el stock. Una salida mayor al stock se rechaza.
create or replace function private.ajustar_stock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.tipo = 'entrada' then
      update public.insumos set stock_actual = stock_actual + new.cantidad where id = new.insumo_id;
    else
      update public.insumos set stock_actual = stock_actual - new.cantidad
      where id = new.insumo_id and stock_actual >= new.cantidad;
      if not found then
        raise exception 'Stock insuficiente para el insumo %', new.insumo_id
          using errcode = 'check_violation';
      end if;
    end if;
    return new;
  else
    -- Al borrar un movimiento se revierte su efecto
    if old.tipo = 'entrada' then
      update public.insumos set stock_actual = stock_actual - old.cantidad where id = old.insumo_id;
    else
      update public.insumos set stock_actual = stock_actual + old.cantidad where id = old.insumo_id;
    end if;
    return old;
  end if;
end;
$$;

drop trigger if exists trg_ajustar_stock on public.movimientos_inventario;
create trigger trg_ajustar_stock
  after insert or delete on public.movimientos_inventario
  for each row execute function private.ajustar_stock();

-- La venta congela el precio (si no viene) y el costo de la receta
create or replace function private.congelar_precio_costo_venta()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.precio_unitario is null then
    select v.precio_venta into new.precio_unitario
    from public.variantes_producto v where v.id = new.variante_id;
  end if;
  select coalesce(sum(r.cantidad_necesaria * i.costo_unitario), 0) into new.costo_unitario
  from public.receta r
  join public.insumos i on i.id = r.insumo_id
  where r.variante_id = new.variante_id;
  return new;
end;
$$;

drop trigger if exists trg_congelar_precio_costo_venta on public.ventas;
create trigger trg_congelar_precio_costo_venta
  before insert on public.ventas
  for each row execute function private.congelar_precio_costo_venta();

-- Una venta entra a caja y descuenta el inventario segun la receta
create or replace function private.registrar_venta()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_nombre text;
begin
  select p.nombre || ' ' || v.nombre_variante into v_nombre
  from public.variantes_producto v join public.productos p on p.id = v.producto_id
  where v.id = new.variante_id;

  insert into public.transacciones (tipo, monto, categoria, nota, fecha, pedido_id)
  values ('ingreso', new.precio_unitario * new.cantidad, 'Ventas',
          new.cantidad || 'x ' || coalesce(v_nombre, 'venta'), new.fecha, new.pedido_id);

  insert into public.movimientos_inventario (insumo_id, tipo, cantidad, nota, fecha, pedido_id)
  select r.insumo_id, 'salida', r.cantidad_necesaria * new.cantidad, 'Venta', new.fecha, new.pedido_id
  from public.receta r
  where r.variante_id = new.variante_id;

  return new;
end;
$$;

drop trigger if exists trg_registrar_venta on public.ventas;
create trigger trg_registrar_venta
  after insert on public.ventas
  for each row execute function private.registrar_venta();

-- Una compra sube el inventario y resta de la caja
create or replace function private.registrar_compra_item()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_fecha date;
  v_nombre text;
begin
  select c.fecha into v_fecha from public.compras c where c.id = new.compra_id;
  if new.insumo_id is not null then
    select i.nombre into v_nombre from public.insumos i where i.id = new.insumo_id;
    insert into public.movimientos_inventario (insumo_id, tipo, cantidad, nota, fecha)
    values (new.insumo_id, 'entrada', new.cantidad, 'Compra', v_fecha);
  end if;
  insert into public.transacciones (tipo, monto, categoria, nota, fecha)
  values ('gasto', new.monto, 'Compras', coalesce(v_nombre, 'Compra'), v_fecha);
  return new;
end;
$$;

drop trigger if exists trg_registrar_compra_item on public.compra_items;
create trigger trg_registrar_compra_item
  after insert on public.compra_items
  for each row execute function private.registrar_compra_item();

-- ───────────────────────────────────────────────────────────────────────
-- 6. Triggers de pedidos: el estado manda
--    pendiente -> confirmado -> en_camino -> entregado   (o cancelado)
--    * confirmado: crea las ventas (caja + inventario por receta) y el domicilio
--    * cancelado desde confirmado/en_camino: deshace caja e inventario
--    Funciona igual desde el panel o desde el Table Editor.
-- ───────────────────────────────────────────────────────────────────────
create or replace function private.pedido_cambio_estado()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_hoy date;
  it record;
begin
  if new.estado = old.estado then
    return new;
  end if;

  if not (
    (old.estado = 'pendiente' and new.estado in ('confirmado', 'cancelado'))
    or (old.estado = 'confirmado' and new.estado in ('en_camino', 'entregado', 'cancelado'))
    or (old.estado = 'en_camino' and new.estado in ('entregado', 'cancelado'))
  ) then
    raise exception 'Cambio de estado no permitido: % a %', old.estado, new.estado
      using errcode = 'check_violation';
  end if;

  if new.estado = 'confirmado' then
    select (now() at time zone a.zona_horaria)::date into v_hoy from public.ajustes a where a.id = 1;
    if exists (select 1 from public.cierres_caja c where c.fecha = v_hoy) then
      raise exception 'La caja de hoy esta cerrada. Reabrela para confirmar el pedido.'
        using errcode = 'check_violation';
    end if;

    for it in
      select pi.cantidad, pi.precio_unitario, pi.nombre, c.variante_id
      from public.pedido_items pi
      left join public.catalogo_web c on c.id = pi.producto_id
      where pi.pedido_id = new.id
    loop
      if it.variante_id is null then
        raise exception 'El producto "%" no esta conectado al menu del panel.', it.nombre
          using errcode = 'check_violation';
      end if;
      insert into public.ventas (variante_id, cantidad, precio_unitario, fecha, pedido_id)
      values (it.variante_id, it.cantidad, it.precio_unitario, v_hoy, new.id);
    end loop;

    if new.domicilio > 0 then
      insert into public.transacciones (tipo, monto, categoria, nota, fecha, pedido_id)
      values ('ingreso', new.domicilio, 'Domicilios', 'Pedido #' || new.numero, v_hoy, new.id);
    end if;
    new.confirmado_at := now();

  elsif new.estado = 'entregado' then
    new.entregado_at := now();

  elsif new.estado = 'cancelado' and old.estado in ('confirmado', 'en_camino') then
    -- Primero el inventario (el trigger de stock revierte solo), luego caja y ventas
    delete from public.movimientos_inventario where pedido_id = new.id;
    delete from public.transacciones where pedido_id = new.id;
    delete from public.ventas where pedido_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_pedido_cambio_estado on public.pedidos;
create trigger trg_pedido_cambio_estado
  before update of estado on public.pedidos
  for each row execute function private.pedido_cambio_estado();

-- ───────────────────────────────────────────────────────────────────────
-- 7. Funciones internas de la web (esquema private, no expuesto por la API)
-- ───────────────────────────────────────────────────────────────────────
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
      from private.catalogo_vigente p where p.activo
    ), '[]'::jsonb)
  );
end;
$$;

-- ───────────────────────────────────────────────────────────────────────
-- 8. Funciones publicas de la web (las UNICAS que puede usar anon)
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.estado_servicio()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.estado_en(now());
$$;

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

  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) not between 1 and 10 then
    return jsonb_build_object('ok', false, 'error', 'datos_invalidos');
  end if;

  for it in
    select x.id, sum(x.cantidad)::int as cantidad
    from jsonb_to_recordset(p_items) as x(id text, cantidad int)
    left join private.catalogo_vigente pr on pr.id = x.id
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
    from private.catalogo_vigente p
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

  select count(*) into v_recientes
  from public.pedidos p
  where p.telefono = v_tel
    and p.created_at > v_ahora - make_interval(mins => a.ventana_minutos);
  if v_recientes >= a.max_pedidos_por_telefono then
    return jsonb_build_object('ok', false, 'error', 'demasiados_pedidos');
  end if;

  if not exists (select 1 from public.jornadas j where j.fecha = v_hoy)
     and extract(dow from v_hoy)::smallint = any (a.dias_servicio) then
    insert into public.jornadas (fecha, abre_a, cierra_a, cupo)
    values (v_hoy, a.abre_a, a.cierra_a, a.cupo_por_dia)
    on conflict do nothing;
  end if;

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

-- ¿De donde vienen los pedidos? (solo el panel; respeta RLS)
create or replace function public.resumen_por_origen(p_dias integer default 30)
returns table (origen text, visitas integer, pedidos integer, ventas integer, conversion_pct numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  with lim as (select now() - make_interval(days => greatest(coalesce(p_dias, 30), 1)) as desde),
  v as (
    select x.origen, count(*)::int as visitas
    from public.visitas x, lim where x.created_at >= lim.desde group by x.origen
  ),
  p as (
    select y.origen, count(*)::int as pedidos, coalesce(sum(y.total), 0)::int as ventas
    from public.pedidos y, lim
    where y.created_at >= lim.desde and y.estado <> 'cancelado' group by y.origen
  )
  select coalesce(v.origen, p.origen),
         coalesce(v.visitas, 0),
         coalesce(p.pedidos, 0),
         coalesce(p.ventas, 0),
         case when coalesce(v.visitas, 0) > 0
           then least(round(100.0 * coalesce(p.pedidos, 0) / v.visitas, 1), 100) end
  from v full join p on p.origen = v.origen
  order by 3 desc, 2 desc;
$$;

-- ───────────────────────────────────────────────────────────────────────
-- 9. Seguridad: RLS + politicas + GRANTs explicitos
-- ───────────────────────────────────────────────────────────────────────
alter table public.categorias_insumo enable row level security;
alter table public.insumos enable row level security;
alter table public.productos enable row level security;
alter table public.variantes_producto enable row level security;
alter table public.receta enable row level security;
alter table public.ajustes enable row level security;
alter table public.catalogo_web enable row level security;
alter table public.jornadas enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.visitas enable row level security;
alter table public.transacciones enable row level security;
alter table public.movimientos_inventario enable row level security;
alter table public.ventas enable row level security;
alter table public.compras enable row level security;
alter table public.compra_items enable row level security;
alter table public.cierres_caja enable row level security;

-- Politicas: solo "authenticated" (Sebas) y nunca sesiones anonimas.
-- anon no tiene NINGUNA politica: no puede leer ni escribir tablas.
do $$
declare
  t text;
  op text;
  -- tabla -> operaciones permitidas
  reglas constant text[][] := array[
    ['categorias_insumo', 'select,insert,update,delete'],
    ['insumos', 'select,insert,update,delete'],
    ['productos', 'select,insert,update,delete'],
    ['variantes_producto', 'select,insert,update,delete'],
    ['receta', 'select,insert,update,delete'],
    ['transacciones', 'select,insert,update,delete'],
    ['movimientos_inventario', 'select,insert,update,delete'],
    ['ventas', 'select,insert,update,delete'],
    ['compras', 'select,insert,update,delete'],
    ['compra_items', 'select,insert,update,delete'],
    ['cierres_caja', 'select,insert,delete'],
    ['ajustes', 'select,update'],
    ['catalogo_web', 'select,insert,update,delete'],
    ['jornadas', 'select,insert,update,delete'],
    ['pedidos', 'select,update'],
    ['pedido_items', 'select'],
    ['visitas', 'select']
  ];
  i int;
begin
  for i in 1 .. array_length(reglas, 1) loop
    t := reglas[i][1];
    foreach op in array string_to_array(reglas[i][2], ',') loop
      execute format('drop policy if exists %I on public.%I', 'dueno_' || op, t);
      if op = 'insert' then
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (coalesce((select auth.jwt() ->> ''is_anonymous'')::boolean, false) is false)',
          'dueno_' || op, t);
      elsif op = 'update' then
        execute format(
          'create policy %I on public.%I for update to authenticated using (coalesce((select auth.jwt() ->> ''is_anonymous'')::boolean, false) is false) with check (coalesce((select auth.jwt() ->> ''is_anonymous'')::boolean, false) is false)',
          'dueno_' || op, t);
      else
        execute format(
          'create policy %I on public.%I for %s to authenticated using (coalesce((select auth.jwt() ->> ''is_anonymous'')::boolean, false) is false)',
          'dueno_' || op, t, op);
      end if;
    end loop;
  end loop;
end $$;

-- GRANTs de tablas
grant usage on schema public to anon, authenticated, service_role;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select, insert, update, delete on
  public.categorias_insumo, public.insumos, public.productos, public.variantes_producto,
  public.receta, public.transacciones, public.movimientos_inventario, public.ventas,
  public.compras, public.compra_items, public.catalogo_web, public.jornadas
to authenticated;
grant select, insert, delete on public.cierres_caja to authenticated;
grant select, update on public.ajustes to authenticated;
grant select on public.pedidos, public.pedido_items, public.visitas to authenticated;
-- Del pedido, el panel solo puede cambiar el estado (lo demas lo fija la web)
grant update (estado) on public.pedidos to authenticated;
grant select on public.vista_resumen_diario, public.vista_alertas_stock,
  public.vista_rentabilidad_productos to authenticated;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- GRANTs de funciones: por defecto Postgres da EXECUTE a todos; se cierra y se abre lo necesario
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

grant execute on function public.estado_servicio() to anon, authenticated, service_role;
grant execute on function public.crear_pedido(text, text, text, text, text, text, jsonb, text, text, text, uuid)
  to anon, authenticated, service_role;
grant execute on function public.registrar_visita(text, text, text, uuid)
  to anon, authenticated, service_role;
grant execute on function public.resumen_por_origen(integer) to authenticated, service_role;

-- ───────────────────────────────────────────────────────────────────────
-- 10. Fotos del menu (Storage): lectura publica por URL, escritura solo Sebas
-- ───────────────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('productos-imagenes', 'productos-imagenes', true)
    on conflict (id) do nothing;

    drop policy if exists "dueno sube fotos" on storage.objects;
    create policy "dueno sube fotos" on storage.objects for insert to authenticated
      with check (bucket_id = 'productos-imagenes');
    drop policy if exists "dueno ve fotos" on storage.objects;
    create policy "dueno ve fotos" on storage.objects for select to authenticated
      using (bucket_id = 'productos-imagenes');
    drop policy if exists "dueno cambia fotos" on storage.objects;
    create policy "dueno cambia fotos" on storage.objects for update to authenticated
      using (bucket_id = 'productos-imagenes') with check (bucket_id = 'productos-imagenes');
    drop policy if exists "dueno borra fotos" on storage.objects;
    create policy "dueno borra fotos" on storage.objects for delete to authenticated
      using (bucket_id = 'productos-imagenes');
  end if;
end $$;
