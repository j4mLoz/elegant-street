"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { crearPedido } from "@/app/acciones";
import { CONTACTO } from "@/data/menu";
import { MAXIMO_POR_PRODUCTO, useCarrito } from "@/context/CarritoContext";
import { atribucionVigente, sesionId } from "@/lib/atribucion";
import { cop, formatoNumero, hamburguesas } from "@/lib/formato";
import type { CampoPedido } from "@/lib/pedido";
import type { EstadoServicio } from "@/lib/servicio";
import { enlaceWhatsApp, mensajePedido } from "@/lib/whatsapp";
import { textoServicio } from "./AvisoServicio";

type Pago = "efectivo" | "transferencia";

type Datos = {
  nombre: string;
  telefono: string;
  torre: string;
  apto: string;
  pago: Pago;
  notas: string;
};

type Errores = Partial<Record<CampoPedido, string>>;

type Confirmacion = {
  numero: number;
  total: number;
  pago: Pago;
  llave: string;
  enlace: string;
};

const VACIO: Datos = { nombre: "", telefono: "", torre: "", apto: "", pago: "efectivo", notas: "" };

const ORDEN_CAMPOS: CampoPedido[] = ["nombre", "telefono", "torre", "apto", "pago"];

const soloCelular = (t: string) => t.replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, "");

/** Validación rápida en el navegador; el servidor vuelve a validar todo. */
function validar(d: Datos): Errores {
  const e: Errores = {};
  if (d.nombre.trim().length < 2) e.nombre = "Cuéntanos tu nombre";
  if (!/^3\d{9}$/.test(soloCelular(d.telefono)))
    e.telefono = "Escribe un celular de 10 dígitos (ej. 311 374 9498)";
  if (!d.torre.trim()) e.torre = "¿En qué torre?";
  if (!d.apto.trim()) e.apto = "¿Qué apartamento?";
  return e;
}

const CAMPO =
  "w-full border border-hueso/25 bg-negro px-3 py-3 font-body text-base text-hueso placeholder:text-hueso/35 focus:border-oro focus:outline-none aria-[invalid=true]:border-alerta";

