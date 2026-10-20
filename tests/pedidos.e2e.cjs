// Uso: con la web en :3200 y un Supabase local (contenedor DB_CONTENEDOR), correr
//   npx -y -p playwright node tests/pedidos.e2e.cjs

// Prueba de punta a punta: web de pedidos Elegant Street contra Supabase local aislado
const { chromium, devices } = require("playwright");
const { execSync } = require("child_process");
const path = require("path");

const URL = process.env.WEB_URL || "http://localhost:3200";
const OUT = process.env.CAPTURAS || path.resolve(__dirname, "capturas");
const EXE = process.env.CHROMIUM ||
  process.env.HOME +
  "/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell";

function sql(q) {
  return execSync(
    `docker exec -i ${process.env.DB_CONTENEDOR || "supabase_db_elegant-pruebas"} psql -U postgres -d postgres -qAt -F'|'`,
    { input: q, encoding: "utf8" },
  ).trim();
}
const HOY = "(now() at time zone 'America/Bogota')::date";
const resultados = [];
function check(nombre, cond, detalle = "") {
  resultados.push({ nombre, ok: !!cond, detalle });
  console.log(`${cond ? "PASA" : "FALLA"}  ${nombre}${detalle ? "  · " + detalle : ""}`);
}

async function nuevoContexto(browser) {
  const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "es-CO" });
  return ctx;
}

async function agregar(page, nombre, veces) {
  for (let i = 0; i < veces; i++) {
    const add = page.getByRole("button", { name: `Agregar ${nombre} al pedido` });
    if (await add.count()) await add.click();
    else await page.getByRole("button", { name: `Sumar una unidad de ${nombre}` }).first().click();
  }
}

async function abrirCarrito(page) {
  await page.getByRole("button", { name: /Abrir mi pedido/ }).click();
  await page.waitForTimeout(600);
}

async function llenar(page, { nombre, tel, torre, apto, pago = "Efectivo", notas = "" }) {
  await page.fill("#c-nombre", nombre);
  await page.fill("#c-telefono", tel);
  await page.fill("#c-torre", torre);
  await page.fill("#c-apto", apto);
  await page.locator("label", { hasText: pago }).click();
  if (notas) await page.fill("#c-notas", notas);
}

