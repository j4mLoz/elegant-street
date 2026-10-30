-- ═══════════════════════════════════════════════════════════════════════
-- Elegant Street · Agrega los productos "Clásica" ($28.000) y "Doble" ($33.000)
--
-- Pegar COMPLETO en Supabase -> SQL Editor -> Run. Se puede correr varias veces
-- sin romper nada (idempotente) y NO pisa precios ya cambiados desde el panel.
--
-- Requiere que ya se haya corrido SQL-PARA-PEGAR-ELEGANT.sql (tablas existentes).
-- No cambia permisos: catalogo_web y el menu conservan los GRANT y el RLS
-- definidos allí; la web (anon) sigue sin leer tablas, solo usa crear_pedido().
--
-- Qué hace
--   1. Inserta ambos en catalogo_web (lo que valida el servidor al pedir).
--   2. Los conecta al Menú del panel (productos > Hamburguesa > variantes),
--      así el precio se edita desde el panel igual que Street Carioca/Abacaxi.
-- ═══════════════════════════════════════════════════════════════════════

insert into public.catalogo_web (id, nombre, precio, orden) values
  ('clasica', 'Clásica', 28000, 3),
  ('doble', 'Doble', 33000, 4)
on conflict (id) do nothing;

do $$
declare
  c record;
  v_prod uuid;
  v_var uuid;
begin
  for c in select id, nombre, precio from public.catalogo_web
           where variante_id is null and id in ('clasica', 'doble') loop
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

-- Verificación: debe devolver 4 filas (las 2 nuevas con precio 28000 y 33000)
select c.id, c.nombre, coalesce(v.precio_venta, c.precio) as precio, c.activo, v.id is not null as en_menu
from public.catalogo_web c
left join public.variantes_producto v on v.id = c.variante_id
order by c.orden;
