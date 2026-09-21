import {
  PRODUCTO_TOP,
  VENTAS_POR_HORA,
  type EstadoPedido,
  type Insumo,
  type Movimiento,
  type NivelStock,
  type Pedido,
} from "@/data/admin";
import { cop } from "@/lib/formato";
import Icono, { type NombreIcono } from "./Iconos";

/* ───────── Colores de semáforo (siempre con texto, nunca solo color) ─────────
   Usan la paleta semántica de globals.css, así funcionan en tema claro y oscuro. */

export type Tono = "plata" | "amarillo" | "verde" | "azul" | "rojo";

const TONOS: Record<Tono, string> = {
  plata: "border-p-plata/60 bg-p-acento/10 text-p-acento",
  amarillo: "border-p-alerta/40 bg-p-alerta/10 text-p-alerta",
  verde: "border-p-ok/40 bg-p-ok/10 text-p-ok",
  azul: "border-p-info/40 bg-p-info/10 text-p-info",
  rojo: "border-p-peligro/40 bg-p-peligro/10 text-p-peligro",
};

export const ESTADO_PEDIDO: Record<EstadoPedido, { etiqueta: string; tono: Tono }> = {
  pendiente: { etiqueta: "Pendiente", tono: "amarillo" },
  confirmado: { etiqueta: "Confirmado", tono: "verde" },
  "en-camino": { etiqueta: "En camino", tono: "azul" },
  entregado: { etiqueta: "Entregado", tono: "plata" },
};

const NIVEL_STOCK: Record<
  NivelStock,
  { etiqueta: string; tono: Tono; barra: string }
> = {
  critico: { etiqueta: "Crítico", tono: "rojo", barra: "bg-p-peligro-solido" },
  bajo: { etiqueta: "Bajo", tono: "amarillo", barra: "bg-p-alerta-solido" },
  bien: { etiqueta: "Bien", tono: "verde", barra: "bg-p-ok-solido" },
};

export function Insignia({ tono, children }: { tono: Tono; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 font-body text-xs font-bold uppercase tracking-wider ${TONOS[tono]}`}
    >
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />
      {children}
    </span>
  );
}

/* ───────── Contenedor de sección ───────── */

export function Panel({
  titulo,
  nota,
  accion,
  children,
}: {
  titulo: string;
  nota?: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-p-texto/10 bg-p-panel">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-p-texto/10 px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-wide sm:text-3xl">
            {titulo}
          </h2>
          {nota && <p className="mt-0.5 font-body text-sm text-p-texto/60">{nota}</p>}
        </div>
        {accion}
      </header>
      {children}
    </section>
  );
}

/* ───────── Tarjeta de resumen ───────── */

export function TarjetaResumen({
  icono,
  tono,
  etiqueta,
  valor,
  nota,
  valorPequeno = false,
}: {
  icono: NombreIcono;
  tono: Tono;
  etiqueta: string;
  valor: string;
  nota: string;
  valorPequeno?: boolean;
}) {
  return (
    <article className="relative flex flex-col gap-4 overflow-hidden border border-t-4 border-p-texto/10 border-t-p-plata bg-p-panel p-5 sm:p-6 [.tema-oscuro_&]:border-t [.tema-oscuro_&]:border-t-p-texto/10">
      <div className="flex items-start justify-between gap-3">
        <p className="font-body text-xs font-bold uppercase tracking-[0.25em] text-p-texto/60">
          {etiqueta}
        </p>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center border ${TONOS[tono]}`}
        >
          <Icono nombre={icono} />
        </span>
      </div>
      <p
        className={`font-display uppercase leading-none tracking-wide ${
          valorPequeno ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"
        }`}
      >
        {valor}
      </p>
      <p className="font-body text-sm text-p-texto/60">{nota}</p>
    </article>
  );
}

/* ───────── Gráfica de ventas por hora ───────── */

const corto = (valor: number) => `$${Math.round(valor / 1000)}k`;

