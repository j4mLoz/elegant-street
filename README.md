# Elegant Street · Web de pedidos

**Para quién:** Elegant Street (Sebastián), una cocina oculta de hamburguesas con domicilio dentro de la Unidad Siempre Verde.
**Qué hace:** los clientes ven el menú (Street Carioca y Street Abacaxi), piden con torre y apartamento, el pedido queda guardado en Supabase y se abre WhatsApp (311 374 9498) con el pedido ya escrito para confirmarlo. Respeta el horario (vie/sáb/dom desde las 4:00 p. m.) y el cupo del día (30 por defecto), y guarda de qué canal viene cada cliente (`?src=`).

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind 4
- Server Action + zod para crear pedidos
- Supabase (Postgres): RLS cerrado; el público solo usa las funciones `estado_servicio`, `crear_pedido` y `registrar_visita`
- Despliegue: Netlify (adaptador oficial OpenNext, que se detecta solo)

## Correr en local
```bash
cp .env.example .env.local   # y llena SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev                  # http://localhost:3001
```
Para probar con una base local: `supabase start` con la migración de `supabase/migrations/`.

## Estructura
- `src/app/page.tsx`: página (dinámica: consulta horario y cupo en cada visita)
- `src/app/acciones.ts`: Server Actions `crearPedido` (zod + campo trampa) y `registrarVisita`
- `src/components/Carrito.tsx`: carrito, formulario y confirmación con WhatsApp
- `src/lib/atribucion.ts`: `?src=` guardado 7 días desde la primera visita
- `src/data/menu.ts`: textos y fotos de los productos (el precio real viene de la tabla `productos`)
- `public/productos/*.jpg`: fotos. **Para cambiarlas, reemplaza el archivo con el mismo nombre.**
- `supabase/migrations/…_pedidos_web.sql`: toda la base. La copia `SQL-PARA-PEGAR.sql` es para el SQL Editor.

## Desplegar
Ver **[DESPLIEGUE-NETLIFY.md](DESPLIEGUE-NETLIFY.md)**.

## Estado (19-oct-2026)
- Hecho y probado contra un Supabase local: pedido real, cupo lleno, fuera de horario, campo trampa, límite por teléfono, `src` guardado y `/admin` de demo eliminado.
- Pendiente de Sebas: fotos definitivas, llave de transferencia, si cobra domicilio y la hora de cierre (por defecto 10:00 p. m.).
- Siguiente fase:
  1. Página protegida de pedidos (login de Sebas) con cambio de estado y la tarjeta "¿De dónde vienen los pedidos?".
  2. Conexión con caja e inventario del panel de control.
  3. Anti-spam extra (Cloudflare Turnstile o límite por IP) si aparecen pedidos falsos.
