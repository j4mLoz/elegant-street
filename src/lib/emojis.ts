import type { EstadoPedido, NivelStock } from "@/data/admin";

/**
 * Emojis del panel minimalista. Cada uno cumple una función:
 * se entiende de un vistazo sin leer, y siempre va acompañado de texto.
 */

export const ESTADO_PEDIDO: Record<EstadoPedido, { emoji: string; etiqueta: string }> = {
  pendiente: { emoji: "⏳", etiqueta: "Pendiente" },
  confirmado: { emoji: "✅", etiqueta: "Confirmado" },
  "en-camino": { emoji: "🛵", etiqueta: "En camino" },
  entregado: { emoji: "🎉", etiqueta: "Entregado" },
};

/** Semáforo del inventario */
export const NIVEL_STOCK: Record<NivelStock, { emoji: string; etiqueta: string }> = {
  critico: { emoji: "🔴", etiqueta: "Crítico" },
  bajo: { emoji: "🟡", etiqueta: "Bajo" },
  bien: { emoji: "🟢", etiqueta: "Bien" },
};

/** Qué se pidió, reconocible al instante */
export function emojiProducto(nombre: string): string {
  const n = nombre.toLowerCase();
  if (/paulista|gaucha|carioca/.test(n)) return "🍔";
  if (/ranchera|honey|mex|classic/.test(n)) return "🍟";
  if (/tost[oó]n/.test(n)) return "🧀";
  if (/carne/.test(n)) return "🥩";
  if (/bbq|mayonesa|dulce|salsa/.test(n)) return "🥫";
  return "🍽️";
}

/** Qué insumo es, para escanear el inventario sin leer */
export function emojiInsumo(nombre: string): string {
  const n = nombre.toLowerCase();
  if (/pan/.test(n)) return "🍞";
  if (/carne/.test(n)) return "🥩";
  if (/tocineta/.test(n)) return "🥓";
  if (/queso/.test(n)) return "🧀";
  if (/papas/.test(n)) return "🍟";
  if (/salchicha/.test(n)) return "🌭";
  return "📦";
}

/** Saludo según la hora: hace que el panel se sienta vivo */
export function saludoPorHora(hora: number): { emoji: string; texto: string } {
  if (hora < 12) return { emoji: "🌅", texto: "Buenos días" };
  if (hora < 19) return { emoji: "🌤️", texto: "Buenas tardes" };
  return { emoji: "🌙", texto: "Buenas noches" };
}
