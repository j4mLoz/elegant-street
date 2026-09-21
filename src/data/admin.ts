/**
 * DATOS FICTICIOS del panel /admin (demostración para el cliente).
 * Para cambiar una cifra en vivo, se edita aquí y se refresca.
 */

export type EstadoPedido = "pendiente" | "confirmado" | "en-camino" | "entregado";
export type NivelStock = "critico" | "bajo" | "bien";

export type LineaPedido = {
  nombre: string;
  cantidad: number;
  /** Precio de una unidad, en pesos colombianos */
  precio: number;
};

export type Pedido = {
  numero: string;
  cliente: string;
  direccion: string;
  whatsapp: string;
  items: LineaPedido[];
  /** "Street Paulista + Street Classic": se arma solo a partir de los items */
  productos: string;
  /** Suma de los items, en pesos colombianos (entero) */
  total: number;
  estado: EstadoPedido;
  /** Solo cuando está entregado, por ejemplo "8:42 PM" */
  horaEntrega?: string;
  /** Solo en pedidos reales llegados desde la landing (vía localStorage); los ficticios no lo tienen */
  id?: number;
  /** Hora en que llegó el pedido, "HH:mm" (solo en pedidos reales) */
  hora?: string;
  /** Hora en que se confirmó, "HH:mm": es cuando el pedido entra a caja como ingreso (solo reales) */
  horaConfirmado?: string;
};

export type Insumo = {
  nombre: string;
  cantidad: number;
  unidad: "unidades" | "porciones";
  /** Cantidad con la que la cocina está tranquila; sirve para la barra y el semáforo */
  ideal: number;
  nivel: NivelStock;
};

export type Movimiento = {
  /** Solo en movimientos nuevos (pedidos confirmados, compras de insumos): sirve para resaltarlos */
  id?: string;
  hora: string;
  descripcion: string;
  tipo: "ingreso" | "egreso";
  monto: number;
};

export type VentaHora = {
  /** Etiqueta corta del eje, por ejemplo "8pm" */
  hora: string;
  /** Etiqueta larga para las tarjetas, por ejemplo "8:00 PM" */
  horaLarga: string;
  valor: number;
};

/** El semáforo sale de cuánto queda frente a lo ideal: menos de 15% crítico, hasta 40% bajo */
export function nivelDe(cantidad: number, ideal: number): NivelStock {
  const proporcion = cantidad / ideal;
  if (proporcion < 0.15) return "critico";
  if (proporcion <= 0.4) return "bajo";
  return "bien";
}

export const totalDe = (items: LineaPedido[]) =>
  items.reduce((suma, i) => suma + i.cantidad * i.precio, 0);

function pedido(base: Omit<Pedido, "productos" | "total">): Pedido {
  return {
    ...base,
    productos: base.items
      .map((i) => (i.cantidad > 1 ? `${i.cantidad}× ${i.nombre}` : i.nombre))
      .join(" + "),
    total: totalDe(base.items),
  };
}

/** Arma un pedido completo (texto de productos y total) a partir de sus items */
export const armarPedido = pedido;

function insumo(
  nombre: string,
  cantidad: number,
  unidad: Insumo["unidad"],
  ideal: number,
): Insumo {
  return { nombre, cantidad, unidad, ideal, nivel: nivelDe(cantidad, ideal) };
}

