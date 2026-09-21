/**
 * Cálculos de la Caja del panel /admin.
 * Los movimientos ficticios de siempre se combinan con los nuevos (pedidos confirmados desde el
 * panel y compras de insumos), y los totales se recalculan a partir de esa suma.
 */

import { CAJA, MOVIMIENTOS, type Movimiento, type Pedido } from "@/data/admin";
import { hmA12, minutosDelDia } from "./pedidosDemo";

/** Valor ficticio con el que arranca el costo de una compra de insumo */
export const COSTO_COMPRA_POR_DEFECTO = 15000;

/** El id del movimiento de caja que genera un pedido (sirve para resaltar su fila) */
export const idMovimientoDePedido = (p: Pedido) => `pedido-${p.id ?? p.numero}`;

/**
 * Un pedido entra a caja como ingreso en el momento exacto en que el admin lo pasa de Pendiente a
 * Confirmado: ese instante queda guardado en `horaConfirmado`. Mientras esté Pendiente no suma, y
 * cuando sigue avanzando (En camino, Entregado) no vuelve a sumar: ya sumó al confirmarse.
 * Los pedidos ficticios que ya venían confirmados no tienen `horaConfirmado`: ya están incluidos
 * en los totales ficticios y por eso tampoco suman.
 */
export function ingresosDePedidos(pedidos: Pedido[]): Movimiento[] {
  return (
    pedidos
      .filter((p) => p.horaConfirmado !== undefined)
      // Si dos pedidos se confirman en el mismo minuto, va primero el de número menor
      .sort((a, b) => a.numero.localeCompare(b.numero))
      .map((p) => ({
        id: idMovimientoDePedido(p),
        hora: hmA12(p.horaConfirmado ?? "00:00"),
        descripcion: p.cliente,
        tipo: "ingreso" as const,
        monto: p.total,
      }))
  );
}

/** El egreso que deja registrar una entrada de inventario */
export function egresoDeEntrada(nombre: string, costo: number, hm: string): Movimiento {
  return {
    id: `entrada-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    hora: hmA12(hm),
    descripcion: `Compra de insumo — ${nombre}`,
    tipo: "egreso",
    monto: costo,
  };
}

/** Los movimientos ficticios van primero; los nuevos se suman después, en orden de hora */
export function movimientosDeCaja(nuevos: Movimiento[]): Movimiento[] {
  const ordenados = [...nuevos].sort((a, b) => minutosDelDia(a.hora) - minutosDelDia(b.hora));
  return [...MOVIMIENTOS, ...ordenados];
}

/** Los totales ficticios de siempre más lo que suman los movimientos nuevos */
export function totalesDeCaja(nuevos: Movimiento[]) {
  const suma = (tipo: Movimiento["tipo"]) =>
    nuevos.filter((m) => m.tipo === tipo).reduce((total, m) => total + m.monto, 0);
  const ingresos = CAJA.ingresos + suma("ingreso");
  const egresos = CAJA.egresos + suma("egreso");
  return { ingresos, egresos, ganancia: ingresos - egresos };
}