export default function Carrito({ estado }: { estado: EstadoServicio | null }) {
  const { items, abierto, total, cantidadTotal, abrir, cerrar, cambiarCantidad, quitar, vaciar } =
    useCarrito();

  const [datos, setDatos] = useState<Datos>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState<Confirmacion | null>(null);
  const [enviando, iniciarEnvio] = useTransition();
  const router = useRouter();
  const trampaRef = useRef<HTMLInputElement>(null);
  const botonCerrarRef = useRef<HTMLButtonElement>(null);
  const botonFlotanteRef = useRef<HTMLButtonElement>(null);
  const confirmacionRef = useRef<HTMLHeadingElement>(null);
  const estabaAbierto = useRef(false);

  const domicilio = estado?.domicilio ?? 0;
  const servicio = textoServicio(estado);
  // Si no se pudo consultar el estado, se deja enviar: el servidor decide.
  const cerrado = estado !== null && !estado.abierto;
  const quedan = estado?.abierto ? estado.quedan : null;
  const pasaCupo = quedan !== null && cantidadTotal > quedan;

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

  useEffect(() => {
    if (confirmado) confirmacionRef.current?.focus();
  }, [confirmado]);

  const actualizar = <K extends keyof Datos>(campo: K, valor: Datos[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    if (campo in errores) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const irAlPrimerFaltante = (faltantes: Errores) => {
    const clave = ORDEN_CAMPOS.find((c) => faltantes[c]);
    if (!clave) return;
    const campo = document.getElementById(`c-${clave}`);
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    campo?.scrollIntoView({ behavior: sinMovimiento ? "auto" : "smooth", block: "center" });
    campo?.focus({ preventScroll: true });
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || enviando) return;

    const nuevos = validar(datos);
    setErrores(nuevos);
    setErrorGeneral(null);
    if (Object.keys(nuevos).length > 0) {
      irAlPrimerFaltante(nuevos);
      return;
    }

    const atrib = atribucionVigente();
    const enviados = { ...datos };

    iniciarEnvio(async () => {
      const r = await crearPedido({
        ...enviados,
        items: items.map((i) => ({ id: i.id, cantidad: i.cantidad })),
        origen: atrib.origen,
        campana: atrib.campana,
        referrer: atrib.referrer,
        sesionId: sesionId(),
        sitio_web: trampaRef.current?.value ?? "",
      });

      if (!r.ok) {
        if (r.campos && Object.keys(r.campos).length > 0) {
          setErrores(r.campos);
          irAlPrimerFaltante(r.campos);
        }
        setErrorGeneral(r.mensaje);
        // Cerraron o se acabó el cupo mientras el cliente llenaba: refresca el estado
        if (r.error === "cupo_lleno" || r.error === "fuera_de_horario") router.refresh();
        return;
      }

      const enlace = enlaceWhatsApp(
        mensajePedido({
          numero: r.numero,
          items: r.items,
          subtotal: r.subtotal,
          domicilio: r.domicilio,
          total: r.total,
          nombre: enviados.nombre.trim(),
          telefono: soloCelular(enviados.telefono),
          torre: enviados.torre.trim(),
          apto: enviados.apto.trim(),
          pago: enviados.pago,
          notas: enviados.notas,
        }),
      );

      setConfirmado({
        numero: r.numero,
        total: r.total,
        pago: enviados.pago,
        llave: r.llaveTransferencia,
        enlace,
      });
      setDatos(VACIO);
      setErrores({});
      vaciar();

      // Intenta abrir WhatsApp de una vez; si el navegador lo bloquea, queda el botón.
      window.open(enlace, "_blank", "noopener,noreferrer");
    });
  };

  const nuevoPedido = () => {
    setConfirmado(null);
    cerrar();
  };

  const errorDe = (campo: CampoPedido) =>
    errores[campo] ? (
      <p id={`e-${campo}`} role="alert" className="mt-1 text-sm font-semibold text-alerta">
        {errores[campo]}
      </p>
    ) : null;

  const propsCampo = (campo: CampoPedido) => ({
    id: `c-${campo}`,
    "aria-invalid": !!errores[campo],
    "aria-describedby": errores[campo] ? `e-${campo}` : undefined,
  });

  return (
    <>
      {/* Botón flotante */}
      <button
        ref={botonFlotanteRef}
        type="button"
        onClick={abrir}
        aria-label={
          confirmado
            ? `Ver tu pedido ${formatoNumero(confirmado.numero)}`
            : `Abrir mi pedido, ${cantidadTotal} ${cantidadTotal === 1 ? "producto" : "productos"}`
        }
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-3 bg-oro px-5 py-3 font-display text-lg font-extrabold uppercase tracking-widest text-negro shadow-[4px_4px_0_0_rgba(255,255,255,0.35)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(255,255,255,0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oro ${
          abierto || (cantidadTotal === 0 && !confirmado) ? "pointer-events-none opacity-0" : ""
        }`}
        tabIndex={abierto || (cantidadTotal === 0 && !confirmado) ? -1 : undefined}
        aria-hidden={abierto || (cantidadTotal === 0 && !confirmado) ? true : undefined}
      >
        {confirmado ? (
          <span>Pedido {formatoNumero(confirmado.numero)}</span>
        ) : (
          <>
            <span>Mi pedido</span>
            <span className="flex h-7 min-w-7 items-center justify-center bg-negro px-1.5 text-base text-oro tabular-nums">
              {cantidadTotal}
            </span>
          </>
        )}
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
          <h2 id="carrito-titulo" className="font-display text-3xl font-black uppercase tracking-tight">
            {confirmado ? "Pedido recibido" : "Tu pedido"}
          </h2>
          <button
            ref={botonCerrarRef}
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center border border-hueso/25 text-2xl text-hueso transition-colors hover:border-oro focus-visible:outline-2 focus-visible:outline-oro"
          >
            ×
          </button>
        </header>

        {confirmado ? (
          /* ── Confirmación honesta: el pedido está guardado, falta confirmarlo ── */
          <div className="flex min-h-0 flex-1 flex-col">
            <div role="status" className="flex-1 overflow-y-auto px-6 py-8">
              <p className="font-body text-xs font-bold uppercase tracking-[0.35em] text-hueso/60">
                Número de pedido
              </p>
              <h3
                ref={confirmacionRef}
                tabIndex={-1}
                className="mt-1 font-display text-7xl font-black leading-none tracking-tight outline-none"
              >
                {formatoNumero(confirmado.numero)}
              </h3>

              <p className="mt-6 font-body text-xl font-semibold leading-snug">
                Recibimos tu pedido. Confírmalo por WhatsApp para que lo preparemos.
              </p>
              <p className="mt-3 font-body text-hueso/70">
                Te abrimos WhatsApp con el pedido ya escrito: solo dale enviar. Si no se abrió,
                usa el botón de abajo.
              </p>

              <dl className="mt-6 space-y-2 border-y border-hueso/15 py-4 font-body">
                <div className="flex justify-between gap-4">
                  <dt className="text-hueso/60">Total</dt>
                  <dd className="font-display text-2xl font-extrabold">{cop(confirmado.total)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-hueso/60">Pago</dt>
                  <dd className="font-semibold capitalize">{confirmado.pago}</dd>
                </div>
              </dl>

              {confirmado.pago === "transferencia" && (
                <div className="mt-5 border border-hueso/25 p-4 font-body">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-hueso/60">
                    Transferencia
                  </p>
                  {confirmado.llave ? (
                    <>
                      <p className="mt-2 select-all break-all font-display text-xl font-extrabold">
                        {confirmado.llave}
                      </p>
                      <p className="mt-2 text-sm text-hueso/70">
                        Envía el comprobante en el mismo chat de WhatsApp.
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-hueso/80">
                      Te enviamos los datos para transferir por WhatsApp.
                    </p>
                  )}
                </div>
              )}
            </div>

            <footer className="space-y-3 border-t-2 border-oro bg-negro px-6 py-5">
              <a
                href={confirmado.enlace}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-3 bg-oro py-4 font-display text-xl font-extrabold uppercase tracking-widest text-negro transition-all hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
              >
                Confirmar por WhatsApp
              </a>
              <button
                type="button"
                onClick={nuevoPedido}
                className="w-full py-2 font-body text-sm font-bold uppercase tracking-[0.2em] text-hueso/60 underline underline-offset-4 transition-colors hover:text-hueso"
              >
                Hacer otro pedido
              </button>
            </footer>
          </div>
        ) : (
          <form onSubmit={enviar} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {servicio && !servicio.abierto && (
                <p role="status" className="mb-6 border border-hueso/30 px-4 py-3 font-body text-sm">
                  <strong className="block font-display text-base font-extrabold uppercase tracking-wide">
                    {servicio.titulo}
                  </strong>
                  {servicio.detalle && <span className="text-hueso/70">{servicio.detalle}</span>}
                </p>
              )}

              {items.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="font-display text-3xl font-extrabold uppercase text-hueso/40">
                    Aún no hay nada
                  </p>
                  <p className="mt-3 font-marker text-lg">agrega tu street del menú</p>
                  <a
                    href="#menu"
                    onClick={cerrar}
                    className="mt-8 inline-block border-b-2 border-oro pb-1 font-body text-sm font-bold uppercase tracking-[0.25em] text-hueso"
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
                          <p className="font-display text-xl font-extrabold">{cop(i.precio * i.cantidad)}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center border border-hueso/25">
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(i.id, -1)}
                              aria-label={`Quitar una unidad de ${i.nombre}`}
                              className="h-10 w-10 font-display text-lg text-hueso transition-colors hover:bg-oro hover:text-negro"
                            >
                              −
                            </button>
                            <span className="min-w-8 text-center font-display text-lg font-bold tabular-nums">
                              {i.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(i.id, 1)}
                              disabled={i.cantidad >= MAXIMO_POR_PRODUCTO}
                              aria-label={`Sumar una unidad de ${i.nombre}`}
                              className="h-10 w-10 font-display text-lg text-hueso transition-colors hover:bg-oro hover:text-negro disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => quitar(i.id)}
                            className="font-body text-xs font-bold uppercase tracking-[0.2em] text-hueso/55 underline underline-offset-4 hover:text-hueso"
                          >
                            Quitar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Datos de entrega */}
                  <fieldset className="relative mt-6 space-y-4 border-t border-hueso/10 pt-6">
                    <legend className="mb-1 font-display text-2xl font-black uppercase tracking-tight">
                      Datos de entrega
                    </legend>
                    <p className="font-body text-sm text-hueso/60">
                      Entregamos en tu apartamento de la {CONTACTO.zona}.
                    </p>

                    <div>
                      <label htmlFor="c-nombre" className="mb-1 block font-body text-sm font-semibold">
                        Nombre
                      </label>
                      <input
                        {...propsCampo("nombre")}
                        value={datos.nombre}
                        onChange={(e) => actualizar("nombre", e.target.value)}
                        autoComplete="name"
                        maxLength={60}
                        className={CAMPO}
                        placeholder="¿Cómo te llamas?"
                      />
                      {errorDe("nombre")}
                    </div>

                    <div>
                      <label htmlFor="c-telefono" className="mb-1 block font-body text-sm font-semibold">
                        Celular (WhatsApp)
                      </label>
                      <input
                        {...propsCampo("telefono")}
                        type="tel"
                        inputMode="tel"
                        value={datos.telefono}
                        onChange={(e) => actualizar("telefono", e.target.value)}
                        autoComplete="tel-national"
                        maxLength={16}
                        className={CAMPO}
                        placeholder="311 000 0000"
                      />
                      {errorDe("telefono")}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="c-torre" className="mb-1 block font-body text-sm font-semibold">
                          Torre
                        </label>
                        <input
                          {...propsCampo("torre")}
                          value={datos.torre}
                          onChange={(e) => actualizar("torre", e.target.value)}
                          maxLength={10}
                          className={CAMPO}
                          placeholder="Ej. 3"
                        />
                        {errorDe("torre")}
                      </div>
                      <div>
                        <label htmlFor="c-apto" className="mb-1 block font-body text-sm font-semibold">
                          Apartamento
                        </label>
                        <input
                          {...propsCampo("apto")}
                          value={datos.apto}
                          onChange={(e) => actualizar("apto", e.target.value)}
                          maxLength={10}
                          className={CAMPO}
                          placeholder="Ej. 502"
                        />
                        {errorDe("apto")}
                      </div>
                    </div>

                    <fieldset>
                      <legend className="mb-2 font-body text-sm font-semibold">¿Cómo pagas?</legend>
                      <div className="grid grid-cols-2 gap-2">
                        {(["efectivo", "transferencia"] as const).map((p) => (
                          <label
                            key={p}
                            className={`cursor-pointer border px-3 py-3 text-center font-display text-base font-extrabold uppercase tracking-wide transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-oro ${
                              datos.pago === p
                                ? "border-oro bg-oro text-negro"
                                : "border-hueso/25 text-hueso hover:border-oro"
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
                    </fieldset>

                    <div>
                      <label htmlFor="c-notas" className="mb-1 block font-body text-sm font-semibold">
                        Notas <span className="font-normal text-hueso/50">(opcional)</span>
                      </label>
                      <textarea
                        id="c-notas"
                        rows={2}
                        maxLength={300}
                        value={datos.notas}
                        onChange={(e) => actualizar("notas", e.target.value)}
                        className={`${CAMPO} resize-none`}
                        placeholder="Sin tomate, timbrar dos veces..."
                      />
                    </div>

                    {/* Campo trampa: invisible para personas y lectores de pantalla */}
                    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                      <label htmlFor="c-sitio">No llenar este campo</label>
                      <input
                        ref={trampaRef}
                        id="c-sitio"
                        name="sitio_web"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        defaultValue=""
                      />
                    </div>
                  </fieldset>
                </>
              )}
            </div>

            {/* Total y envío */}
            <footer className="border-t-2 border-oro bg-negro px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="font-body text-sm font-bold uppercase tracking-[0.25em] text-hueso/60">
                  Total
                </span>
                <span className="font-display text-4xl font-black tracking-tight">
                  {cop(items.length ? total + domicilio : 0)}
                </span>
              </div>
              <p className="mt-1 font-body text-xs text-hueso/55">
                {domicilio > 0
                  ? `Incluye domicilio de ${cop(domicilio)}.`
                  : "Domicilio sin costo dentro de la unidad."}
                {quedan !== null && ` Quedan ${hamburguesas(quedan)} para hoy.`}
              </p>

              {pasaCupo && (
                <p role="alert" className="mt-3 text-sm font-semibold text-alerta">
                  Solo quedan {hamburguesas(quedan ?? 0)} para hoy. Ajusta tu pedido.
                </p>
              )}
              {errorGeneral && (
                <p role="alert" className="mt-3 text-sm font-semibold text-alerta">
                  {errorGeneral}
                </p>
              )}

              <button
                type="submit"
                disabled={items.length === 0 || enviando || cerrado || pasaCupo}
                aria-busy={enviando}
                className="mt-4 w-full bg-oro py-4 font-display text-xl font-extrabold uppercase tracking-widest text-negro transition-all hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro disabled:cursor-not-allowed disabled:opacity-35"
              >
                {enviando ? "Enviando…" : cerrado ? "Cerrado por ahora" : "Hacer pedido"}
              </button>
            </footer>
          </form>
        )}
      </aside>
    </>
  );
}
