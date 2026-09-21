"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CAJA,
  INVENTARIO,
  META_DIA,
  PEDIDOS,
  RESUMEN,
  type EstadoPedido,
  type Insumo,
  type Pedido,
} from "@/data/admin";
import {
  ESTADO_PEDIDO,
  NIVEL_STOCK,
  emojiInsumo,
  emojiProducto,
  saludoPorHora,
} from "@/lib/emojis";
import { cop } from "@/lib/formato";

type SeccionId = "dashboard" | "pedidos" | "inventario" | "caja";
type Tema = "claro" | "oscuro";
type Ir = (id: SeccionId) => void;

/** Misma llave que la versión clásica: la elección de tema se comparte */
const LLAVE_TEMA = "elegant-street-admin-tema-v2";

const SECCIONES: { id: SeccionId; emoji: string; etiqueta: string }[] = [
  { id: "dashboard", emoji: "📊", etiqueta: "Dashboard" },
  { id: "pedidos", emoji: "🛍️", etiqueta: "Pedidos" },
  { id: "inventario", emoji: "📦", etiqueta: "Inventario" },
  { id: "caja", emoji: "💰", etiqueta: "Caja" },
];

const TITULOS: Record<Exclude<SeccionId, "dashboard">, { emoji: string; titulo: string; sub: string }> = {
  pedidos: {
    emoji: "🛍️",
    titulo: "Pedidos de hoy",
    sub: "Quién pidió, qué pidió y en qué va cada uno.",
  },
  inventario: {
    emoji: "📦",
    titulo: "Lo que hay en cocina",
    sub: "Rojo: pídelo hoy · Amarillo: pídelo pronto · Verde: todo bien",
  },
  caja: {
    emoji: "💰",
    titulo: "Cuánto entró y salió",
    sub: "El resumen de plata del día.",
  },
};

/* ───────── Piezas pequeñas ───────── */

/** El emoji es decoración accesible: el significado siempre viaja en texto al lado */
function E({ children }: { children: string }) {
  return (
    // text-p-texto (opaco): sin él, el emoji hereda la transparencia del texto gris y se ve apagado
    <span aria-hidden="true" className="select-none text-p-texto">
      {children}
    </span>
  );
}

function Enlace({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-semibold text-p-texto/60 underline decoration-p-plata decoration-2 underline-offset-4 transition-colors hover:text-p-texto focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-p-acento"
    >
      {children} →
    </button>
  );
}