export const PEDIDOS: Pedido[] = [
  pedido({
    numero: "#001",
    cliente: "Carlos M.",
    direccion: "Cra 7 # 45-12, Apto 301 · Chapinero",
    whatsapp: "+57 300 555 0101",
    items: [
      { nombre: "Street Paulista", cantidad: 1, precio: 26000 },
      { nombre: "Street Classic", cantidad: 1, precio: 22000 },
    ],
    estado: "confirmado",
  }),
  pedido({
    numero: "#002",
    cliente: "Laura G.",
    direccion: "Calle 93 # 14-20, Casa 4 · Chicó",
    whatsapp: "+57 310 555 0102",
    items: [
      { nombre: "Street Honey", cantidad: 1, precio: 28000 },
      { nombre: "BBQ Dulce", cantidad: 1, precio: 2500 },
    ],
    estado: "en-camino",
  }),
  pedido({
    numero: "#003",
    cliente: "Andrés P.",
    direccion: "Av. 19 # 118-30, Torre 2 Apto 802 · Usaquén",
    whatsapp: "+57 315 555 0103",
    items: [{ nombre: "Street Gaucha", cantidad: 1, precio: 32000 }],
    estado: "pendiente",
  }),
  pedido({
    numero: "#004",
    cliente: "Valentina R.",
    direccion: "Cra 15 # 78-33, Local 2 · Zona T",
    whatsapp: "+57 320 555 0104",
    items: [
      { nombre: "Street Mex", cantidad: 1, precio: 28000 },
      { nombre: "Carne artesanal", cantidad: 1, precio: 6000 },
    ],
    estado: "confirmado",
  }),
  pedido({
    numero: "#005",
    cliente: "Miguel T.",
    direccion: "Calle 63 # 9-45, Apto 1204 · Chapinero Alto",
    whatsapp: "+57 301 555 0105",
    items: [
      { nombre: "Street Carioca", cantidad: 1, precio: 30000 },
      { nombre: "Tostón de queso", cantidad: 1, precio: 7900 },
    ],
    estado: "pendiente",
  }),
  pedido({
    numero: "#006",
    cliente: "Sofía L.",
    direccion: "Cra 11 # 82-71, Apto 601 · El Retiro",
    whatsapp: "+57 312 555 0106",
    items: [{ nombre: "Street Ranchera", cantidad: 1, precio: 28000 }],
    estado: "en-camino",
  }),
  // #007 y #008 son adicionales: completan los "8 pedidos hoy" y los "3 pendientes"
  pedido({
    numero: "#007",
    cliente: "Camila S.",
    direccion: "Cra 9 # 69-10, Casa 2 · Quinta Camacho",
    whatsapp: "+57 304 555 0107",
    items: [{ nombre: "Street Honey", cantidad: 1, precio: 28000 }],
    estado: "entregado",
    horaEntrega: "7:35 PM",
  }),
  pedido({
    numero: "#008",
    cliente: "Nicolás H.",
    direccion: "Calle 100 # 8A-55, Oficina 703 · Chicó Norte",
    whatsapp: "+57 316 555 0108",
    items: [
      { nombre: "Street Classic", cantidad: 2, precio: 22000 },
      { nombre: "Maduros", cantidad: 1, precio: 3000 },
    ],
    estado: "pendiente",
  }),
];

export const RESUMEN = {
  ventasDia: 156000,
  pedidosHoy: PEDIDOS.length,
  pedidosPendientes: PEDIDOS.filter((p) => p.estado === "pendiente").length,
};

export const INVENTARIO: Insumo[] = [
  insumo("Pan brioche", 4, "unidades", 30),
  insumo("Carne artesanal", 12, "porciones", 20),
  insumo("Tocineta ahumada", 8, "porciones", 15),
  insumo("Queso cheddar", 6, "porciones", 15),
  insumo("Papas a la francesa", 15, "porciones", 25),
  insumo("Salchicha zenú", 5, "unidades", 15),
];

export const CAJA = {
  ingresos: 156000,
  egresos: 42000,
};

/** Meta de ventas del día (ficticia): alimenta la barra "🎯 Meta del día" de la variante minimalista */
export const META_DIA = 200000;

/** Ventas por hora (ficticias), de 11am a 10pm */
export const VENTAS_POR_HORA: VentaHora[] = [
  { hora: "11am", horaLarga: "11:00 AM", valor: 12000 },
  { hora: "12pm", horaLarga: "12:00 PM", valor: 28000 },
  { hora: "1pm", horaLarga: "1:00 PM", valor: 34000 },
  { hora: "2pm", horaLarga: "2:00 PM", valor: 18000 },
  { hora: "3pm", horaLarga: "3:00 PM", valor: 8000 },
  { hora: "4pm", horaLarga: "4:00 PM", valor: 6000 },
  { hora: "5pm", horaLarga: "5:00 PM", valor: 10000 },
  { hora: "6pm", horaLarga: "6:00 PM", valor: 20000 },
  { hora: "7pm", horaLarga: "7:00 PM", valor: 38000 },
  { hora: "8pm", horaLarga: "8:00 PM", valor: 42000 },
  { hora: "9pm", horaLarga: "9:00 PM", valor: 26000 },
  { hora: "10pm", horaLarga: "10:00 PM", valor: 9000 },
];

export const PRODUCTO_TOP = { nombre: "Street Gaucha", unidades: 3 };

export const MOVIMIENTOS: Movimiento[] = [
  { hora: "11:30 AM", descripcion: "Street Paulista + Street Classic", tipo: "ingreso", monto: 48000 },
  { hora: "12:15 PM", descripcion: "Street Honey", tipo: "ingreso", monto: 28000 },
  { hora: "1:00 PM", descripcion: "Compra pan brioche x20", tipo: "egreso", monto: 18000 },
  { hora: "1:45 PM", descripcion: "Street Gaucha", tipo: "ingreso", monto: 32000 },
  { hora: "3:30 PM", descripcion: "Compra tocineta", tipo: "egreso", monto: 14000 },
  { hora: "7:00 PM", descripcion: "Street Mex + Carne artesanal", tipo: "ingreso", monto: 34000 },
  { hora: "8:00 PM", descripcion: "Street Carioca + Tostón de queso", tipo: "ingreso", monto: 37900 },
  { hora: "9:00 PM", descripcion: "Street Ranchera", tipo: "ingreso", monto: 28000 },
];