(async () => {
  // Base limpia
  sql(`truncate public.pedido_items, public.pedidos, public.visitas restart identity cascade;
       delete from public.jornadas where fecha = ${HOY};
       update public.ajustes set llave_transferencia = '', domicilio = 0;`);

  const browser = await chromium.launch({ executablePath: EXE });

  // ── 1. Fuera de horario (hoy lunes, sin jornada) ──
  {
    const ctx = await nuevoContexto(browser);
    const page = await ctx.newPage();
    await page.goto(`${URL}/?src=ig`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/01-hero-cerrado.png` });
    check("cerrado: aviso en el hero", await page.getByText("Ahora estamos cerrados").first().isVisible());
    await page.locator("#menu").scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/02-menu.png` });
    await agregar(page, "Street Carioca", 1);
    await abrirCarrito(page);
    const boton = page.getByRole("button", { name: "Cerrado por ahora" });
    check("cerrado: botón de pedir deshabilitado", await boton.isDisabled());
    await page.screenshot({ path: `${OUT}/03-carrito-cerrado.png` });
    await page.waitForTimeout(800);
    const v = sql(`select origen from public.visitas order by id desc limit 1`);
    check("visita registrada con src=ig", v === "ig", `visitas.origen=${v}`);
    await ctx.close();
  }

  // ── 2. Abierto: pedido OK con atribución ──
  sql(`insert into public.jornadas (fecha, abre_a, cierra_a, cupo) values (${HOY}, '00:00', '23:59', 30);`);
  let ctxAtrib;
  {
    const ctx = await nuevoContexto(browser);
    ctxAtrib = ctx;
    const page = await ctx.newPage();
    await page.goto(`${URL}/?src=IG&c=finde`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/04-hero-abierto.png` });
    check("abierto: muestra quedan 30", await page.getByText("quedan 30 hamburguesas").first().isVisible());

    await page.locator("#menu").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await agregar(page, "Street Carioca", 2);
    await agregar(page, "Street Abacaxi", 1);
    await abrirCarrito(page);
    await page.getByRole("button", { name: "Hacer pedido" }).click();
    await page.waitForTimeout(500);
    check("validación: errores al enviar vacío", await page.getByText("Cuéntanos tu nombre").isVisible());
    await page.screenshot({ path: `${OUT}/05-errores.png` });

    await llenar(page, {
      nombre: "Laura Gómez",
      tel: "+57 300 123 4567",
      torre: "3",
      apto: "502",
      pago: "Transferencia",
      notas: "Sin tomate",
    });
    await page.locator("#c-nombre").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${OUT}/06-formulario.png` });

    const popupPromesa = ctx.waitForEvent("page", { timeout: 8000 }).catch(() => null);
    await page.getByRole("button", { name: "Hacer pedido" }).click();
    await page.getByText("Recibimos tu pedido").waitFor({ timeout: 8000 });
    const popup = await popupPromesa;
    const enlace = await page.getByRole("link", { name: "Confirmar por WhatsApp" }).getAttribute("href");
    const texto = decodeURIComponent(enlace.split("text=")[1] || "");
    check("confirmación: número de pedido #0001", await page.getByText("#0001").first().isVisible());
    check("WhatsApp a 573113749498", enlace.startsWith("https://wa.me/573113749498?text="));
    check(
      "mensaje con pedido completo",
      texto.includes("#0001") && texto.includes("2 x Street Carioca") && texto.includes("1 x Street Abacaxi") &&
        texto.includes("Torre 3, Apto 502") && texto.includes("90.000") && texto.includes("transferencia"),
    );
    check("WhatsApp se intentó abrir solo", !!popup, popup ? popup.url().slice(0, 60) : "bloqueado (queda el botón)");
    if (popup) await popup.close();
    await page.screenshot({ path: `${OUT}/07-confirmacion.png` });
    console.log("\n--- Mensaje de WhatsApp ---\n" + texto + "\n---------------------------\n");

    const fila = sql(
      `select numero, origen, coalesce(campana,''), telefono, torre, apto, pago, total, notas, detalle, estado from public.pedidos where numero = 1`,
    );
    check("pedido guardado en Supabase", fila.startsWith("1|ig|finde|3001234567|3|502|transferencia|90000|Sin tomate"), fila);
    const pidio = sql(`select bool_or(pidio) from public.visitas`);
    check("visita marcada como 'pidió'", pidio === "t");

    // Segundo pedido en otra visita sin ?src: debe seguir atribuido a ig (7 días)
    await page.goto(`${URL}/`, { waitUntil: "networkidle" });
    await page.locator("#menu").scrollIntoViewIfNeeded();
    await agregar(page, "Street Abacaxi", 1);
    await abrirCarrito(page);
    await llenar(page, { nombre: "Laura Gómez", tel: "3001234567", torre: "3", apto: "502" });
    await page.getByRole("button", { name: "Hacer pedido" }).click();
    await page.getByText("Recibimos tu pedido").waitFor({ timeout: 8000 });
    const o2 = sql(`select origen from public.pedidos where numero = 2`);
    check("src persistido: 2.º pedido sin ?src sigue siendo ig", o2 === "ig", `origen=${o2}`);
    await ctx.close();
  }

  // ── 3. src vencido (más de 7 días) se reemplaza ──
  {
    const ctx = await nuevoContexto(browser);
    await ctx.addInitScript(() => {
      if (!sessionStorage.getItem("es-init")) {
        sessionStorage.setItem("es-init", "1");
        localStorage.setItem(
          "es-atribucion",
          JSON.stringify({ origen: "fb", desde: Date.now() - 8 * 24 * 3600 * 1000 }),
        );
      }
    });
    const page = await ctx.newPage();
    await page.goto(`${URL}/?src=tiktok`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem("es-atribucion")).origen);
    check("src vencido (8 días) se reemplaza por el nuevo", guardado === "tiktok", `guardado=${guardado}`);
    await ctx.close();
  }

  // ── 4. Cupo: aviso en el carrito y cupo lleno del servidor ──
  {
    const usadas = Number(sql(`select coalesce(sum(unidades),0) from public.pedidos where jornada=${HOY} and estado<>'cancelado'`));
    sql(`update public.jornadas set cupo = ${usadas + 1} where fecha = ${HOY};`);
    const ctx = await nuevoContexto(browser);
    const page = await ctx.newPage();
    await page.goto(`${URL}/?src=qr`, { waitUntil: "networkidle" });
    await page.locator("#menu").scrollIntoViewIfNeeded();
    await agregar(page, "Street Carioca", 2);
    await abrirCarrito(page);
    check("cupo: avisa 'Solo quedan 1'", await page.getByText("Solo quedan 1 hamburguesa para hoy").isVisible());
    check("cupo: botón deshabilitado si se pasa", await page.getByRole("button", { name: "Hacer pedido" }).isDisabled());
    await page.screenshot({ path: `${OUT}/08-cupo-casi-lleno.png` });

    // Quita 1 (queda 1 = cupo exacto), pero otro cliente se lleva la última antes de enviar
    await page.getByRole("dialog").getByRole("button", { name: "Quitar una unidad de Street Carioca" }).click();
    await llenar(page, { nombre: "Pedro", tel: "3009998888", torre: "1", apto: "101" });
    sql(`update public.jornadas set cupo = ${usadas} where fecha = ${HOY};`);
    const antes = sql(`select count(*) from public.pedidos`);
    await page.getByRole("button", { name: "Hacer pedido" }).click();
    await page.getByText("Se agotó el cupo de hoy").last().waitFor({ timeout: 8000 });
    const despues = sql(`select count(*) from public.pedidos`);
    check("cupo lleno (servidor): rechaza y no guarda", antes === despues, `pedidos ${antes} -> ${despues}`);
    await page.screenshot({ path: `${OUT}/09-cupo-lleno-servidor.png` });

    await page.goto(`${URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    check("cupo lleno: aviso en el hero", await page.getByText("Se agotó el cupo de hoy").first().isVisible());
    await page.screenshot({ path: `${OUT}/10-hero-cupo-lleno.png` });
    await ctx.close();
  }

  // ── 5. Fuera de horario detectado por el servidor (cierran mientras el cliente llena) ──
  sql(`update public.jornadas set cupo = 30 where fecha = ${HOY};`);
  {
    const ctx = await nuevoContexto(browser);
    const page = await ctx.newPage();
    await page.goto(`${URL}/`, { waitUntil: "networkidle" });
    await page.locator("#menu").scrollIntoViewIfNeeded();
    await agregar(page, "Street Abacaxi", 1);
    await abrirCarrito(page);
    await llenar(page, { nombre: "Sofía", tel: "3015556666", torre: "2", apto: "303" });
    sql(`update public.jornadas set abierta = false where fecha = ${HOY};`);
    const antes = sql(`select count(*) from public.pedidos`);
    await page.getByRole("button", { name: "Hacer pedido" }).click();
    await page.getByText(/Ahora estamos cerrados\. Abrimos el/).waitFor({ timeout: 8000 });
    const despues = sql(`select count(*) from public.pedidos`);
    check("fuera de horario (servidor): rechaza y no guarda", antes === despues);
    await page.screenshot({ path: `${OUT}/11-fuera-de-horario-servidor.png` });
    await ctx.close();
  }

  // ── 6. Campo trampa (honeypot) ──
  sql(`update public.jornadas set abierta = true where fecha = ${HOY};`);
  {
    const ctx = await nuevoContexto(browser);
    const page = await ctx.newPage();
    await page.goto(`${URL}/`, { waitUntil: "networkidle" });
    await page.locator("#menu").scrollIntoViewIfNeeded();
    await agregar(page, "Street Carioca", 1);
    await abrirCarrito(page);
    await llenar(page, { nombre: "Bot", tel: "3020000000", torre: "9", apto: "999" });
    await page.locator("#c-sitio").fill("http://spam.example", { force: true });
    const antes = sql(`select count(*) from public.pedidos`);
    await page.getByRole("button", { name: "Hacer pedido" }).click();
    await page.getByText("No pudimos registrar tu pedido").waitFor({ timeout: 8000 });
    const despues = sql(`select count(*) from public.pedidos`);
    check("honeypot: no guarda el pedido", antes === despues, `pedidos ${antes} -> ${despues}`);
    await ctx.close();
  }

  // ── 7. Límite por teléfono (3 en 10 min) por la Server Action ──
  {
    const ctx = await nuevoContexto(browser);
    const page = await ctx.newPage();
    let ultimo = "";
    for (let i = 0; i < 4; i++) {
      await page.goto(`${URL}/`, { waitUntil: "networkidle" });
      await page.locator("#menu").scrollIntoViewIfNeeded();
      await agregar(page, "Street Carioca", 1);
      await abrirCarrito(page);
      await llenar(page, { nombre: "Repetido", tel: "3040000000", torre: "4", apto: "404" });
      await page.getByRole("button", { name: "Hacer pedido" }).click();
      await page.waitForSelector("text=/Recibimos tu pedido|varios pedidos con este teléfono/", { timeout: 8000 });
      ultimo = (await page.getByText("varios pedidos con este teléfono").count()) ? "limitado" : "ok";
    }
    check("límite por teléfono: el 4.º se rechaza", ultimo === "limitado");
    await ctx.close();
  }

  // ── 8. Acceso público a la base y al admin ──
  {
    const r = await fetch(`${URL}/admin`);
    check("/admin ya no existe (404)", r.status === 404, `status ${r.status}`);
  }

  // Pantalla de escritorio
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 } });
    const page = await ctx.newPage();
    await page.goto(`${URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${OUT}/12-escritorio.png` });
    await ctx.close();
  }

  console.log("\n" + sql(`select numero||' '||origen||' '||detalle||' '||total||' '||estado from public.pedidos order by numero`));
  console.log(sql(`select * from public.resumen_por_origen`));
  await browser.close();
  const fallas = resultados.filter((r) => !r.ok).length;
  console.log(`\n${resultados.length - fallas}/${resultados.length} pruebas pasan`);
  process.exit(fallas ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
