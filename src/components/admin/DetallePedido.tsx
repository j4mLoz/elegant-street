"use client";

import { useEffect, useRef } from "react";
import type { EstadoPedido, Pedido } from "@/data/admin";
import { cop } from "@/lib/formato";
import Icono from "./Iconos";
import { hmA12 } from "@/lib/pedidosDemo";
import { ESTADO_PEDIDO, Insignia } from "./Piezas";

const PASOS: EstadoPedido[] = ["pendiente", "confirmado", "en-camino", "entregado"];

/** Texto del botón según el estado actual; entregado ya no tiene acción */
const ACCION: Partial<Record<EstadoPedido, string>> = {
  pendiente: "Confirmar",
  confirmado: "En camino",
  "en-camino": "Marcar como entregado",
};

type Props = {
  /** El pedido a mostrar; null mantiene el panel cerrado */
  pedido: Pedido | null;
  onCerrar: () => void;
  onAvanzar: (numero: string) => void;
};

/** Panel lateral derecho con el detalle completo de un pedido activo. */
export default function DetallePedido({ pedido, onCerrar, onAvanzar }: Props) {
  const botonCerrarRef = useRef<HTMLButtonElement>(null);
  const abierto = pedido !== null;

  // Escape cierra, se bloquea el scroll de fondo y el foco viaja al panel y regresa al cerrar
  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement as HTMLElement | null;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alTeclear);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    botonCerrarRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = overflowPrevio;
      if (previo?.isConnected) previo.focus();
    };
  }, [abierto, onCerrar]);

  if (!pedido) return null;

  const e = ESTADO_PEDIDO[pedido.estado];
  const indice = PASOS.indexOf(pedido.estado);
  const siguiente = PASOS[indice + 1];
  const textoAccion = ACCION[pedido.estado];

  return (
    <>
      <div
        onClick={onCerrar}
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-p-fondo/75 backdrop-blur-sm transition-opacity duration-300 starting:opacity-0"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-titulo"
        className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l-2 border-p-acento bg-p-panel shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] starting:translate-x-full"
      >
        <header className="flex items-start justify-between gap-4 border-b border-p-texto/10 px-6 py-5">
          <div>
            <h2
              id="detalle-titulo"
              className="font-display text-3xl uppercase tracking-wide"
            >
              Pedido <span className="text-p-plata-texto">{pedido.numero}</span>
            </h2>
            <div className="mt-2">
              <Insignia tono={e.tono}>{e.etiqueta}</Insignia>
            </div>
          </div>
          <button
            ref={botonCerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar el detalle del pedido"
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-p-texto/20 text-p-texto transition-colors hover:border-p-acento hover:text-p-acento focus-visible:outline-2 focus-visible:outline-p-acento"
          >
            <Icono nombre="cerrar" className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {/* Progreso */}
          <ol aria-label="Progreso del pedido" className="grid grid-cols-4 gap-1.5">
            {PASOS.map((paso, i) => {
              const hecho = i <= indice;
              return (
                <li key={paso} aria-current={i === indice ? "step" : undefined}>
                  <div className={`h-1 ${hecho ? "bg-p-acento" : "bg-p-texto/15"}`} />
                  <p
                    className={`mt-2 font-body text-[0.65rem] font-bold uppercase tracking-wider ${
                      i === indice ? "text-p-texto" : "text-p-texto/45"
                    }`}
                  >
                    {ESTADO_PEDIDO[paso].etiqueta}
                  </p>
                </li>
              );
            })}
          </ol>

          {/* Cliente */}
          <section aria-labelledby="detalle-cliente">
            <h3
              id="detalle-cliente"
              className="font-body text-xs font-bold uppercase tracking-[0.25em] text-p-texto/55"
            >
              Cliente
            </h3>
            <p className="mt-2 font-display text-3xl uppercase leading-none tracking-wide">
              {pedido.cliente}
            </p>
            <dl className="mt-4 space-y-3 font-body">
              <div className="flex items-start gap-3">
                <dt className="mt-0.5 text-p-plata-texto">
                  <Icono nombre="ubicacion" className="h-5 w-5" />
                  <span className="sr-only">Dirección</span>
                </dt>
                <dd className="text-p-texto/85">{pedido.direccion}</dd>
              </div>
              <div className="flex items-start gap-3">
                <dt className="mt-0.5 text-p-plata-texto">
                  <Icono nombre="telefono" className="h-5 w-5" />
                  <span className="sr-only">WhatsApp</span>
                </dt>
                <dd className="tabular-nums text-p-texto/85">{pedido.whatsapp}</dd>
              </div>
              {pedido.hora && (
                <div className="flex items-start gap-3">
                  <dt className="mt-0.5 text-p-plata-texto">
                    <Icono nombre="reloj" className="h-5 w-5" />
                    <span className="sr-only">Hora del pedido</span>
                  </dt>
                  <dd className="text-p-texto/85">Recibido a las {hmA12(pedido.hora)}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Productos */}
          <section aria-labelledby="detalle-productos">
            <h3
              id="detalle-productos"
              className="font-body text-xs font-bold uppercase tracking-[0.25em] text-p-texto/55"
            >
              Productos
            </h3>
            <ul className="mt-3 divide-y divide-p-texto/10 border-y border-p-texto/10">
              {pedido.items.map((i) => (
                <li
                  key={i.nombre}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div>
                    <p className="font-body font-bold">
                      <span className="tabular-nums text-p-plata-texto">{i.cantidad}×</span>{" "}
                      {i.nombre}
                    </p>
                    <p className="mt-0.5 font-body text-sm text-p-texto/55">
                      {cop(i.precio)} c/u
                    </p>
                  </div>
                  <p className="font-display text-xl tracking-wide tabular-nums">
                    {cop(i.cantidad * i.precio)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-body text-sm font-bold uppercase tracking-[0.25em] text-p-texto/60">
                Subtotal
              </span>
              <span className="font-display text-4xl tracking-wide tabular-nums">
                {cop(pedido.total)}
              </span>
            </div>
            <p className="mt-1 font-body text-xs text-p-texto/50">
              El domicilio se confirma por WhatsApp.
            </p>
          </section>
        </div>

        {/* Acción de cambio de estado */}
        {textoAccion && siguiente && (
          <footer className="border-t-2 border-p-acento bg-p-fondo px-6 py-5">
            <p className="mb-3 font-body text-xs text-p-texto/55">
              Pasará a:{" "}
              <strong className="text-p-texto">{ESTADO_PEDIDO[siguiente].etiqueta}</strong>
            </p>
            <button
              type="button"
              onClick={() => onAvanzar(pedido.numero)}
              className="w-full bg-p-acento py-4 font-display text-xl uppercase tracking-widest text-p-sobre-acento shadow-[4px_4px_0_0_var(--p-sombra)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--p-sombra)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-p-acento"
            >
              {textoAccion}
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
