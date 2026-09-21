"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Insumo } from "@/data/admin";
import { COSTO_COMPRA_POR_DEFECTO } from "@/lib/caja";
import { cop } from "@/lib/formato";
import Icono from "./Iconos";

type Props = {
  insumos: Insumo[];
  onCerrar: () => void;
  onConfirmar: (nombre: string, cantidad: number, costo: number) => void;
};

const MAXIMO = 999;
const COSTO_MAXIMO = 100_000_000;

const CAMPO =
  "w-full border border-p-texto/20 bg-p-fondo px-3 py-3 font-body text-p-texto placeholder:text-p-texto/35 focus:border-p-acento focus:outline-none";

/**
 * Ventana para registrar la entrada de un insumo (compra o reposición).
 * Se monta solo cuando está abierta, así cada apertura empieza con el formulario limpio.
 */
export default function ModalEntrada({ insumos, onCerrar, onConfirmar }: Props) {
  // Por defecto se ofrece el insumo más urgente, que casi siempre es el que se quiere reponer
  const urgente =
    insumos.find((i) => i.nivel === "critico") ??
    insumos.find((i) => i.nivel === "bajo") ??
    insumos[0];
  const [nombre, setNombre] = useState(urgente.nombre);
  const [cantidad, setCantidad] = useState("");
  const [costo, setCosto] = useState(String(COSTO_COMPRA_POR_DEFECTO));
  const [errorCantidad, setErrorCantidad] = useState("");
  const [errorCosto, setErrorCosto] = useState("");
  const selectRef = useRef<HTMLSelectElement>(null);

  // Escape cierra, se bloquea el scroll de fondo y el foco vuelve al botón que abrió la ventana
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alTeclear);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    selectRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = overflowPrevio;
      if (previo?.isConnected) previo.focus();
    };
  }, [onCerrar]);

  const insumo = insumos.find((i) => i.nombre === nombre) ?? urgente;
  const n = Number(cantidad);
  const valida = Number.isInteger(n) && n >= 1 && n <= MAXIMO;
  const c = Number(costo);
  const costoValido = costo.trim() !== "" && Number.isInteger(c) && c >= 1 && c <= COSTO_MAXIMO;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setErrorCantidad(valida ? "" : `Escribe una cantidad entera entre 1 y ${MAXIMO}`);
    setErrorCosto(costoValido ? "" : "Escribe un costo entero mayor a $ 0");
    if (!valida || !costoValido) return;
    onConfirmar(insumo.nombre, n, c);
  };

  return (
    <>
      <div
        onClick={onCerrar}
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-p-fondo/75 backdrop-blur-sm transition-opacity duration-300 starting:opacity-0"
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <form
          role="dialog"
          aria-modal="true"
          aria-labelledby="entrada-titulo"
          onSubmit={enviar}
          noValidate
          className="pointer-events-auto max-h-[92dvh] w-full max-w-md overflow-y-auto border-2 border-p-acento bg-p-panel shadow-2xl transition-all duration-300 starting:translate-y-6 starting:opacity-0"
        >
          <header className="flex items-start justify-between gap-4 border-b border-p-texto/10 px-6 py-5">
            <div>
              <h2
                id="entrada-titulo"
                className="font-display text-3xl uppercase tracking-wide"
              >
                Registrar <span className="text-p-plata-texto">entrada</span>
              </h2>
              <p className="mt-1 font-body text-sm text-p-texto/60">
                Suma al stock lo que acaba de llegar y deja el gasto en caja.
              </p>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar sin registrar"
              className="flex h-10 w-10 shrink-0 items-center justify-center border border-p-texto/20 transition-colors hover:border-p-acento hover:text-p-acento focus-visible:outline-2 focus-visible:outline-p-acento"
            >
              <Icono nombre="cerrar" className="h-5 w-5" />
            </button>
          </header>

          <div className="space-y-5 px-6 py-6">
            <div>
              <label htmlFor="entrada-insumo" className="mb-1 block font-body text-sm font-semibold">
                Insumo
              </label>
              <select
                id="entrada-insumo"
                ref={selectRef}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={CAMPO}
              >
                {insumos.map((i) => (
                  <option key={i.nombre} value={i.nombre}>
                    {i.nombre} — hay {i.cantidad} {i.unidad}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="entrada-cantidad" className="mb-1 block font-body text-sm font-semibold">
                Cantidad que entra{" "}
                <span className="font-normal text-p-texto/50">({insumo.unidad})</span>
              </label>
              <input
                id="entrada-cantidad"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAXIMO}
                step={1}
                value={cantidad}
                onChange={(e) => {
                  setCantidad(e.target.value);
                  setErrorCantidad("");
                }}
                aria-invalid={!!errorCantidad}
                aria-describedby={errorCantidad ? "entrada-error" : "entrada-vista"}
                placeholder="Ej. 20"
                className={CAMPO}
              />
              {errorCantidad ? (
                <p id="entrada-error" role="alert" className="mt-1 text-sm font-semibold text-p-peligro">
                  {errorCantidad}
                </p>
              ) : (
                <p id="entrada-vista" className="mt-2 font-body text-sm text-p-texto/60">
                  {valida ? (
                    <>
                      Quedará en{" "}
                      <strong className="font-display text-lg tracking-wide text-p-ok">
                        {insumo.cantidad + n}
                      </strong>{" "}
                      {insumo.unidad}
                    </>
                  ) : (
                    <>
                      Ahora hay{" "}
                      <strong className="font-display text-lg tracking-wide text-p-texto">
                        {insumo.cantidad}
                      </strong>{" "}
                      {insumo.unidad}
                    </>
                  )}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="entrada-costo" className="mb-1 block font-body text-sm font-semibold">
                Costo de la compra <span className="font-normal text-p-texto/50">(en pesos)</span>
              </label>
              <input
                id="entrada-costo"
                type="number"
                inputMode="numeric"
                min={1}
                step={500}
                value={costo}
                onChange={(e) => {
                  setCosto(e.target.value);
                  setErrorCosto("");
                }}
                aria-invalid={!!errorCosto}
                aria-describedby={errorCosto ? "costo-error" : "costo-vista"}
                className={CAMPO}
              />
              {errorCosto ? (
                <p id="costo-error" role="alert" className="mt-1 text-sm font-semibold text-p-peligro">
                  {errorCosto}
                </p>
              ) : (
                <p id="costo-vista" className="mt-2 font-body text-sm text-p-texto/60">
                  {costoValido ? (
                    <>
                      Se registrará en caja como un egreso de{" "}
                      <strong className="font-display text-lg tracking-wide text-p-peligro">
                        {cop(c)}
                      </strong>
                      . Valor ficticio: cámbialo si quieres.
                    </>
                  ) : (
                    "Escribe cuánto costó esta compra."
                  )}
                </p>
              )}
            </div>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-p-texto/10 px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCerrar}
              className="border border-p-texto/25 px-6 py-3 font-display text-lg uppercase tracking-widest text-p-texto/80 transition-colors hover:border-p-acento hover:text-p-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-acento"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-p-acento px-6 py-3 font-display text-lg uppercase tracking-widest text-p-sobre-acento shadow-[4px_4px_0_0_var(--p-sombra)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--p-sombra)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-p-acento"
            >
              Confirmar entrada
            </button>
          </footer>
        </form>
      </div>
    </>
  );
}
