import { CONTACTO } from "@/data/menu";
import { cop, formatoNumero } from "./formato";
import type { ItemConfirmado } from "./pedido";

type Datos = {
  numero: number;
  items: ItemConfirmado[];
  subtotal: number;
  domicilio: number;
  total: number;
  nombre: string;
  telefono: string;
  torre: string;
  apto: string;
  pago: "efectivo" | "transferencia";
  notas: string;
};

/** Texto que el cliente le envía a Elegant Street para confirmar */
export function mensajePedido(d: Datos): string {
  const lineas = [
    `Hola Elegant Street, quiero confirmar mi pedido ${formatoNumero(d.numero)}:`,
    "",
    ...d.items.map((i) => `• ${i.cantidad} x ${i.nombre} — ${cop(i.cantidad * i.precio_unitario)}`),
    "",
    d.domicilio > 0 ? `Domicilio: ${cop(d.domicilio)}` : "Domicilio: sin costo",
    `*Total: ${cop(d.total)}*`,
    `Pago: ${d.pago === "efectivo" ? "efectivo" : "transferencia"}`,
    "",
    `Nombre: ${d.nombre}`,
    `Entrega: Torre ${d.torre}, Apto ${d.apto} (${CONTACTO.zona})`,
    `Teléfono: ${d.telefono}`,
  ];
  if (d.notas.trim()) lineas.push(`Notas: ${d.notas.trim()}`);
  if (d.pago === "transferencia") lineas.push("", "Te envío el comprobante de la transferencia.");
  return lineas.join("\n");
}

export function enlaceWhatsApp(texto: string): string {
  return `https://wa.me/${CONTACTO.whatsappNumero}?text=${encodeURIComponent(texto)}`;
}
