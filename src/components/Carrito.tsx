"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCarrito } from "@/context/CarritoContext";
import { CONTACTO } from "@/data/menu";
import { cop } from "@/lib/formato";

type Pago = "efectivo" | "transferencia";

type Datos = {
  nombre: string;
  telefono: string;
  direccion: string;
  referencias: string;
  pago: Pago;
  notas: string;
};

type Errores = Partial<Record<"nombre" | "telefono" | "direccion", string>>;

const VACIO: Datos = {
  nombre: "",
  telefono: "",
  direccion: "",
  referencias: "",
  pago: "efectivo",
  notas: "",
};

/** Reglas de los datos obligatorios; las usan el envío, la flecha y el resaltado. */
function validar(d: Datos): Errores {
  const errores: Errores = {};
  if (!d.nombre.trim()) errores.nombre = "Cuéntanos tu nombre";
  if (d.telefono.replace(/\D/g, "").length < 7)
    errores.telefono = "Escribe un teléfono válido";
  if (!d.direccion.trim()) errores.direccion = "Necesitamos la dirección";
  return errores;
}

const CAMPO =
  "w-full border border-hueso/20 bg-negro px-3 py-3 font-body text-hueso placeholder:text-hueso/30 focus:border-oro focus:outline-none";

export default function Carrito() {
  const {
    items,
    abierto,
    total,
    cantidadTotal,
    abrir,
    cerrar,
    cambiarCantidad,
    quitar,
    vaciar,
  } = useCarrito();

  const [datos, setDatos] = useState<Datos>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  // Veces que el cliente tocó "Enviar" con datos incompletos
  const [intentos, setIntentos] = useState(0);
  const botonCerrarRef = useRef<HTMLButtonElement>(null);
  const botonFlotanteRef = useRef<HTMLButtonElement>(null);
  const estabaAbierto = useRef(false);

  // Escape cierra, se bloquea el scroll de fondo y el foco viaja al panel
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    document.addEventListener("keydown", alTeclear);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    botonCerrarRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, cerrar]);

  // Al cerrar, el foco regresa al botón flotante
  useEffect(() => {
    if (estabaAbierto.current && !abierto) botonFlotanteRef.current?.focus();
    estabaAbierto.current = abierto;
  }, [abierto]);

  const actualizar = <K extends keyof Datos>(campo: K, valor: Datos[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    if (campo in errores) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  // La flecha aparece desde el 2.º clic fallido y se apaga sola al completar los datos
  const faltanDatos = Object.keys(validar(datos)).length > 0;
  const mostrarPista = intentos >= 2 && faltanDatos && items.length > 0;

  /** Baja el panel hasta el primer campo que falta y le da el foco. */
  const irAlPrimerFaltante = (faltantes: Errores) => {
    const clave = Object.keys(faltantes)[0];
    if (!clave) return;
    const campo = document.getElementById(`c-${clave}`);
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    campo?.scrollIntoView({
      behavior: sinMovimiento ? "auto" : "smooth",
      block: "center",
    });
    campo?.focus({ preventScroll: true });
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const nuevos = validar(datos);
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      const intento = intentos + 1;
      setIntentos(intento);
      if (intento >= 2) irAlPrimerFaltante(nuevos);
      return;
    }
    setIntentos(0);

    const lineas = items.map(
      (i) => `• ${i.cantidad} x ${i.nombre} — ${cop(i.precio * i.cantidad)}`,
    );
    const mensaje = [
      "*Pedido Elegant Street* 🍔",
      "",
      ...lineas,
      "",
      `*Total:* ${cop(total)} (domicilio aparte)`,
      "",
      `*Nombre:* ${datos.nombre.trim()}`,
      `*Teléfono:* ${datos.telefono.trim()}`,
      `*Dirección:* ${datos.direccion.trim()}`,
      datos.referencias.trim()
        ? `*Barrio / referencias:* ${datos.referencias.trim()}`
        : null,
      `*Pago:* ${datos.pago === "efectivo" ? "Efectivo" : "Transferencia"}`,
      datos.notas.trim() ? `*Notas:* ${datos.notas.trim()}` : null,
    ]
      .filter((l): l is string => l !== null)
      .join("\n");

    const url = `https://wa.me/${CONTACTO.whatsappNumero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        ref={botonFlotanteRef}
        type="button"
        onClick={abrir}
        aria-label={`Abrir mi pedido, ${cantidadTotal} ${cantidadTotal === 1 ? "producto" : "productos"}`}
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-3 bg-oro px-5 py-3 font-display text-lg uppercase tracking-widest text-negro shadow-[5px_5px_0_0_rgba(255,255,255,0.9)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_rgba(255,255,255,0.9)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oro ${
          abierto ? "pointer-events-none opacity-0" : ""
        }`}
      >
        <span>Mi pedido</span>
        <span className="flex h-7 min-w-7 items-center justify-center bg-negro px-1.5 text-base text-oro tabular-nums">
          {cantidadTotal}
        </span>
      </button>

      {/* Fondo oscuro */}
      <div
        onClick={cerrar}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-negro/75 backdrop-blur-sm transition-opacity duration-300 ${
          abierto ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel lateral */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="carrito-titulo"
        inert={!abierto}
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l-2 border-oro bg-carbon shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          abierto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-hueso/10 px-6 py-5">
          <h2
            id="carrito-titulo"
            className="font-display text-3xl uppercase tracking-wide"
          >
            Tu <span className="text-oro">pedido</span>
          </h2>
          <button
            ref={botonCerrarRef}
            type="button"
            onClick={cerrar}
            aria-label="Cerrar el carrito"
            className="flex h-10 w-10 items-center justify-center border border-hueso/20 text-2xl text-hueso transition-colors hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-oro"
          >
            ×
          </button>
        </header>

        <form onSubmit={enviar} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {items.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-display text-3xl uppercase text-hueso/40">
                  Aún no hay nada
                </p>
                <p className="mt-3 font-marker text-lg text-oro">
                  agrega algo del menú
                </p>
                <a
                  href="#menu"
                  onClick={cerrar}
                  className="mt-8 inline-block border-b-2 border-oro pb-1 font-body text-sm font-bold uppercase tracking-[0.25em] text-hueso transition-colors hover:text-oro"
                >
                  Ver el menú
                </a>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-hueso/10">
                  {items.map((i) => (
                    <li key={i.id} className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-body font-bold leading-tight">{i.nombre}</p>
                        <p className="font-display text-xl tracking-wide text-oro">
                          {cop(i.precio * i.cantidad)}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center border border-hueso/20">
                          <button
                            type="button"
                            onClick={() => cambiarCantidad(i.id, -1)}
                            aria-label={`Quitar una unidad de ${i.nombre}`}
                            className="h-8 w-8 font-display text-lg text-hueso transition-colors hover:bg-oro hover:text-negro"
                          >
                            −
                          </button>
                          <span className="min-w-8 text-center font-display text-lg tabular-nums">
                            {i.cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => cambiarCantidad(i.id, 1)}
                            aria-label={`Sumar una unidad de ${i.nombre}`}
                            className="h-8 w-8 font-display text-lg text-hueso transition-colors hover:bg-oro hover:text-negro"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => quitar(i.id)}
                          className="font-body text-xs font-bold uppercase tracking-[0.2em] text-hueso/50 underline underline-offset-4 transition-colors hover:text-oro"
                        >
                          Quitar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={vaciar}
                  className="mt-2 font-body text-xs uppercase tracking-[0.2em] text-hueso/40 underline underline-offset-4 transition-colors hover:text-oro"
                >
                  Vaciar pedido
                </button>

                {/* Datos de entrega */}
                <fieldset
                  className={`mt-8 space-y-4 border-t border-hueso/10 pt-6 ${
                    mostrarPista ? "pista-datos" : ""
                  }`}
                >
                  <legend className="mb-2 font-display text-2xl uppercase tracking-wide">
                    Datos de <span className="text-oro">entrega</span>
                  </legend>

                  <div>
                    <label htmlFor="c-nombre" className="mb-1 block font-body text-sm font-semibold">
                      Nombre
                    </label>
                    <input
                      id="c-nombre"
                      value={datos.nombre}
                      onChange={(e) => actualizar("nombre", e.target.value)}
                      autoComplete="name"
                      aria-invalid={!!errores.nombre}
                      aria-describedby={errores.nombre ? "e-nombre" : undefined}
                      className={CAMPO}
                      placeholder="¿Cómo te llamas?"
                    />
                    {errores.nombre && (
                      <p id="e-nombre" role="alert" className="mt-1 text-sm font-semibold text-red-400">
                        {errores.nombre}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="c-telefono" className="mb-1 block font-body text-sm font-semibold">
                      Teléfono
                    </label>
                    <input
                      id="c-telefono"
                      type="tel"
                      inputMode="tel"
                      value={datos.telefono}
                      onChange={(e) => actualizar("telefono", e.target.value)}
                      autoComplete="tel"
                      aria-invalid={!!errores.telefono}
                      aria-describedby={errores.telefono ? "e-telefono" : undefined}
                      className={CAMPO}
                      placeholder="311 000 0000"
                    />
                    {errores.telefono && (
                      <p id="e-telefono" role="alert" className="mt-1 text-sm font-semibold text-red-400">
                        {errores.telefono}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="c-direccion" className="mb-1 block font-body text-sm font-semibold">
                      Dirección
                    </label>
                    <input
                      id="c-direccion"
                      value={datos.direccion}
                      onChange={(e) => actualizar("direccion", e.target.value)}
                      autoComplete="street-address"
                      aria-invalid={!!errores.direccion}
                      aria-describedby={errores.direccion ? "e-direccion" : undefined}
                      className={CAMPO}
                      placeholder="Calle, número, apto"
                    />
                    {errores.direccion && (
                      <p id="e-direccion" role="alert" className="mt-1 text-sm font-semibold text-red-400">
                        {errores.direccion}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="c-referencias" className="mb-1 block font-body text-sm font-semibold">
                      Barrio o referencias <span className="font-normal text-hueso/40">(opcional)</span>
                    </label>
                    <input
                      id="c-referencias"
                      value={datos.referencias}
                      onChange={(e) => actualizar("referencias", e.target.value)}
                      className={CAMPO}
                      placeholder="Cerca de..., portón negro"
                    />
                  </div>

                  <div role="radiogroup" aria-label="Método de pago">
                    <p className="mb-2 font-body text-sm font-semibold">Método de pago</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["efectivo", "transferencia"] as const).map((p) => (
                        <label
                          key={p}
                          className={`cursor-pointer border px-3 py-3 text-center font-display text-lg uppercase tracking-wide transition-colors ${
                            datos.pago === p
                              ? "border-oro bg-oro text-negro"
                              : "border-hueso/20 text-hueso hover:border-oro"
                          }`}
                        >
                          <input
                            type="radio"
                            name="pago"
                            value={p}
                            checked={datos.pago === p}
                            onChange={() => actualizar("pago", p)}
                            className="sr-only"
                          />
                          {p === "efectivo" ? "Efectivo" : "Transferencia"}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="c-notas" className="mb-1 block font-body text-sm font-semibold">
                      Notas <span className="font-normal text-hueso/40">(opcional)</span>
                    </label>
                    <textarea
                      id="c-notas"
                      rows={2}
                      value={datos.notas}
                      onChange={(e) => actualizar("notas", e.target.value)}
                      className={`${CAMPO} resize-none`}
                      placeholder="Sin cebolla, extra servilletas..."
                    />
                  </div>
                </fieldset>
              </>
            )}
          </div>

          {/* Total y envío */}
          <footer className="relative border-t-2 border-oro bg-negro px-6 py-5">
            {/* Anuncio para lectores de pantalla */}
            <p role="status" className="sr-only">
              {mostrarPista
                ? "Faltan datos de entrega. Completa nombre, teléfono y dirección para enviar tu pedido."
                : ""}
            </p>

            {/* Flecha guía: aparece sobre el total desde el 2.º clic, sin tapar los campos */}
            {mostrarPista && (
              <div className="mb-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => irAlPrimerFaltante(validar(datos))}
                  className="flecha-sube flex items-center gap-2 bg-oro px-4 py-2 font-display text-lg uppercase tracking-wide text-negro shadow-[4px_4px_0_0_rgba(255,255,255,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
                >
                  <span aria-hidden="true" className="text-2xl leading-none">
                    ↑
                  </span>
                  Completa tus datos de entrega
                </button>
              </div>
            )}

            <div className="flex items-baseline justify-between">
              <span className="font-body text-sm font-bold uppercase tracking-[0.25em] text-hueso/60">
                Total
              </span>
              <span className="font-display text-4xl tracking-wide text-oro">
                {cop(total)}
              </span>
            </div>
            <p className="mt-1 font-body text-xs text-hueso/50">
              El domicilio se confirma por WhatsApp.
            </p>
            <button
              type="submit"
              disabled={items.length === 0}
              className="mt-4 w-full bg-oro py-4 font-display text-xl uppercase tracking-widest text-negro transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro disabled:cursor-not-allowed disabled:opacity-30"
            >
              Enviar pedido por WhatsApp
            </button>
          </footer>
        </form>
      </aside>
    </>
  );
}