function Bloque({
  emoji,
  titulo,
  accion,
  children,
}: {
  emoji: string;
  titulo: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-p-texto/10 pt-8">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-p-texto/70">
          <E>{emoji}</E> {titulo}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

function FilaPedido({ p }: { p: Pedido }) {
  const e = ESTADO_PEDIDO[p.estado];
  return (
    <li className="flex flex-wrap items-baseline gap-x-4 gap-y-2 py-5 sm:grid sm:grid-cols-[3.5rem_9rem_1fr_6.5rem_8.5rem] sm:items-center">
      <span className="font-display text-xl tracking-wide text-p-plata-texto">{p.numero}</span>
      <span className="font-semibold">{p.cliente}</span>
      <span className="flex basis-full flex-wrap gap-x-4 gap-y-1 text-p-texto/75 sm:basis-auto">
        {p.productos.split(" + ").map((nombre, i) => (
          <span key={i} className="whitespace-nowrap">
            <E>{emojiProducto(nombre)}</E> {nombre}
          </span>
        ))}
      </span>
      <span className="font-display text-xl tracking-wide tabular-nums sm:text-right">
        {cop(p.total)}
      </span>
      <span className="ml-auto text-sm font-semibold sm:ml-0">
        <E>{e.emoji}</E> {e.etiqueta}
      </span>
    </li>
  );
}

const COLOR_NIVEL: Record<Insumo["nivel"], string> = {
  critico: "bg-p-peligro-solido",
  bajo: "bg-p-alerta-solido",
  bien: "bg-p-ok-solido",
};

function FilaInsumo({ i }: { i: Insumo }) {
  const n = NIVEL_STOCK[i.nivel];
  const pct = Math.min(100, Math.round((i.cantidad / i.ideal) * 100));
  return (
    <li className="grid items-center gap-x-6 gap-y-2 py-5 sm:grid-cols-[13rem_9rem_1fr_8rem]">
      <span className="font-semibold">
        <E>{emojiInsumo(i.nombre)}</E> {i.nombre}
      </span>
      <span className="text-p-texto/70">
        <span className="font-display text-xl tracking-wide text-p-texto">{i.cantidad}</span>{" "}
        {i.unidad}
      </span>
      <div
        role="img"
        aria-label={`${pct}% del nivel ideal`}
        className="h-1 w-full bg-p-texto/10"
      >
        <div className={`h-full ${COLOR_NIVEL[i.nivel]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold sm:text-right">
        <E>{n.emoji}</E> {n.etiqueta}
      </span>
    </li>
  );
}

function BarraCaja({ alto = "h-1.5" }: { alto?: string }) {
  const pctEgresos = (CAJA.egresos / CAJA.ingresos) * 100;
  const pctGanancia = 100 - pctEgresos;
  return (
    <div
      role="img"
      aria-label={`De los ingresos, ${Math.round(pctGanancia)}% es ganancia y ${Math.round(pctEgresos)}% son egresos`}
      className={`flex overflow-hidden bg-p-texto/10 ${alto}`}
    >
      <div className="bg-p-ok-solido" style={{ width: `${pctGanancia}%` }} />
      <div className="bg-p-peligro-solido" style={{ width: `${pctEgresos}%` }} />
    </div>
  );
}

const lista = (nombres: string[]) =>
  new Intl.ListFormat("es", { style: "long", type: "conjunction" }).format(nombres);

/* ───────── Vistas ───────── */

function VistaDashboard({ ir }: { ir: Ir }) {
  const critico = INVENTARIO.find((i) => i.nivel === "critico");
  const bajos = INVENTARIO.filter((i) => i.nivel === "bajo");
  const pct = Math.min(100, Math.round((RESUMEN.ventasDia / META_DIA) * 100));
  const falta = Math.max(0, META_DIA - RESUMEN.ventasDia);
  const ganancia = CAJA.ingresos - CAJA.egresos;

  // "Hoy toca": lo que el dueño puede hacer ahora mismo
  const tareas: { emoji: string; texto: string; destino: SeccionId }[] = [];
  if (RESUMEN.pedidosPendientes > 0) {
    const n = RESUMEN.pedidosPendientes;
    tareas.push({
      emoji: ESTADO_PEDIDO.pendiente.emoji,
      texto: `${n} ${n === 1 ? "pedido espera" : "pedidos esperan"} tu confirmación`,
      destino: "pedidos",
    });
  }
  if (critico) {
    tareas.push({
      emoji: NIVEL_STOCK.critico.emoji,
      texto: `${critico.nombre}: quedan ${critico.cantidad} ${critico.unidad}. Pídelo hoy`,
      destino: "inventario",
    });
  }
  if (bajos.length > 0) {
    tareas.push({
      emoji: NIVEL_STOCK.bajo.emoji,
      texto: `${lista(bajos.map((b) => b.nombre))} ${bajos.length > 1 ? "van bajos. Pídelos" : "va bajo. Pídelo"} pronto`,
      destino: "inventario",
    });
  }

  return (
    <div className="space-y-14">
      {/* Cifra principal + meta */}
      <section>
        <p className="text-sm text-p-texto/60">
          <E>💰</E> Ventas de hoy
        </p>
        <p className="mt-2 font-display text-[clamp(3.6rem,13vw,7.5rem)] leading-none tracking-tight tabular-nums">
          {cop(RESUMEN.ventasDia)}
        </p>

        <div className="mt-8 max-w-xl">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold">
              {falta === 0 ? (
                <>
                  <E>🎉</E> ¡Meta cumplida!
                </>
              ) : (
                <>
                  <E>🎯</E> Meta del día
                </>
              )}
            </span>
            <span className="tabular-nums text-p-texto/60">{pct}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Avance de la meta del día"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-2 h-1 bg-p-texto/10"
          >
            <div className="h-full bg-p-acento" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm text-p-texto/60">
            {falta === 0
              ? `Superaste tu meta de ${cop(META_DIA)}`
              : `Te faltan ${cop(falta)} para llegar a ${cop(META_DIA)}`}
          </p>
        </div>
      </section>

      {/* Tres datos, sin cajas */}
      <div className="grid divide-y divide-p-texto/10 border-y border-p-texto/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <button
          type="button"
          onClick={() => ir("pedidos")}
          className="p-6 text-left transition-colors hover:bg-p-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-p-acento"
        >
          <p className="text-sm text-p-texto/60">
            <E>🛍️</E> Pedidos hoy
          </p>
          <p className="mt-2 font-display text-5xl leading-none">{RESUMEN.pedidosHoy}</p>
        </button>
        <button
          type="button"
          onClick={() => ir("pedidos")}
          className="p-6 text-left transition-colors hover:bg-p-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-p-acento"
        >
          <p className="text-sm text-p-texto/60">
            <E>⏳</E> Pedidos pendientes
          </p>
          <p className="mt-2 font-display text-5xl leading-none">{RESUMEN.pedidosPendientes}</p>
        </button>
        <button
          type="button"
          onClick={() => ir("inventario")}
          className="p-6 text-left transition-colors hover:bg-p-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-p-acento"
        >
          <p className="text-sm text-p-texto/60">
            <E>⚠️</E> Alerta de inventario
          </p>
          <p className="mt-2 font-display text-3xl uppercase leading-none tracking-wide">
            {critico ? critico.nombre : "Todo en orden"}
          </p>
          {critico && (
            <p className="mt-2 text-sm text-p-texto/60">
              Stock bajo · quedan {critico.cantidad} {critico.unidad}
            </p>
          )}
        </button>
      </div>

      <Bloque emoji="📌" titulo="Hoy toca">
        {tareas.length === 0 ? (
          <p className="py-4 text-p-texto/70">
            <E>✨</E> Todo al día. ¡Buen trabajo!
          </p>
        ) : (
          <ul className="divide-y divide-p-texto/10">
            {tareas.map((t) => (
              <li key={t.texto}>
                <button
                  type="button"
                  onClick={() => ir(t.destino)}
                  className="group flex w-full items-center gap-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-acento"
                >
                  <span aria-hidden="true" className="text-2xl">
                    {t.emoji}
                  </span>
                  <span className="flex-1 font-medium">{t.texto}</span>
                  <span
                    aria-hidden="true"
                    className="text-p-texto/40 transition-all group-hover:translate-x-1 group-hover:text-p-texto"
                  >
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Bloque>

      <Bloque
        emoji="🛵"
        titulo="Últimos pedidos"
        accion={<Enlace onClick={() => ir("pedidos")}>Ver todos</Enlace>}
      >
        <ul className="divide-y divide-p-texto/10">
          {PEDIDOS.slice(0, 4).map((p) => (
            <FilaPedido key={p.numero} p={p} />
          ))}
        </ul>
      </Bloque>

      <Bloque
        emoji="📈"
        titulo="Caja de hoy"
        accion={<Enlace onClick={() => ir("caja")}>Ver caja</Enlace>}
      >
        <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-display text-5xl tracking-wide text-p-ok">{cop(ganancia)}</span>
          <span className="text-p-texto/60">de ganancia neta</span>
        </p>
        <div className="mt-5">
          <BarraCaja />
        </div>
        <p className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-p-texto/60">
          <span>
            <E>💵</E> Entró {cop(CAJA.ingresos)}
          </span>
          <span>
            <E>💸</E> Salió {cop(CAJA.egresos)}
          </span>
        </p>
      </Bloque>
    </div>
  );
}

const FILTROS: { id: "todos" | EstadoPedido; emoji: string; etiqueta: string }[] = [
  { id: "todos", emoji: "🛍️", etiqueta: "Todos" },
  { id: "pendiente", emoji: ESTADO_PEDIDO.pendiente.emoji, etiqueta: "Pendientes" },
  { id: "confirmado", emoji: ESTADO_PEDIDO.confirmado.emoji, etiqueta: "Confirmados" },
  { id: "en-camino", emoji: ESTADO_PEDIDO["en-camino"].emoji, etiqueta: "En camino" },
];

function VistaPedidos() {
  const [filtro, setFiltro] = useState<"todos" | EstadoPedido>("todos");
  const visibles =
    filtro === "todos" ? PEDIDOS : PEDIDOS.filter((p) => p.estado === filtro);

  return (
    <div>
      <div role="group" aria-label="Filtrar pedidos por estado" className="flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const cantidad =
            f.id === "todos"
              ? PEDIDOS.length
              : PEDIDOS.filter((p) => p.estado === f.id).length;
          const activo = filtro === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltro(f.id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-acento ${
                activo
                  ? "border-p-acento bg-p-acento text-p-sobre-acento"
                  : "border-p-texto/15 text-p-texto/70 hover:border-p-acento hover:text-p-texto"
              }`}
            >
              <E>{f.emoji}</E> {f.etiqueta} · {cantidad}
            </button>
          );
        })}
      </div>

      {visibles.length === 0 ? (
        <p className="mt-10 text-p-texto/60">
          <E>🫙</E> No hay pedidos con este estado.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-p-texto/10 border-y border-p-texto/10">
          {visibles.map((p) => (
            <FilaPedido key={p.numero} p={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function VistaInventario() {
  const conteo = {
    critico: INVENTARIO.filter((i) => i.nivel === "critico").length,
    bajo: INVENTARIO.filter((i) => i.nivel === "bajo").length,
    bien: INVENTARIO.filter((i) => i.nivel === "bien").length,
  };

  return (
    <div>
      <p className="flex flex-wrap gap-x-8 gap-y-2 text-p-texto/75">
        <span>
          <E>{NIVEL_STOCK.critico.emoji}</E> <strong className="text-p-texto">{conteo.critico}</strong>{" "}
          {conteo.critico === 1 ? "crítico" : "críticos"}
        </span>
        <span>
          <E>{NIVEL_STOCK.bajo.emoji}</E> <strong className="text-p-texto">{conteo.bajo}</strong>{" "}
          {conteo.bajo === 1 ? "bajo" : "bajos"}
        </span>
        <span>
          <E>{NIVEL_STOCK.bien.emoji}</E> <strong className="text-p-texto">{conteo.bien}</strong> bien
        </span>
      </p>
      <ul className="mt-6 divide-y divide-p-texto/10 border-y border-p-texto/10">
        {INVENTARIO.map((i) => (
          <FilaInsumo key={i.nombre} i={i} />
        ))}
      </ul>
      <p className="mt-4 text-sm text-p-texto/50">
        La barra muestra cuánto queda frente a lo ideal.
      </p>
    </div>
  );
}

function VistaCaja() {
  const ganancia = CAJA.ingresos - CAJA.egresos;
  const porCien = Math.round((CAJA.egresos / CAJA.ingresos) * 100);

  return (
    <div>
      <div className="grid gap-10 sm:grid-cols-3">
        <div>
          <p className="text-sm text-p-texto/60">
            <E>💵</E> Ingresos
          </p>
          <p className="mt-3 font-display text-5xl leading-none tracking-wide">{cop(CAJA.ingresos)}</p>
          <p className="mt-2 text-sm text-p-texto/55">Lo que entró hoy</p>
        </div>
        <div>
          <p className="text-sm text-p-texto/60">
            <E>💸</E> Egresos
          </p>
          <p className="mt-3 font-display text-5xl leading-none tracking-wide text-p-peligro">
            {cop(CAJA.egresos)}
          </p>
          <p className="mt-2 text-sm text-p-texto/55">Lo que salió hoy</p>
        </div>
        <div>
          <p className="text-sm text-p-texto/60">
            <E>📈</E> Ganancia neta
          </p>
          <p className="mt-3 font-display text-5xl leading-none tracking-wide text-p-ok">
            {cop(ganancia)}
          </p>
          <p className="mt-2 text-sm text-p-texto/55">Lo que te queda</p>
        </div>
      </div>

      <div className="mt-14 border-t border-p-texto/10 pt-8">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-p-texto/70">
            Ingresos vs egresos
          </p>
          <p className="font-marker text-lg text-p-plata-texto">
            <E>💡</E> de cada $100 que entran, salen ${porCien}
          </p>
        </div>
        <BarraCaja alto="h-3" />
        <p className="mt-3 flex flex-wrap justify-between gap-2 text-sm font-semibold">
          <span className="text-p-ok">Ganancia {100 - porCien}%</span>
          <span className="text-p-peligro">Egresos {porCien}%</span>
        </p>
      </div>
    </div>
  );
}

/* ───────── Cascarón ───────── */

export default function PanelMinimal() {
  const [seccion, setSeccion] = useState<SeccionId>("dashboard");
  const [tema, setTema] = useState<Tema>("claro");
  const [fecha, setFecha] = useState("");
  const [saludo, setSaludo] = useState({ emoji: "👋", texto: "Hola" });
  const tituloRef = useRef<HTMLHeadingElement>(null);

  // Fecha, saludo y tema se resuelven en el navegador para no desalinear el HTML del servidor
  useEffect(() => {
    const ahora = new Date();
    setFecha(
      ahora.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }),
    );
    setSaludo(saludoPorHora(ahora.getHours()));
    try {
      if (localStorage.getItem(LLAVE_TEMA) === "oscuro") setTema("oscuro");
    } catch {
      /* sin almacenamiento: se queda en claro */
    }
  }, []);

  const ir: Ir = (id) => {
    setSeccion(id);
    window.scrollTo({ top: 0 });
    // El foco sigue al contenido nuevo (útil con teclado y lectores de pantalla)
    requestAnimationFrame(() => tituloRef.current?.focus({ preventScroll: true }));
  };

  const alternarTema = () => {
    const nuevo: Tema = tema === "claro" ? "oscuro" : "claro";
    setTema(nuevo);
    try {
      localStorage.setItem(LLAVE_TEMA, nuevo);
    } catch {
      /* el cambio sigue valiendo durante esta visita */
    }
  };

  const encabezado =
    seccion === "dashboard"
      ? {
          emoji: saludo.emoji,
          titulo: saludo.texto,
          sub: `Así va tu día${fecha ? ` · ${fecha}` : ""}`,
        }
      : TITULOS[seccion];

  return (
    <div
      className={`${
        tema === "claro" ? "tema-claro" : "tema-oscuro"
      } min-h-dvh bg-p-fondo text-p-texto`}
    >
      {/* Encabezado */}
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-p-texto/20 bg-black">
            <Image
              src="/elegant-street-logo.png"
              alt="Elegant Street"
              fill
              sizes="36px"
              className="scale-[1.35] object-contain"
            />
          </div>
          <p className="text-sm font-semibold tracking-wide">Panel de Control</p>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-xs font-semibold text-p-ok">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-p-ok-solido opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-p-ok-solido" />
            </span>
            En línea
          </span>
          <button
            type="button"
            onClick={alternarTema}
            aria-label={tema === "claro" ? "Cambiar al tema oscuro" : "Cambiar al tema claro"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-p-texto/15 text-base transition-colors hover:border-p-acento focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-acento"
          >
            <E>{tema === "claro" ? "🌙" : "☀️"}</E>
          </button>
        </div>
      </header>

      {/* Pestañas */}
      <nav
        aria-label="Secciones del panel"
        className="sticky top-0 z-20 border-b border-p-texto/10 bg-p-fondo/90 backdrop-blur"
      >
        <ul className="mx-auto flex max-w-5xl overflow-x-auto px-3 sm:px-7">
          {SECCIONES.map((s) => {
            const activa = s.id === seccion;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => ir(s.id)}
                  aria-current={activa ? "page" : undefined}
                  className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-p-acento ${
                    activa
                      ? "border-p-acento text-p-texto"
                      : "border-transparent text-p-texto/50 hover:text-p-texto"
                  }`}
                >
                  <E>{s.emoji}</E>
                  {s.etiqueta}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-12 sm:px-8">
        <div key={seccion} className="entra">
          <div className="mb-12">
            <h1
              ref={tituloRef}
              tabIndex={-1}
              className="font-display text-4xl uppercase leading-none tracking-wide outline-none sm:text-5xl"
            >
              <E>{encabezado.emoji}</E> {encabezado.titulo}
            </h1>
            <p className="mt-3 text-p-texto/60 first-letter:uppercase">{encabezado.sub}</p>
          </div>

          {seccion === "dashboard" && <VistaDashboard ir={ir} />}
          {seccion === "pedidos" && <VistaPedidos />}
          {seccion === "inventario" && <VistaInventario />}
          {seccion === "caja" && <VistaCaja />}
        </div>

        <footer className="mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-p-texto/10 pt-6 text-xs text-p-texto/45">
          <span>Vista de demostración · todos los datos son ficticios</span>
          <Link
            href="/admin"
            className="font-semibold underline decoration-p-plata decoration-2 underline-offset-4 transition-colors hover:text-p-texto"
          >
            Ver el panel principal →
          </Link>
        </footer>
      </main>
    </div>
  );
}
