"use client";

import { useState } from "react";
import { TOSTON } from "@/data/menu";
import { cop } from "@/lib/formato";
import BotonAgregar from "./BotonAgregar";

/** Tostón de queso, con opción de tocineta (cada variante es un ítem distinto del carrito). */
export default function TostonCard() {
  const [conTocineta, setConTocineta] = useState(false);

  const id = conTocineta ? `${TOSTON.id}-tocineta` : TOSTON.id;
  const nombre = conTocineta ? `${TOSTON.nombre} con tocineta` : TOSTON.nombre;
  const precio = TOSTON.precio + (conTocineta ? TOSTON.extraTocineta : 0);

  return (
    <article className="relative flex h-full flex-col overflow-hidden border-2 border-oro bg-negro p-7 sm:p-8">
      <span
        aria-hidden="true"
        className="absolute right-4 top-3 font-marker text-sm uppercase text-oro"
      >
        Adicional
      </span>
      <h4 className="mt-6 font-display text-4xl uppercase leading-none tracking-wide">
        {TOSTON.nombre}
      </h4>
      <p className="mt-3 font-body text-hueso/65">
        Crocante por fuera, queso derretido por dentro. Ideal para compartir.
      </p>

      <label className="mt-6 flex cursor-pointer items-center gap-3 font-body font-semibold">
        <input
          type="checkbox"
          checked={conTocineta}
          onChange={(e) => setConTocineta(e.target.checked)}
          className="h-5 w-5 accent-oro"
        />
        <span>
          Con tocineta{" "}
          <span className="text-oro">(+{cop(TOSTON.extraTocineta)})</span>
        </span>
      </label>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-hueso/10 pt-6">
        <span className="font-display text-3xl tracking-wide text-oro">
          {cop(precio)}
        </span>
        <BotonAgregar id={id} nombre={nombre} precio={precio} />
      </div>
    </article>
  );
}
