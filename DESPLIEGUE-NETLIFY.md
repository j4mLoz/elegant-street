# Publicar la web de pedidos de Elegant Street en Netlify

Son 5 pasos y toman unos 15 minutos. Solo necesitas copiar y pegar.

---

## 1. Crear el proyecto en Supabase

1. Entra a <https://supabase.com> con la **cuenta nueva** de Elegant Street (no con la de siempre).
2. Toca **New project**.
3. Llena así:
   - **Name:** `elegant-street-pedidos`
   - **Database password:** toca **Generate a password** y guárdala en un lugar seguro.
   - **Region:** `East US (North Virginia)`, la más cercana a Colombia.
   - Si aparece la opción **Enable Data API**, déjala **encendida**. La web la necesita.
4. Toca **Create new project** y espera 1 o 2 minutos a que termine.

## 2. Pegar el SQL

1. En el menú de la izquierda abre **SQL Editor**.
2. Toca **New query**.
3. Abre el archivo `SQL-PARA-PEGAR.sql` de este repo, copia **todo** y pégalo.
4. Toca **Run**. Debe salir *"Success. No rows returned"*.
5. Comprueba: abre **Table Editor**. Deben aparecer `ajustes`, `jornadas`, `pedidos`, `pedido_items`, `productos` y `visitas`.

> Si sale un aviso de "destructive operation", es por las líneas `revoke`. Toca **Run this query** igual. No borra nada.

## 3. Copiar la URL y la llave

1. Arriba toca el botón **Connect**, o ve a **Project Settings → API Keys**.
2. Copia estos dos datos:
   - **Project URL**: algo como `https://abcdxyz.supabase.co`
   - **Publishable key**: empieza por `sb_publishable_…`. Si solo ves la llave **anon** (`eyJ…`), esa también sirve.
3. **Nunca** copies la *secret key* ni la *service_role*. Esas no van en la web.

Mientras estás ahí, cierra los registros. Esto evita que alguien cree cuentas en tu base:
**Authentication → Sign In / Providers → apaga "Allow new users to sign up"**.

## 4. Subir la web a Netlify

1. Entra a <https://app.netlify.com>.
2. Toca **Add new project → Import an existing project → GitHub**.
3. Elige el repo **j4mLoz/elegant-street**.
4. En **Branch to deploy** elige **`feat/pedidos-reales`**. Cuando la rama se una a `main`, aquí se cambia a `main`.
5. No toques el comando de build: Netlify lo lee solo de `netlify.toml`.
6. Toca **Add environment variables** y crea estas 3, **con el nombre exacto**:

   | Nombre | Valor |
   |---|---|
   | `SUPABASE_URL` | la Project URL del paso 3 |
   | `SUPABASE_PUBLISHABLE_KEY` | la publishable key (o anon) del paso 3 |
   | `NEXT_PUBLIC_WHATSAPP_NUMERO` | `573113749498` |

7. Toca **Deploy**. Tarda unos 2 minutos. Al terminar te da una dirección como `https://algo.netlify.app`.
8. Opcional: en **Project configuration → Change project name** ponle `elegant-street` y la dirección queda `https://elegant-street.netlify.app`.

> Si cambias una variable después, ve a **Deploys → Trigger deploy → Deploy project** para que tome el cambio.

## 5. Probar con `?src=ig`

1. Abre en el celular: `https://TU-SITIO.netlify.app/?src=ig`
2. Hoy seguramente diga **"Ahora estamos cerrados"**, porque solo abre viernes, sábado y domingo desde las 4:00 p. m. Para probar fuera de horario:
   - En Supabase → **Table Editor → jornadas** toca **Insert row**.
   - En `fecha` pon la fecha de hoy, en `abre_a` pon `00:00` y en `cierra_a` pon `23:59`. Guarda.
3. Recarga la web. Debe decir **"Abiertos ahora · quedan 30 hamburguesas"**.
4. Haz un pedido de prueba. Al final se abre WhatsApp con el pedido escrito, dirigido al 311 374 9498.
5. En Supabase → **Table Editor → pedidos** debe aparecer el pedido con `origen = ig`.
6. Al terminar: borra ese pedido de prueba (o márcalo como `cancelado`) y borra la fila de hoy en `jornadas`.

---

## Links por canal

Cambia `TU-SITIO` por la dirección final. Cada link le dice a la base de dónde vino el cliente.

| Dónde va el link | Link |
|---|---|
| Bio de Instagram | `https://TU-SITIO.netlify.app/?src=ig` |
| Bio de TikTok | `https://TU-SITIO.netlify.app/?src=tiktok` |
| Estados y mensajes de WhatsApp | `https://TU-SITIO.netlify.app/?src=wa` |
| Facebook | `https://TU-SITIO.netlify.app/?src=fb` |
| QR del flyer impreso | `https://TU-SITIO.netlify.app/?src=qr` |
| Anuncios pagados (pauta) | `https://TU-SITIO.netlify.app/?src=pauta` |

- Para separar campañas, agrega `&c=` al final. Ejemplo: `?src=qr&c=flyer-octubre` o `?src=pauta&c=finde-31oct`.
- La fuente queda guardada **7 días** desde la primera visita. Si alguien llega por Instagram y pide 3 días después entrando directo, el pedido igual cuenta como `ig`.
- Antes de imprimir el QR, espera a tener el dominio definitivo. Si la dirección cambia, el QR impreso deja de servir.

## ¿De dónde vienen los pedidos? (por ahora)

En Supabase → **Table Editor → resumen_por_origen** se ven las visitas, los pedidos, las ventas y la conversión de cada canal.

## Lo que Sebas puede cambiar sin tocar código (Table Editor)

| Quiero… | Dónde |
|---|---|
| Ver los pedidos | `pedidos`: la columna `detalle` dice qué pidió; `torre` y `apto` dicen dónde entregar |
| Marcar un pedido | `pedidos.estado`: `confirmado`, `en_camino`, `entregado` o `cancelado`. Un pedido cancelado devuelve su cupo |
| Cambiar el cupo de un día | `jornadas.cupo` en la fila de ese día |
| Cerrar un día puntual | `jornadas.abierta = false` |
| Abrir un día extra (festivo) | En `jornadas`, inserta una fila con esa fecha |
| Cambiar el cupo, el horario o los días por defecto | `ajustes`: `cupo_por_dia`, `abre_a`, `cierra_a` y `dias_servicio` (0 = domingo … 6 = sábado) |
| Cobrar domicilio | `ajustes.domicilio` (en pesos; 0 = gratis) |
| Poner la llave de transferencia | `ajustes.llave_transferencia` (ej. `Nequi 311 374 9498`) |
| Cambiar un precio o pausar un producto | `productos.precio` y `productos.activo` |
