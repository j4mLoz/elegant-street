/**
 * Genera el código QR de Elegant Street (SVG + PNG de alta resolución + tarjeta lista para compartir).
 * Negro sobre blanco con el logo al centro y corrección de errores alta (H), para que escanee bien impreso en el flyer.
 *
 * Uso (desde la raíz del repo):
 *   PLAYWRIGHT=/ruta/a/playwright-core/index.mjs CHROME=/ruta/al/chrome node qr/generar.mjs [--url https://dominio] [--src qr] [--c flyer]
 * Sin --url usa la dirección por defecto de abajo. Cuando haya dominio definitivo, se vuelve a correr y se reemplazan los archivos.
 * Salida: qr/salida/qr-elegant.svg, qr-elegant.png (2000 px) y tarjeta-qr-elegant.png (1080x1350).
 *
 * El QR lleva ?src=qr&c=flyer para que el panel sepa cuántos pedidos llegan por el flyer (ver ENTREGA-ELEGANT.md, sección 9).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.join(AQUI, "salida");
const URL_POR_DEFECTO = "https://elegant-street.netlify.app";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const base = arg("url", URL_POR_DEFECTO).replace(/\/+$/, "");
const destino = `${base}/?src=${encodeURIComponent(arg("src", "qr"))}&c=${encodeURIComponent(arg("c", "flyer"))}`;

const { chromium } = await import(process.env.PLAYWRIGHT || "playwright-core");
mkdirSync(SALIDA, { recursive: true });

// ---- el QR como vector ----
const qr = QRCode.create(destino, { errorCorrectionLevel: "H" });
const n = qr.modules.size;
const margen = 4; // zona de silencio mínima del estándar
const total = n + margen * 2;
let d = "";
for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.get(x, y)) d += `M${x + margen} ${y + margen}h1v1h-1z`;
const logo64 = readFileSync(path.join(AQUI, "logo-centro.png")).toString("base64");
const lado = Math.round(n * 0.22); // ~5 % del área: muy por debajo de lo que tolera el nivel H (30 %)
const c = total / 2, mitad = lado / 2, pad = 0.9;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${total} ${total}" width="${total * 10}" height="${total * 10}" shape-rendering="crispEdges">
<rect width="${total}" height="${total}" fill="#ffffff"/>
<path d="${d}" fill="#0d0d0d"/>
<rect x="${c - mitad - pad}" y="${c - mitad - pad}" width="${lado + pad * 2}" height="${lado + pad * 2}" rx="2.2" fill="#ffffff" shape-rendering="auto"/>
<rect x="${c - mitad}" y="${c - mitad}" width="${lado}" height="${lado}" rx="1.6" fill="#0d0d0d" shape-rendering="auto"/>
<image x="${c - mitad}" y="${c - mitad}" width="${lado}" height="${lado}" href="data:image/png;base64,${logo64}" xlink:href="data:image/png;base64,${logo64}"/>
</svg>`;
writeFileSync(path.join(SALIDA, "qr-elegant.svg"), svg);

// ---- PNG y tarjeta ----
const navegador = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const foto = async (html, ancho, alto, archivo) => {
  const pag = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  await pag.setContent(html, { waitUntil: "networkidle" });
  await pag.evaluate(() => document.fonts?.ready);
  await pag.screenshot({ path: path.join(SALIDA, archivo) });
  await pag.close();
};
const svgBase64 = Buffer.from(svg).toString("base64");
await foto(`<body style="margin:0"><img src="data:image/svg+xml;base64,${svgBase64}" style="display:block;width:2000px;height:2000px"></body>`, 2000, 2000, "qr-elegant.png");

const logoCompleto = readFileSync(path.join(AQUI, "..", "public", "elegant-street-logo.png")).toString("base64");
const visible = base.replace(/^https?:\/\//, "");
await foto(`<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&display=swap" rel="stylesheet"><style>
*{box-sizing:border-box}body{margin:0;width:1080px;height:1350px;background:#0d0d0d;color:#f6f5f3;font-family:Outfit,system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:56px 0 64px}
.logo{width:360px;height:360px;object-fit:cover;margin-top:-30px}
h1{margin:0;font-size:78px;font-weight:800;letter-spacing:-1px;text-align:center;line-height:1}
h1 small{display:block;margin-top:14px;font-size:34px;font-weight:500;letter-spacing:6px;text-transform:uppercase;color:#bdbab3}
.panel{background:#fff;border-radius:44px;padding:28px;box-shadow:0 0 0 3px #f6f5f3}
.panel img{display:block;width:560px;height:560px}
.url{font-size:38px;font-weight:700;letter-spacing:.5px}
</style></head><body>
<img class="logo" src="data:image/png;base64,${logoCompleto}" alt="">
<h1>Escanea y pide<small>hamburguesas a domicilio</small></h1>
<div class="panel"><img src="data:image/svg+xml;base64,${svgBase64}" alt=""></div>
<div class="url">${visible}</div>
</body></html>`, 1080, 1350, "tarjeta-qr-elegant.png");
await navegador.close();

console.log(`QR listo -> ${destino}\n${SALIDA}`);
