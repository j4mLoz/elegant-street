"use client";

import { useCarrito } from "@/context/CarritoContext";

type Props = {
  id: string;
  nombre: string;
  precio: number;
  /** Versión pequeña para listas de adiciones y salsas */
  compacto?: boolean;
};

/** Botón "Agregar" que se convierte en un selector de cantidad. */
export default function BotonAgregar({ id, nombre, precio, compacto = false }: Props) {
  const { agregar, cambiarCantidad, cantidadDe } = useCarrito();
  const cantidad = cantidadDe(id);

  const tamano = compacto
    ? "h-9 min-w-9 text-base"
    : "h-12 min-w-12 text-xl";

  if (cantidad === 0) {
    return (
      <button
        type="button"
        onClick={() => agregar({ id, nombre, precio })}
        aria-label={`Agregar ${nombre} al pedido`}
        className={`${
          compacto ? "h-9 px-4 text-sm" : "h-12 px-6 text-lg"
        } -skew-x-6 bg-oro font-display uppercase tracking-widest text-negro transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro active:translate-y-0`}
      >
        <span className="inline-block skew-x-6">Agregar</span>
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={`Cantidad de ${nombre}`}
      className="inline-flex items-center border-2 border-oro"
    >
      <button
        type="button"
        onClick={() => cambiarCantidad(id, -1)}
        aria-label={`Quitar una unidad de ${nombre}`}
        className={`${tamano} font-display text-oro transition-colors hover:bg-oro hover:text-negro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro`}
      >
        −
      </button>
      <span
        aria-live="polite"
        className={`${compacto ? "min-w-8 text-lg" : "min-w-10 text-2xl"} text-center font-display tabular-nums`}
      >
        {cantidad}
      </span>
      <button
        type="button"
        onClick={() => cambiarCantidad(id, 1)}
        aria-label={`Sumar una unidad de ${nombre}`}
        className={`${tamano} font-display text-oro transition-colors hover:bg-oro hover:text-negro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro`}
      >
        +
      </button>
    </div>
  );
}
