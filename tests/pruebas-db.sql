\set ON_ERROR_STOP on
begin;
-- Hoy (lunes) no es día de servicio: cerrado y próxima apertura viernes 16:00
select 'estado_lunes' t, public.estado_servicio()->>'motivo' motivo, public.estado_servicio()->>'proxima_apertura' prox;
-- Pedido un lunes => fuera de horario
select 'pedido_lunes' t, public.crear_pedido('Ana','3001234567','3','502','efectivo',null,'[{"id":"street-carioca","cantidad":1}]');
-- Abrimos hoy todo el día con cupo 5
insert into public.jornadas (fecha, abre_a, cierra_a, cupo) values ((now() at time zone 'America/Bogota')::date, '00:00', '23:59', 5);
select 'estado_abierto' t, public.estado_servicio()->>'motivo', public.estado_servicio()->>'quedan';
-- Pedido OK con teléfono +57 y origen
select 'pedido_ok' t, public.crear_pedido('Ana','+57 300 123 4567','3','502','transferencia','sin cebolla','[{"id":"street-carioca","cantidad":2},{"id":"street-abacaxi","cantidad":1}]','IG','finde',null, gen_random_uuid());
-- Producto inexistente
select 'producto_malo' t, public.crear_pedido('Ana','3001234568','3','502','efectivo',null,'[{"id":"gratis","cantidad":1}]')->>'error';
-- Cupo: quedan 2, pido 3
select 'cupo_lleno' t, public.crear_pedido('Beto','3001234569','1','101','efectivo',null,'[{"id":"street-abacaxi","cantidad":3}]');
-- Pido 2 => OK; ahora estado cupo_lleno
select 'ultimo' t, public.crear_pedido('Beto','3001234569','1','101','efectivo',null,'[{"id":"street-abacaxi","cantidad":2}]')->>'ok';
select 'estado_lleno' t, public.estado_servicio()->>'motivo', public.estado_servicio()->>'quedan';
-- Cancelar libera cupo
update public.pedidos set estado='cancelado' where cliente='Beto';
select 'tras_cancelar' t, public.estado_servicio()->>'quedan';
-- Límite por teléfono (3 en 10 min)
update public.jornadas set cupo = 100 where fecha=(now() at time zone 'America/Bogota')::date;
select 'lim1' t, public.crear_pedido('Caro','3110000000','2','201','efectivo',null,'[{"id":"street-carioca","cantidad":1}]')->>'ok';
select 'lim2' t, public.crear_pedido('Caro','3110000000','2','201','efectivo',null,'[{"id":"street-carioca","cantidad":1}]')->>'ok';
select 'lim3' t, public.crear_pedido('Caro','3110000000','2','201','efectivo',null,'[{"id":"street-carioca","cantidad":1}]')->>'ok';
select 'lim4' t, public.crear_pedido('Caro','3110000000','2','201','efectivo',null,'[{"id":"street-carioca","cantidad":1}]')->>'error';
-- Datos inválidos
select 'tel_malo' t, public.crear_pedido('Ana','12345','3','502','efectivo',null,'[{"id":"street-carioca","cantidad":1}]')->>'error';
select 'cant_mala' t, public.crear_pedido('Ana','3001112222','3','502','efectivo',null,'[{"id":"street-carioca","cantidad":11}]')->>'error';
-- Día cerrado manualmente
update public.jornadas set abierta=false where fecha=(now() at time zone 'America/Bogota')::date;
select 'cerrado_manual' t, public.crear_pedido('Ana','3001112223','3','502','efectivo',null,'[{"id":"street-carioca","cantidad":1}]')->>'error';
-- Antes de abrir (simulado con private.estado_en): viernes 23-oct 15:00 Bogotá
select 'vie_15h' t, private.estado_en('2026-10-23 15:00-05')->>'motivo', private.estado_en('2026-10-23 15:00-05')->>'proxima_apertura';
select 'vie_17h' t, private.estado_en('2026-10-23 17:00-05')->>'motivo';
select 'vie_23h' t, private.estado_en('2026-10-23 23:00-05')->>'motivo', private.estado_en('2026-10-23 23:00-05')->>'proxima_apertura';
select 'dom_23h' t, private.estado_en('2026-10-25 23:00-05')->>'proxima_apertura';
select numero, origen, campana, telefono, detalle, subtotal, total, estado from public.pedidos order by numero;
select * from public.resumen_por_origen;
-- RLS como anon
set local role anon;
select 'anon_lee_pedidos' t, count(*) from public.pedidos;