export function GraficaVentas() {
  const maximo = Math.max(...VENTAS_POR_HORA.map((v) => v.valor));
  const pico = VENTAS_POR_HORA.find((v) => v.valor === maximo) ?? VENTAS_POR_HORA[0];
  // Un poco de aire arriba para que la barra más alta no toque el borde
  const escala = maximo * 1.18;

  return (
    <Panel
      titulo={`Ventas por hora — pico a las ${pico.hora}`}
      nota="Cuánto se vendió en cada hora, de 11am a 10pm"
    >
      <div className="p-5 sm:p-6">
        <div
          role="img"
          aria-label={`Ventas por hora: ${VENTAS_POR_HORA.map((v) => `${v.hora} ${cop(v.valor)}`).join(", ")}. El pico fue a las ${pico.hora}.`}
        >
          <div className="relative" aria-hidden="true">
            {/* Líneas guía */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-56">
              <div className="absolute inset-x-0 top-[25%] border-t border-dashed border-p-texto/10" />
              <div className="absolute inset-x-0 top-[50%] border-t border-dashed border-p-texto/10" />
              <div className="absolute inset-x-0 top-[75%] border-t border-dashed border-p-texto/10" />
            </div>

            <div className="relative grid h-56 grid-cols-12 items-end gap-1.5 border-b border-p-texto/25 sm:gap-3">
              {VENTAS_POR_HORA.map((v) => {
                const esPico = v.valor === maximo;
                const alto = (v.valor / escala) * 100;
                return (
                  <div
                    key={v.hora}
                    title={`${v.horaLarga}: ${cop(v.valor)}`}
                    className="group flex h-full flex-col justify-end"
                  >
                    <span
                      className={`mb-1 text-center font-body text-[0.6rem] font-bold tabular-nums sm:text-xs ${
                        esPico
                          ? "block text-p-texto"
                          : "hidden text-p-texto/60 group-hover:text-p-texto sm:block"
                      }`}
                    >
                      {corto(v.valor)}
                    </span>
                    <div
                      className={`w-full transition-colors duration-300 ${
                        esPico
                          ? "bg-p-texto"
                          : "bg-p-plata group-hover:bg-p-texto/70"
                      }`}
                      style={{ height: `${alto}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-2 grid grid-cols-12 gap-1.5 sm:gap-3">
              {VENTAS_POR_HORA.map((v) => (
                <span
                  key={v.hora}
                  className={`text-center font-body text-[0.6rem] sm:text-xs ${
                    v.valor === maximo
                      ? "font-bold text-p-texto"
                      : "font-semibold text-p-texto/55"
                  }`}
                >
                  {v.hora}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/** Dos datos rápidos debajo de la gráfica: producto estrella y hora pico */
export function TarjetasPico() {
  const maximo = Math.max(...VENTAS_POR_HORA.map((v) => v.valor));
  const pico = VENTAS_POR_HORA.find((v) => v.valor === maximo) ?? VENTAS_POR_HORA[0];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <article className="flex items-center gap-4 border border-p-texto/10 bg-p-panel p-4 sm:p-5">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center border ${TONOS.plata}`}
        >
          <Icono nombre="bolsa" />
        </span>
        <div className="min-w-0">
          <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-p-texto/60">
            Producto más vendido hoy
          </p>
          <p className="mt-1 font-display text-2xl uppercase leading-none tracking-wide sm:text-3xl">
            {PRODUCTO_TOP.nombre}
          </p>
          <p className="mt-1 font-body text-sm text-p-texto/60">
            {PRODUCTO_TOP.unidades} unidades
          </p>
        </div>
      </article>

      <article className="flex items-center gap-4 border border-p-texto/10 bg-p-panel p-4 sm:p-5">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center border ${TONOS.plata}`}
        >
          <Icono nombre="reloj" />
        </span>
        <div className="min-w-0">
          <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-p-texto/60">
            Hora pico
          </p>
          <p className="mt-1 font-display text-2xl uppercase leading-none tracking-wide sm:text-3xl">
            {pico.horaLarga}
          </p>
          <p className="mt-1 font-body text-sm text-p-texto/60">{cop(pico.valor)}</p>
        </div>
      </article>
    </div>
  );
}

/* ───────── Pedidos activos (tabla en pantallas grandes, tarjetas en móvil) ───────── */

export function TablaPedidos({
  pedidos,
  onSeleccionar,
}: {
  pedidos: Pedido[];
  /** Si se pasa, cada fila es clickeable y abre el detalle del pedido */
  onSeleccionar?: (pedido: Pedido) => void;
}) {
  if (pedidos.length === 0) {
    return (
      <p className="px-6 py-12 text-center font-body text-p-texto/55">
        No hay pedidos con este estado.
      </p>
    );
  }

  return (
    <>
      <table className="hidden w-full text-left md:table">
        <caption className="sr-only">Lista de pedidos activos</caption>
        <thead>
          <tr className="border-b border-p-texto/10 font-body text-xs uppercase tracking-[0.2em] text-p-texto/55">
            <th scope="col" className="px-6 py-3 font-bold">N.º</th>
            <th scope="col" className="px-3 py-3 font-bold">Cliente</th>
            <th scope="col" className="px-3 py-3 font-bold">Productos</th>
            <th scope="col" className="px-3 py-3 text-right font-bold">Total</th>
            <th scope="col" className="px-6 py-3 font-bold">Estado</th>
            {onSeleccionar && (
              <th scope="col" className="w-10 pr-6">
                <span className="sr-only">Ver detalle</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-p-texto/10">
          {pedidos.map((p) => {
            const e = ESTADO_PEDIDO[p.estado];
            return (
              <tr
                key={p.numero}
                onClick={onSeleccionar ? () => onSeleccionar(p) : undefined}
                className={`group transition-colors hover:bg-p-hover ${
                  onSeleccionar ? "cursor-pointer" : ""
                }`}
              >
                <td className="px-6 py-4 font-display text-xl tracking-wide text-p-plata-texto">
                  {onSeleccionar ? (
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onSeleccionar(p);
                      }}
                      aria-label={`Ver detalle del pedido ${p.numero}`}
                      className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-p-acento"
                    >
                      {p.numero}
                    </button>
                  ) : (
                    p.numero
                  )}
                </td>
                <td className="px-3 py-4 font-body font-bold">{p.cliente}</td>
                <td className="px-3 py-4 font-body text-p-texto/75">{p.productos}</td>
                <td className="px-3 py-4 text-right font-display text-xl tracking-wide tabular-nums">
                  {cop(p.total)}
                </td>
                <td className="px-6 py-4">
                  <Insignia tono={e.tono}>{e.etiqueta}</Insignia>
                </td>
                {onSeleccionar && (
                  <td className="pr-6 text-p-texto/35 transition-all group-hover:translate-x-1 group-hover:text-p-texto">
                    <Icono nombre="flecha" className="h-4 w-4" />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-p-texto/10 md:hidden">
        {pedidos.map((p) => {
          const e = ESTADO_PEDIDO[p.estado];
          const contenido = (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-xl tracking-wide text-p-plata-texto">
                  {p.numero} · <span className="text-p-texto">{p.cliente}</span>
                </span>
                <Insignia tono={e.tono}>{e.etiqueta}</Insignia>
              </div>
              <p className="font-body text-sm text-p-texto/70">{p.productos}</p>
              <p className="font-display text-2xl tracking-wide tabular-nums">
                {cop(p.total)}
              </p>
            </>
          );
          return onSeleccionar ? (
            <li key={p.numero}>
              <button
                type="button"
                onClick={() => onSeleccionar(p)}
                aria-label={`Ver detalle del pedido ${p.numero}`}
                className="block w-full space-y-2 px-5 py-4 text-left transition-colors hover:bg-p-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-p-acento"
              >
                {contenido}
              </button>
            </li>
          ) : (
            <li key={p.numero} className="space-y-2 px-5 py-4">
              {contenido}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ───────── Pedidos procesados (solo lectura) ───────── */

export function TablaProcesados({ pedidos }: { pedidos: Pedido[] }) {
  if (pedidos.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <p className="font-display text-3xl uppercase text-p-texto/40">Aún no hay entregas</p>
        <p className="mt-2 font-body text-p-texto/55">
          Cuando marques un pedido como entregado, aparecerá aquí con su hora.
        </p>
      </div>
    );
  }

  return (
    <>
      <table className="hidden w-full text-left md:table">
        <caption className="sr-only">Pedidos entregados hoy</caption>
        <thead>
          <tr className="border-b border-p-texto/10 font-body text-xs uppercase tracking-[0.2em] text-p-texto/55">
            <th scope="col" className="px-6 py-3 font-bold">N.º</th>
            <th scope="col" className="px-3 py-3 font-bold">Cliente</th>
            <th scope="col" className="px-3 py-3 font-bold">Productos</th>
            <th scope="col" className="px-3 py-3 text-right font-bold">Total</th>
            <th scope="col" className="px-6 py-3 font-bold">Hora de entrega</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-p-texto/10">
          {pedidos.map((p) => (
            <tr key={p.numero} className="transition-colors hover:bg-p-hover">
              <td className="px-6 py-4 font-display text-xl tracking-wide text-p-plata-texto">
                {p.numero}
              </td>
              <td className="px-3 py-4 font-body font-bold">{p.cliente}</td>
              <td className="px-3 py-4 font-body text-p-texto/75">{p.productos}</td>
              <td className="px-3 py-4 text-right font-display text-xl tracking-wide tabular-nums">
                {cop(p.total)}
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-2 font-body text-sm font-bold text-p-ok">
                  <Icono nombre="check" className="h-4 w-4" />
                  {p.horaEntrega}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-p-texto/10 md:hidden">
        {pedidos.map((p) => (
          <li key={p.numero} className="space-y-2 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-xl tracking-wide text-p-plata-texto">
                {p.numero} · <span className="text-p-texto">{p.cliente}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-body text-sm font-bold text-p-ok">
                <Icono nombre="check" className="h-4 w-4" />
                {p.horaEntrega}
              </span>
            </div>
            <p className="font-body text-sm text-p-texto/70">{p.productos}</p>
            <p className="font-display text-2xl tracking-wide tabular-nums">{cop(p.total)}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ───────── Tabla de inventario con semáforo ───────── */

function BarraNivel({ insumo }: { insumo: Insumo }) {
  const pct = Math.min(100, Math.round((insumo.cantidad / insumo.ideal) * 100));
  return (
    <div
      role="img"
      aria-label={`${pct}% del nivel ideal`}
      className="h-2.5 w-full min-w-24 bg-p-texto/10"
    >
      <div
        className={`h-full transition-all duration-700 ${NIVEL_STOCK[insumo.nivel].barra}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function TablaInventario({
  insumos,
  compacta = false,
  resaltado,
}: {
  insumos: Insumo[];
  /** En columnas angostas se usa siempre la lista apilada, nunca la tabla */
  compacta?: boolean;
  /** Nombre del insumo recién actualizado: su fila se ilumina un momento */
  resaltado?: string | null;
}) {
  const fondoFila = (nombre: string) =>
    resaltado === nombre ? "bg-p-ok/15" : "";

  return (
    <>
      <table
        className={`${compacta ? "hidden" : "hidden md:table"} w-full text-left`}
      >
        <caption className="sr-only">Insumos disponibles en cocina</caption>
        <thead>
          <tr className="border-b border-p-texto/10 font-body text-xs uppercase tracking-[0.2em] text-p-texto/55">
            <th scope="col" className="px-6 py-3 font-bold">Insumo</th>
            <th scope="col" className="px-3 py-3 font-bold">Disponible</th>
            <th scope="col" className="w-1/4 px-3 py-3 font-bold">Nivel</th>
            <th scope="col" className="px-6 py-3 font-bold">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-p-texto/10">
          {insumos.map((i) => {
            const n = NIVEL_STOCK[i.nivel];
            return (
              <tr
                key={i.nombre}
                className={`transition-colors duration-700 hover:bg-p-hover ${fondoFila(i.nombre)}`}
              >
                <td className="px-6 py-4 font-body font-bold">{i.nombre}</td>
                <td className="px-3 py-4 font-body text-p-texto/80">
                  <span className="font-display text-xl tracking-wide text-p-texto">
                    {i.cantidad}
                  </span>{" "}
                  {i.unidad}
                </td>
                <td className="px-3 py-4">
                  <BarraNivel insumo={i} />
                </td>
                <td className="px-6 py-4">
                  <Insignia tono={n.tono}>{n.etiqueta}</Insignia>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className={`divide-y divide-p-texto/10 ${compacta ? "" : "md:hidden"}`}>
        {insumos.map((i) => {
          const n = NIVEL_STOCK[i.nivel];
          return (
            <li
              key={i.nombre}
              className={`space-y-3 px-5 py-4 transition-colors duration-700 ${fondoFila(i.nombre)}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-body font-bold">{i.nombre}</span>
                <Insignia tono={n.tono}>{n.etiqueta}</Insignia>
              </div>
              <BarraNivel insumo={i} />
              <p className="font-body text-sm text-p-texto/70">
                <span className="font-display text-xl tracking-wide text-p-texto">
                  {i.cantidad}
                </span>{" "}
                {i.unidad}
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ───────── Resumen de caja ───────── */

export function ResumenCaja({ ingresos, egresos }: { ingresos: number; egresos: number }) {
  const ganancia = ingresos - egresos;
  const pctEgresos = ingresos > 0 ? Math.min(100, (egresos / ingresos) * 100) : 0;
  const pctGanancia = 100 - pctEgresos;
  const porCien = Math.round(pctEgresos);

  return (
    <div className="p-5 sm:p-6">
      <dl className="grid gap-px overflow-hidden border border-p-texto/10 bg-p-texto/10 sm:grid-cols-3">
        <div className="bg-p-panel p-5 sm:p-6">
          <dt className="font-body text-xs font-bold uppercase tracking-[0.25em] text-p-texto/60">
            Ingresos
          </dt>
          <dd className="mt-3 font-display text-4xl leading-none tracking-wide text-p-texto sm:text-5xl">
            {cop(ingresos)}
          </dd>
          <p className="mt-2 font-body text-sm text-p-texto/55">Lo que entró hoy</p>
        </div>
        <div className="bg-p-panel p-5 sm:p-6">
          <dt className="font-body text-xs font-bold uppercase tracking-[0.25em] text-p-texto/60">
            Egresos
          </dt>
          <dd className="mt-3 font-display text-4xl leading-none tracking-wide text-p-peligro sm:text-5xl">
            {cop(egresos)}
          </dd>
          <p className="mt-2 font-body text-sm text-p-texto/55">Lo que salió hoy</p>
        </div>
        <div className="bg-p-panel p-5 sm:p-6">
          <dt className="font-body text-xs font-bold uppercase tracking-[0.25em] text-p-texto/60">
            Ganancia neta
          </dt>
          <dd className="mt-3 font-display text-4xl leading-none tracking-wide text-p-ok sm:text-5xl">
            {cop(ganancia)}
          </dd>
          <p className="mt-2 font-body text-sm text-p-texto/55">Lo que te queda</p>
        </div>
      </dl>

      {/* Barra: el 100% son los ingresos; lo rojo es lo que salió */}
      <div className="mt-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-body text-sm font-bold uppercase tracking-[0.2em] text-p-texto/70">
            Ingresos vs egresos
          </p>
          <p className="font-marker text-lg text-p-plata-texto">
            de cada $100 que entran, salen ${porCien}
          </p>
        </div>

        <div
          role="img"
          aria-label={`De los ingresos, ${Math.round(pctGanancia)}% es ganancia y ${porCien}% son egresos`}
          className="flex h-8 overflow-hidden border border-p-texto/15 bg-p-hover"
        >
          <div className="bg-p-ok-solido" style={{ width: `${pctGanancia}%` }} />
          <div className="bg-p-peligro-solido" style={{ width: `${pctEgresos}%` }} />
        </div>

        <div className="mt-3 flex flex-wrap justify-between gap-2 font-body text-sm font-semibold">
          <span className="flex items-center gap-2 text-p-ok">
            <span aria-hidden="true" className="h-3 w-3 bg-p-ok-solido" />
            Ganancia {Math.round(pctGanancia)}%
          </span>
          <span className="flex items-center gap-2 text-p-peligro">
            <span aria-hidden="true" className="h-3 w-3 bg-p-peligro-solido" />
            Egresos {porCien}%
          </span>
        </div>
      </div>
    </div>
  );
}

/* ───────── Movimientos de caja del día ───────── */

export function TablaMovimientos({
  movimientos,
  resaltado,
}: {
  movimientos: Movimiento[];
  /** Id del movimiento recién agregado: su fila se ilumina un momento */
  resaltado?: string | null;
}) {
  const fondoFila = (m: Movimiento) => {
    const nuevo = m.id !== undefined && m.id === resaltado;
    if (m.tipo === "ingreso") return nuevo ? "bg-p-ok/20" : "bg-p-ok/5";
    return nuevo ? "bg-p-peligro/20" : "bg-p-peligro/5";
  };
  const signo = (tipo: "ingreso" | "egreso") => (tipo === "ingreso" ? "+" : "−");
  const colorMonto = (tipo: "ingreso" | "egreso") =>
    tipo === "ingreso" ? "text-p-ok" : "text-p-peligro";

  return (
    <>
      <table className="hidden w-full text-left md:table">
        <caption className="sr-only">Movimientos de caja del día</caption>
        <thead>
          <tr className="border-b border-p-texto/10 font-body text-xs uppercase tracking-[0.2em] text-p-texto/55">
            <th scope="col" className="px-6 py-3 font-bold">Hora</th>
            <th scope="col" className="px-3 py-3 font-bold">Descripción</th>
            <th scope="col" className="px-3 py-3 font-bold">Tipo</th>
            <th scope="col" className="px-6 py-3 text-right font-bold">Monto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-p-texto/10">
          {movimientos.map((m, i) => (
            <tr
              key={m.id ?? `${i}-${m.hora}-${m.descripcion}`}
              className={`transition-colors duration-700 hover:bg-p-hover ${fondoFila(m)}`}
            >
              <td className="whitespace-nowrap px-6 py-4 font-display text-xl tracking-wide tabular-nums text-p-plata-texto">
                {m.hora}
              </td>
              <td className="px-3 py-4 font-body font-bold">{m.descripcion}</td>
              <td className="px-3 py-4">
                <Insignia tono={m.tipo === "ingreso" ? "verde" : "rojo"}>
                  {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                </Insignia>
              </td>
              <td
                className={`whitespace-nowrap px-6 py-4 text-right font-display text-xl tracking-wide tabular-nums ${colorMonto(m.tipo)}`}
              >
                {signo(m.tipo)} {cop(m.monto)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-p-texto/10 md:hidden">
        {movimientos.map((m, i) => (
          <li
            key={m.id ?? `${i}-${m.hora}-${m.descripcion}`}
            className={`space-y-2 px-5 py-4 transition-colors duration-700 ${fondoFila(m)}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-xl tracking-wide tabular-nums text-p-plata-texto">
                {m.hora}
              </span>
              <Insignia tono={m.tipo === "ingreso" ? "verde" : "rojo"}>
                {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
              </Insignia>
            </div>
            <p className="font-body font-bold">{m.descripcion}</p>
            <p className={`font-display text-2xl tracking-wide tabular-nums ${colorMonto(m.tipo)}`}>
              {signo(m.tipo)} {cop(m.monto)}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
