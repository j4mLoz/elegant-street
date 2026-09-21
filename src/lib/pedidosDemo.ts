/**
 * PUENTE TEMPORAL landing ↔ panel admin, usando localStorage (sin backend).
 * La landing guarda aquí cada pedido confirmado y el panel /admin lo lee y lo actualiza.
 * Cuando exista un backend real, este archivo es lo único que hay que reemplazar.
 */

import { armarPedido, type EstadoPedido, type Pedido } from "@/data/admin";

export const CLAVE_PEDIDOS = "elegant_street_pedidos";

/** Los 8 pedidos ficticios del panel son #001–#008: los reales continúan desde el #009 */
export const ULTIMO_ID_FICTICIO = 8;

export type EstadoGuardado = "Pendiente" | "Confirmado" | "En camino" | "Entregado";

export type ProductoGuardado = {
  nombre: string;
  cantidad: number;
  /** Precio de una unidad, en pesos colombianos */
  precio: number;
};

export type PedidoGuardado = {
  id: number;
  cliente: string;
  telefono: string;
  direccion: string;
  productos: ProductoGuardado[];
  total: number;
  estado: EstadoGuardado;
  /** Hora en que se hizo el pedido, "HH:mm" */
  hora: string;
  /** Solo cuando ya se confirmó, "HH:mm": a esa hora entró a caja como ingreso */
  horaConfirmado?: string;
  /** Solo cuando ya se entregó, "HH:mm" */
  horaEntrega?: string;
};

export const ESTADO_A_GUARDADO: Record<EstadoPedido, EstadoGuardado> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  "en-camino": "En camino",
  entregado: "Entregado",
};

const ESTADO_A_ADMIN: Record<EstadoGuardado, EstadoPedido> = {
  Pendiente: "pendiente",
  Confirmado: "confirmado",
  "En camino": "en-camino",
  Entregado: "entregado",
};

const ESTADOS = Object.keys(ESTADO_A_ADMIN);

/* ───────── Formatos ───────── */

/** 9 -> "#009" */
export const formatoNumero = (id: number) => `#${String(id).padStart(3, "0")}`;

/** La hora actual como "HH:mm" (24 horas) */
export function horaHM(fecha: Date = new Date()): string {
  const h = String(fecha.getHours()).padStart(2, "0");
  const m = String(fecha.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** "20:56" -> "8:56 PM" */
export function hmA12(hm: string): string {
  const partes = /^(\d{1,2}):(\d{2})$/.exec(hm);
  if (!partes) return hm;
  const h = Number(partes[1]);
  return `${h % 12 || 12}:${partes[2]} ${h >= 12 ? "PM" : "AM"}`;
}

/** Minutos desde la medianoche de "8:56 PM" o "20:56"; sirve para ordenar por hora */
export function minutosDelDia(texto?: string): number {
  if (!texto) return 0;
  const partes = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(texto);
  if (!partes) return 0;
  let h = Number(partes[1]);
  const sufijo = partes[3]?.toUpperCase();
  if (sufijo === "PM" && h < 12) h += 12;
  if (sufijo === "AM" && h === 12) h = 0;
  return h * 60 + Number(partes[2]);
}

/* ───────── Lectura y escritura seguras ───────── */

function esProducto(x: unknown): x is ProductoGuardado {
  if (typeof x !== "object" || x === null) return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.nombre === "string" &&
    Number.isInteger(p.cantidad) &&
    (p.cantidad as number) >= 1 &&
    typeof p.precio === "number" &&
    Number.isFinite(p.precio)
  );
}

/** localStorage puede traer datos dañados o de otra versión: solo se aceptan pedidos bien formados */
function esPedido(x: unknown): x is PedidoGuardado {
  if (typeof x !== "object" || x === null) return false;
  const p = x as Record<string, unknown>;
  return (
    Number.isInteger(p.id) &&
    typeof p.cliente === "string" &&
    typeof p.telefono === "string" &&
    typeof p.direccion === "string" &&
    Array.isArray(p.productos) &&
    p.productos.every(esProducto) &&
    typeof p.total === "number" &&
    Number.isFinite(p.total) &&
    typeof p.estado === "string" &&
    ESTADOS.includes(p.estado) &&
    typeof p.hora === "string"
  );
}

export function leerPedidosGuardados(): PedidoGuardado[] {
  try {
    const crudo = localStorage.getItem(CLAVE_PEDIDOS);
    if (!crudo) return [];
    const datos: unknown = JSON.parse(crudo);
    return Array.isArray(datos) ? datos.filter(esPedido) : [];
  } catch {
    return [];
  }
}

function escribir(lista: PedidoGuardado[]): boolean {
  try {
    localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(lista));
    return true;
  } catch {
    return false;
  }
}

/**
 * Guarda un pedido nuevo con estado "Pendiente" y devuelve el pedido guardado,
 * o null si el navegador no permitió guardarlo.
 */
export function registrarPedido(datos: {
  cliente: string;
  telefono: string;
  direccion: string;
  productos: ProductoGuardado[];
  total: number;
}): PedidoGuardado | null {
  const lista = leerPedidosGuardados();
  const id = Math.max(ULTIMO_ID_FICTICIO, ...lista.map((p) => p.id)) + 1;
  const pedido: PedidoGuardado = {
    id,
    cliente: datos.cliente,
    telefono: datos.telefono,
    direccion: datos.direccion,
    productos: datos.productos,
    total: datos.total,
    estado: "Pendiente",
    hora: horaHM(),
  };
  return escribir([...lista, pedido]) ? pedido : null;
}

/**
 * Cambia el estado de un pedido leyendo primero lo último guardado, así nunca se pisa
 * un pedido que acaba de llegar desde otra pestaña. Devuelve false si no se pudo.
 */
export function actualizarPedidoGuardado(
  id: number,
  cambios: { estado: EstadoGuardado; horaConfirmado?: string; horaEntrega?: string },
): boolean {
  const lista = leerPedidosGuardados();
  if (!lista.some((p) => p.id === id)) return false;
  return escribir(lista.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
}

/** Borra todos los pedidos reales; los ficticios viven en el código y no se tocan */
export function limpiarPedidosGuardados(): void {
  try {
    localStorage.removeItem(CLAVE_PEDIDOS);
  } catch {
    /* sin almacenamiento no hay nada que borrar */
  }
}

/* ───────── Traducción al formato del panel ───────── */

export function aPedidoAdmin(g: PedidoGuardado): Pedido {
  const entregado = g.estado === "Entregado";
  return armarPedido({
    id: g.id,
    numero: formatoNumero(g.id),
    cliente: g.cliente,
    direccion: g.direccion || "Sin dirección",
    whatsapp: g.telefono,
    items: g.productos,
    estado: ESTADO_A_ADMIN[g.estado],
    hora: g.hora,
    horaConfirmado: g.horaConfirmado,
    horaEntrega: entregado ? hmA12(g.horaEntrega ?? g.hora) : undefined,
  });
}

/** Los pedidos reales listos para el panel, del más reciente al más antiguo */
export function leerPedidosAdmin(): Pedido[] {
  return leerPedidosGuardados()
    .sort((a, b) => b.id - a.id)
    .map(aPedidoAdmin);
}
