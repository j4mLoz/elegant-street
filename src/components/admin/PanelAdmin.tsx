"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  INVENTARIO,
  PEDIDOS,
  nivelDe,
  type EstadoPedido,
  type Insumo,
  type Movimiento,
  type Pedido,
} from "@/data/admin";
import {
  egresoDeEntrada,
  idMovimientoDePedido,
  ingresosDePedidos,
  movimientosDeCaja,
  totalesDeCaja,
} from "@/lib/caja";
import { cop } from "@/lib/formato";
import {
  CLAVE_PEDIDOS,
  ESTADO_A_GUARDADO,
  actualizarPedidoGuardado,
  hmA12,
  horaHM,
  leerPedidosAdmin,
  limpiarPedidosGuardados,
  minutosDelDia,
} from "@/lib/pedidosDemo";
import DetallePedido from "./DetallePedido";
import Icono, { type NombreIcono } from "./Iconos";
import ModalEntrada from "./ModalEntrada";
import {
  GraficaVentas,
  Panel,
  ResumenCaja,
  TablaInventario,
  TablaMovimientos,
  TablaPedidos,
  TablaProcesados,
  TarjetaResumen,
  TarjetasPico,
} from "./Piezas";

type SeccionId = "dashboard" | "pedidos" | "inventario" | "caja";
type TabPedidos = "activos" | "procesados";
type Tema = "claro" | "oscuro";

type Aviso = {
  texto: string;
  detalle?: string;
  accion?: { etiqueta: string; alHacerClic: () => void };
};

type TotalesCaja = { ingresos: number; egresos: number };

/** "-v2": ignora preferencias guardadas durante las pruebas y arranca siempre en negro */
const LLAVE_TEMA = "elegant-street-admin-tema-v2";

/** Cada botón de estado empuja el pedido un paso adelante */
const SIGUIENTE: Partial<Record<EstadoPedido, EstadoPedido>> = {
  pendiente: "confirmado",
  confirmado: "en-camino",
  "en-camino": "entregado",
};

const SECCIONES: {
  id: SeccionId;
  etiqueta: string;
  icono: NombreIcono;
  titulo: string;
  subtitulo: string;
}[] = [
  {
    id: "dashboard",
    etiqueta: "Dashboard",
    icono: "dashboard",
    titulo: "Así va tu negocio hoy",
    subtitulo: "Lo más importante, de un vistazo.",
  },
  {
    id: "pedidos",
    etiqueta: "Pedidos",
    icono: "pedidos",
    titulo: "Pedidos de hoy",
    subtitulo: "Toca un pedido para ver su detalle y cambiar su estado.",
  },
  {
    id: "inventario",
    etiqueta: "Inventario",
    icono: "inventario",
    titulo: "Lo que hay en cocina",
    subtitulo: "Rojo: pide hoy. Amarillo: pide pronto. Verde: todo bien.",
  },
  {
    id: "caja",
    etiqueta: "Caja",
    icono: "caja",
    titulo: "Cuánto entró y cuánto salió",
    subtitulo: "El resumen de plata del día y cada movimiento.",
  },
];

type Ir = (id: SeccionId) => void;

/* ───────── Vistas ───────── */

function BotonVer({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-2 font-body text-xs font-bold uppercase tracking-[0.2em] text-p-acento transition-colors hover:text-p-plata-texto focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-p-acento"
    >
      {children}
      <Icono nombre="flecha" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

function VistaDashboard({
  ir,
  pedidos,
  insumos,
  caja,
  onSeleccionar,
}: {
  ir: Ir;
  pedidos: Pedido[];
  insumos: Insumo[];
  caja: TotalesCaja;
  onSeleccionar: (p: Pedido) => void;
}) {
  const critico = insumos.find((i) => i.nivel === "critico");
  const bajos = insumos.filter((i) => i.nivel === "bajo");
  const alertas = insumos.filter((i) => i.nivel !== "bien");
  const activos = pedidos.filter((p) => p.estado !== "entregado");
  const pendientes = pedidos.filter((p) => p.estado === "pendiente").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaResumen
          icono="dinero"
          tono="plata"
          etiqueta="Ventas del día"
          valor={cop(caja.ingresos)}
          nota="Lo vendido hasta ahora"
        />
        <TarjetaResumen
          icono="bolsa"
          tono="plata"
          etiqueta="Pedidos hoy"
          valor={String(pedidos.length)}
          nota="Pedidos recibidos hoy"
        />
        <TarjetaResumen
          icono="reloj"
          tono="amarillo"
          etiqueta="Pedidos pendientes"
          valor={String(pendientes)}
          nota="Esperan tu confirmación"
        />
        <TarjetaResumen
          icono="alerta"
          tono={critico ? "rojo" : bajos.length > 0 ? "amarillo" : "verde"}
          etiqueta="Alerta de inventario"
          valor={
            critico
              ? critico.nombre
              : bajos.length > 0
                ? `${bajos.length} ${bajos.length === 1 ? "insumo bajo" : "insumos bajos"}`
                : "Todo en orden"
          }
          valorPequeno
          nota={
            critico
              ? `Stock bajo · quedan ${critico.cantidad} ${critico.unidad}`
              : bajos.length > 0
                ? "Conviene pedirlos pronto"
                : "Ningún insumo en riesgo"
          }
        />
      </div>

      <GraficaVentas />
      <TarjetasPico />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <Panel
            titulo="Pedidos recientes"
            nota="Toca uno para ver su detalle"
            accion={<BotonVer onClick={() => ir("pedidos")}>Ver todos</BotonVer>}
          >
            <TablaPedidos pedidos={activos.slice(0, 4)} onSeleccionar={onSeleccionar} />
          </Panel>
        </div>
        <div className="xl:col-span-2">
          <Panel
            titulo="Inventario rápido"
            nota="Lo que necesita atención"
            accion={<BotonVer onClick={() => ir("inventario")}>Ver todo</BotonVer>}
          >
            {alertas.length === 0 ? (
              <p className="px-6 py-10 text-center font-body text-p-texto/60">
                Todo el inventario está bien.
              </p>
            ) : (
              <TablaInventario insumos={alertas} compacta />
            )}
          </Panel>
        </div>
      </div>

      <Panel
        titulo="Resumen de caja del día"
        accion={<BotonVer onClick={() => ir("caja")}>Ver caja</BotonVer>}
      >
        <ResumenCaja ingresos={caja.ingresos} egresos={caja.egresos} />
      </Panel>
    </div>
  );
}

const FILTROS: { id: "todos" | Exclude<EstadoPedido, "entregado">; etiqueta: string }[] = [
  { id: "todos", etiqueta: "Todos" },
  { id: "pendiente", etiqueta: "Pendientes" },
  { id: "confirmado", etiqueta: "Confirmados" },
  { id: "en-camino", etiqueta: "En camino" },
];

function VistaPedidos({
  pedidos,
  tab,
  onTab,
  onSeleccionar,
}: {
  pedidos: Pedido[];
  tab: TabPedidos;
  onTab: (t: TabPedidos) => void;
  onSeleccionar: (p: Pedido) => void;
}) {
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["id"]>("todos");
  const activos = pedidos.filter((p) => p.estado !== "entregado");
  // El último entregado va primero, sea un pedido real o ficticio
  const procesados = pedidos
    .filter((p) => p.estado === "entregado")
    .sort((a, b) => minutosDelDia(b.horaEntrega) - minutosDelDia(a.horaEntrega));
  const visibles = filtro === "todos" ? activos : activos.filter((p) => p.estado === filtro);

  const TABS: { id: TabPedidos; etiqueta: string; cantidad: number }[] = [
    { id: "activos", etiqueta: "Activos", cantidad: activos.length },
    { id: "procesados", etiqueta: "Procesados", cantidad: procesados.length },
  ];

  const alTeclear = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const nuevo: TabPedidos = tab === "activos" ? "procesados" : "activos";
    onTab(nuevo);
    requestAnimationFrame(() => document.getElementById(`tab-${nuevo}`)?.focus());
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Tipo de pedidos"
        onKeyDown={alTeclear}
        className="mb-6 grid grid-cols-2 border border-p-texto/20 sm:inline-grid sm:min-w-[26rem]"
      >
        {TABS.map((t) => {
          const activa = t.id === tab;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={activa}
              aria-controls={`panel-${t.id}`}
              tabIndex={activa ? 0 : -1}
              onClick={() => onTab(t.id)}
              className={`flex items-center justify-center gap-3 px-6 py-3.5 font-display text-xl uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-p-acento ${
                activa
                  ? "bg-p-acento text-p-sobre-acento"
                  : "text-p-texto/60 hover:bg-p-hover hover:text-p-texto"
              }`}
            >
              {t.etiqueta}
              <span
                className={`flex h-6 min-w-6 items-center justify-center px-1.5 font-body text-xs font-bold tabular-nums ${
                  activa ? "bg-p-sobre-acento text-p-acento" : "bg-p-texto/10 text-p-texto/70"
                }`}
              >
                {t.cantidad}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "activos" ? (
        <div id="panel-activos" role="tabpanel" aria-labelledby="tab-activos">
          <Panel
            titulo="Pedidos activos"
            nota="Pendientes, confirmados y en camino. Toca uno para ver su detalle"
            accion={
              <div
                role="group"
                aria-label="Filtrar pedidos por estado"
                className="flex flex-wrap gap-2"
              >
                {FILTROS.map((f) => {
                  const cantidad =
                    f.id === "todos"
                      ? activos.length
                      : activos.filter((p) => p.estado === f.id).length;
                  const activo = filtro === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => setFiltro(f.id)}
                      className={`border px-3 py-1.5 font-body text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-acento ${
                        activo
                          ? "border-p-acento bg-p-acento text-p-sobre-acento"
                          : "border-p-texto/20 text-p-texto/70 hover:border-p-acento hover:text-p-texto"
                      }`}
                    >
                      {f.etiqueta} · {cantidad}
                    </button>
                  );
                })}
              </div>
            }
          >
            <TablaPedidos pedidos={visibles} onSeleccionar={onSeleccionar} />
          </Panel>
        </div>
      ) : (
        <div id="panel-procesados" role="tabpanel" aria-labelledby="tab-procesados">
          <Panel
            titulo="Pedidos procesados"
            nota="Los que ya se entregaron hoy, con su hora de entrega"
          >
            <TablaProcesados pedidos={procesados} />
          </Panel>
        </div>
      )}
    </div>
  );
}

function VistaInventario({
  insumos,
  resaltado,
  onRegistrar,
}: {
  insumos: Insumo[];
  resaltado: string | null;
  onRegistrar: () => void;
}) {
  const conteo = {
    critico: insumos.filter((i) => i.nivel === "critico").length,
    bajo: insumos.filter((i) => i.nivel === "bajo").length,
    bien: insumos.filter((i) => i.nivel === "bien").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRegistrar}
          className="inline-flex items-center gap-3 bg-p-acento px-6 py-3 font-display text-lg uppercase tracking-widest text-p-sobre-acento shadow-[4px_4px_0_0_var(--p-sombra)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--p-sombra)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-p-acento"
        >
          <Icono nombre="mas" className="h-5 w-5" />
          Registrar entrada
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-p-peligro/30 bg-p-peligro/5 p-5">
          <p className="font-body text-xs font-bold uppercase tracking-[0.25em] text-p-peligro">
            Críticos
          </p>
          <p className="mt-2 font-display text-5xl leading-none text-p-peligro">{conteo.critico}</p>
          <p className="mt-2 font-body text-sm text-p-texto/60">Pídelos hoy</p>
        </div>
        <div className="border border-p-alerta/30 bg-p-alerta/5 p-5">
          <p className="font-body text-xs font-bold uppercase tracking-[0.25em] text-p-alerta">
            Bajos
          </p>
          <p className="mt-2 font-display text-5xl leading-none text-p-alerta">{conteo.bajo}</p>
          <p className="mt-2 font-body text-sm text-p-texto/60">Pídelos pronto</p>
        </div>
        <div className="border border-p-ok/30 bg-p-ok/5 p-5">
          <p className="font-body text-xs font-bold uppercase tracking-[0.25em] text-p-ok">
            Bien
          </p>
          <p className="mt-2 font-display text-5xl leading-none text-p-ok">{conteo.bien}</p>
          <p className="mt-2 font-body text-sm text-p-texto/60">Sin problema</p>
        </div>
      </div>

      <Panel titulo="Inventario rápido" nota="La barra muestra cuánto queda frente a lo ideal">
        <TablaInventario insumos={insumos} resaltado={resaltado} />
      </Panel>
    </div>
  );
}

function VistaCaja({
  caja,
  movimientos,
  resaltado,
}: {
  caja: TotalesCaja;
  movimientos: Movimiento[];
  resaltado: string | null;
}) {
  return (
    <div className="space-y-6">
      <Panel titulo="Resumen de caja del día" nota={`Ventas registradas: ${cop(caja.ingresos)}`}>
        <ResumenCaja ingresos={caja.ingresos} egresos={caja.egresos} />
      </Panel>
      <Panel
        titulo="Movimientos del día"
        nota="Los pedidos confirmados y las compras de insumos se suman aquí solos"
      >
        <TablaMovimientos movimientos={movimientos} resaltado={resaltado} />
      </Panel>
    </div>
  );
}

/* ───────── Cascarón del panel ───────── */

export default function PanelAdmin() {
  const [seccion, setSeccion] = useState<SeccionId>("dashboard");
  const [tema, setTema] = useState<Tema>("oscuro");
  const [fecha, setFecha] = useState("");
  const tituloRef = useRef<HTMLHeadingElement>(null);

  // Los pedidos ficticios viven en memoria; los reales (de la landing) viven en localStorage
  const [ficticios, setFicticios] = useState<Pedido[]>(PEDIDOS);
  const [reales, setReales] = useState<Pedido[]>([]);
  const pedidos = useMemo(() => [...reales, ...ficticios], [reales, ficticios]);

  const [insumos, setInsumos] = useState<Insumo[]>(INVENTARIO);
  const [tabPedidos, setTabPedidos] = useState<TabPedidos>("activos");
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [resaltado, setResaltado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // Caja: a los movimientos ficticios se suman los pedidos reales confirmados (ingresos, calculados
  // desde los pedidos) y las compras de insumos (egresos, guardados aquí). Los totales se recalculan.
  const [egresosDemo, setEgresosDemo] = useState<Movimiento[]>([]);
  const [movResaltado, setMovResaltado] = useState<string | null>(null);
  const movimientosNuevos = useMemo(
    () => [...ingresosDePedidos(pedidos), ...egresosDemo],
    [pedidos, egresosDemo],
  );
  const movimientos = useMemo(() => movimientosDeCaja(movimientosNuevos), [movimientosNuevos]);
  const caja = useMemo(() => totalesDeCaja(movimientosNuevos), [movimientosNuevos]);

  // Ids de pedidos reales ya vistos: sirven para avisar solo cuando llega uno nuevo
  const idsVistos = useRef<Set<number> | null>(null);

  // La fecha y el tema guardado se leen en el navegador para no desalinear el HTML del servidor
  useEffect(() => {
    setFecha(
      new Date().toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
    try {
      if (localStorage.getItem(LLAVE_TEMA) === "claro") setTema("claro");
    } catch {
      /* sin almacenamiento: se queda en negro */
    }
  }, []);

  // Pedidos reales: se leen al cargar y se mantienen al día si llegan desde otra pestaña
  useEffect(() => {
    const cargar = (avisarSiHayNuevo: boolean) => {
      const lista = leerPedidosAdmin();
      const vistos = idsVistos.current;
      if (avisarSiHayNuevo && vistos) {
        // La lista viene del más reciente al más antiguo
        const nuevo = lista.find((p) => p.id !== undefined && !vistos.has(p.id));
        if (nuevo) {
          setAviso({
            texto: `Llegó un pedido nuevo: ${nuevo.numero}`,
            detalle: `${nuevo.cliente} · ${cop(nuevo.total)}`,
            accion: {
              etiqueta: "Ver pedidos",
              alHacerClic: () => {
                setSeccion("pedidos");
                setTabPedidos("activos");
                setAviso(null);
                window.scrollTo({ top: 0 });
              },
            },
          });
        }
      }
      idsVistos.current = new Set(
        lista.flatMap((p) => (p.id !== undefined ? [p.id] : [])),
      );
      setReales(lista);
    };

    cargar(false);
    const alCambiarAlmacenamiento = (e: StorageEvent) => {
      if (e.key === null || e.key === CLAVE_PEDIDOS) cargar(true);
    };
    const alVolverALaPestana = () => cargar(true);
    window.addEventListener("storage", alCambiarAlmacenamiento);
    window.addEventListener("focus", alVolverALaPestana);
    return () => {
      window.removeEventListener("storage", alCambiarAlmacenamiento);
      window.removeEventListener("focus", alVolverALaPestana);
    };
  }, []);

  // Los avisos y los resaltados de fila se apagan solos
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(t);
  }, [aviso]);

  useEffect(() => {
    if (!resaltado) return;
    const t = setTimeout(() => setResaltado(null), 2600);
    return () => clearTimeout(t);
  }, [resaltado]);

  useEffect(() => {
    if (!movResaltado) return;
    const t = setTimeout(() => setMovResaltado(null), 3200);
    return () => clearTimeout(t);
  }, [movResaltado]);

  const actual = SECCIONES.find((s) => s.id === seccion) ?? SECCIONES[0];

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

  const cerrarDetalle = useCallback(() => setAbiertoId(null), []);
  const cerrarModal = useCallback(() => setModalAbierto(false), []);

  /**
   * Empuja un pedido al siguiente estado. Si es real, el cambio también se guarda en
   * localStorage para que persista. Al confirmarse entra a caja como ingreso; al entregarse
   * pasa a Procesados con su hora.
   */
  const avanzar = (numero: string) => {
    const p = pedidos.find((x) => x.numero === numero);
    const siguiente = p ? SIGUIENTE[p.estado] : undefined;
    if (!p || !siguiente) return;

    const confirmando = siguiente === "confirmado";
    const entregando = siguiente === "entregado";
    const hm = horaHM();

    if (p.id !== undefined) {
      const guardado = actualizarPedidoGuardado(p.id, {
        estado: ESTADO_A_GUARDADO[siguiente],
        ...(confirmando ? { horaConfirmado: hm } : {}),
        ...(entregando ? { horaEntrega: hm } : {}),
      });
      // Se relee siempre: refleja lo último guardado, incluso si el intento falló
      setReales(leerPedidosAdmin());
      if (!guardado) {
        setAviso({
          texto: "No se pudo guardar el cambio",
          detalle: "El pedido ya no existe o el navegador bloqueó el almacenamiento.",
        });
        setAbiertoId(null);
        return;
      }

    } else {
      setFicticios((prev) =>
        prev.map((x) =>
          x.numero === numero
            ? {
                ...x,
                estado: siguiente,
                ...(confirmando ? { horaConfirmado: hm } : {}),
                ...(entregando ? { horaEntrega: hmA12(hm) } : {}),
              }
            : x,
        ),
      );
    }

    // En el momento exacto de confirmar, el pedido entra a caja como ingreso (la tabla lo calcula a
    // partir de la hora de confirmación); aquí solo se resalta la fila nueva y se avisa
    if (confirmando) {
      setMovResaltado(idMovimientoDePedido(p));
      setAviso({
        texto: `Ingreso registrado en caja: + ${cop(p.total)}`,
        detalle: `${p.cliente} · Pedido ${p.numero}`,
        accion: {
          etiqueta: "Ver caja",
          alHacerClic: () => {
            setAbiertoId(null);
            ir("caja");
            setAviso(null);
          },
        },
      });
    }

    if (entregando) {
      setAbiertoId(null);
      setAviso({
        texto: `Pedido ${p.numero} entregado a las ${hmA12(hm)}`,
        detalle: "Ya está en Procesados",
        accion: {
          etiqueta: "Ver procesados",
          alHacerClic: () => {
            setTabPedidos("procesados");
            ir("pedidos");
            setAviso(null);
          },
        },
      });
    }
  };

  /** Devuelve la demo a su estado inicial: pedidos reales fuera, todo lo ficticio como estaba */
  const limpiarDemo = () => {
    const cantidad = reales.length;
    const seguro = window.confirm(
      "¿Limpiar la demo? Se borran los pedidos reales (y sus ingresos en caja). Los pedidos ficticios, el inventario y la caja vuelven a su estado inicial.",
    );
    if (!seguro) return;

    limpiarPedidosGuardados();
    idsVistos.current = new Set();
    setReales([]);
    setFicticios(PEDIDOS);
    setInsumos(INVENTARIO);
    setEgresosDemo([]);
    setAbiertoId(null);
    setTabPedidos("activos");
    setAviso({
      texto: "Demo limpia",
      detalle:
        cantidad > 0
          ? `Se borraron ${cantidad} ${cantidad === 1 ? "pedido real" : "pedidos reales"}. Todo lo demás volvió a su estado inicial.`
          : "Todo volvió a su estado inicial.",
    });
  };

  /** Suma la entrada al stock, recalcula el semáforo y deja el gasto en caja como egreso */
  const registrarEntrada = (nombre: string, cantidad: number, costo: number) => {
    setInsumos((prev) =>
      prev.map((i) => {
        if (i.nombre !== nombre) return i;
        const total = i.cantidad + cantidad;
        return { ...i, cantidad: total, nivel: nivelDe(total, i.ideal) };
      }),
    );

    const egreso = egresoDeEntrada(nombre, costo, horaHM());
    setEgresosDemo((prev) => [...prev, egreso]);
    setMovResaltado(egreso.id ?? null);

    setModalAbierto(false);
    setResaltado(nombre);
    setAviso({
      texto: `Entrada registrada: +${cantidad} ${nombre}`,
      detalle: `Egreso en caja: − ${cop(costo)}`,
      accion: {
        etiqueta: "Ver caja",
        alHacerClic: () => {
          ir("caja");
          setAviso(null);
        },
      },
    });
  };

  const abrirDetalle = (p: Pedido) => setAbiertoId(p.numero);
  const pedidoAbierto =
    pedidos.find((p) => p.numero === abiertoId && p.estado !== "entregado") ?? null;

  return (
    <div
      className={`${
        tema === "claro" ? "tema-claro" : "tema-oscuro"
      } grano relative flex min-h-dvh flex-col bg-p-fondo text-p-texto`}
    >
      {/* ── Encabezado ── */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-p-texto/10 bg-p-panel/90 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-p-texto/25 bg-black">
            <Image
              src="/elegant-street-logo.png"
              alt="Elegant Street"
              fill
              sizes="40px"
              className="scale-[1.35] object-contain"
            />
          </div>
          <div className="leading-none">
            <p className="font-display text-xl uppercase tracking-wide">
              Panel de <span className="text-p-plata-texto">Control</span>
            </p>
            <p className="mt-1 hidden font-marker text-xs text-p-texto/55 sm:block">
              Elegant Street
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={limpiarDemo}
            aria-label="Limpiar demo: borrar los pedidos reales y devolver todo a su estado inicial"
            title="Borra los pedidos reales guardados en este navegador y devuelve todo lo demás a su estado inicial"
            className="flex items-center gap-1.5 px-1.5 py-1.5 font-body text-[0.65rem] font-bold uppercase tracking-[0.2em] text-p-texto/45 transition-colors hover:text-p-peligro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-acento"
          >
            <Icono nombre="reiniciar" className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Limpiar demo</span>
          </button>
          <button
            type="button"
            onClick={alternarTema}
            aria-label={tema === "claro" ? "Cambiar al tema oscuro" : "Cambiar al tema claro"}
            className="flex items-center gap-2 border border-p-texto/20 px-3 py-1.5 font-body text-xs font-bold uppercase tracking-wider text-p-texto/70 transition-colors hover:border-p-acento hover:text-p-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-acento"
          >
            <Icono nombre={tema === "claro" ? "luna" : "sol"} className="h-4 w-4" />
            <span className="hidden sm:inline">
              {tema === "claro" ? "Modo oscuro" : "Modo claro"}
            </span>
          </button>
          <span className="hidden border border-p-texto/20 px-2.5 py-1 font-body text-[0.65rem] font-bold uppercase tracking-[0.25em] text-p-texto/55 lg:inline">
            Demo
          </span>
          <span className="flex items-center gap-2 border border-p-ok/40 bg-p-ok/10 px-3 py-1.5 font-body text-xs font-bold uppercase tracking-wider text-p-ok">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-p-ok-solido opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-p-ok-solido" />
            </span>
            En línea
          </span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ── Barra lateral (escritorio) ── */}
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col justify-between border-r border-p-texto/10 bg-p-panel lg:flex">
          <nav aria-label="Secciones del panel" className="p-4">
            <ul className="space-y-2">
              {SECCIONES.map((s) => {
                const activa = s.id === seccion;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => ir(s.id)}
                      aria-current={activa ? "page" : undefined}
                      className={`flex w-full items-center gap-4 border-l-4 px-4 py-3.5 text-left font-display text-lg uppercase tracking-wide transition-all focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-p-acento ${
                        activa
                          ? "border-p-plata bg-p-acento text-p-sobre-acento shadow-[4px_4px_0_0_var(--p-sombra)] [.tema-oscuro_&]:border-p-acento [.tema-oscuro_&]:bg-p-hover [.tema-oscuro_&]:text-p-texto [.tema-oscuro_&]:shadow-none"
                          : "border-transparent text-p-texto/60 hover:bg-p-hover hover:text-p-texto"
                      }`}
                    >
                      <Icono
                        nombre={s.icono}
                        className={`h-5 w-5 ${activa ? "[.tema-oscuro_&]:text-p-acento" : ""}`}
                      />
                      {s.etiqueta}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <p className="border-t border-p-texto/10 p-5 font-body text-xs leading-relaxed text-p-texto/50">
            Vista de demostración. Los pedidos hechos desde la landing aparecen aquí junto a los
            ficticios.
          </p>
        </aside>

        {/* ── Contenido ── */}
        <main className="min-w-0 flex-1 px-4 pb-28 pt-8 sm:px-6 lg:pb-12 lg:pt-10 xl:px-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1
                ref={tituloRef}
                tabIndex={-1}
                className="font-display text-[clamp(2.2rem,5vw,3.6rem)] uppercase leading-[0.95] outline-none"
              >
                {actual.titulo}
              </h1>
              <p className="mt-2 font-body text-p-texto/65">{actual.subtitulo}</p>
            </div>
            {fecha && (
              <p className="font-marker text-lg capitalize text-p-plata-texto">{fecha}</p>
            )}
          </div>

          <div key={seccion} className="entra">
            {seccion === "dashboard" && (
              <VistaDashboard
                ir={ir}
                pedidos={pedidos}
                insumos={insumos}
                caja={caja}
                onSeleccionar={abrirDetalle}
              />
            )}
            {seccion === "pedidos" && (
              <VistaPedidos
                pedidos={pedidos}
                tab={tabPedidos}
                onTab={setTabPedidos}
                onSeleccionar={abrirDetalle}
              />
            )}
            {seccion === "inventario" && (
              <VistaInventario
                insumos={insumos}
                resaltado={resaltado}
                onRegistrar={() => setModalAbierto(true)}
              />
            )}
            {seccion === "caja" && (
              <VistaCaja caja={caja} movimientos={movimientos} resaltado={movResaltado} />
            )}
          </div>
        </main>
      </div>

      {/* ── Navegación inferior (móvil y tablet) ── */}
      <nav
        aria-label="Secciones del panel"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-p-texto/15 bg-p-panel/95 backdrop-blur lg:hidden"
      >
        <ul className="grid grid-cols-4">
          {SECCIONES.map((s) => {
            const activa = s.id === seccion;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => ir(s.id)}
                  aria-current={activa ? "page" : undefined}
                  className={`flex w-full flex-col items-center gap-1 border-t-2 py-3 font-body text-[0.68rem] font-bold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-p-acento ${
                    activa
                      ? "border-p-acento text-p-acento"
                      : "border-transparent text-p-texto/55 hover:text-p-texto"
                  }`}
                >
                  <Icono nombre={s.icono} className="h-5 w-5" />
                  {s.etiqueta}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Detalle de pedido (panel lateral derecho) ── */}
      <DetallePedido pedido={pedidoAbierto} onCerrar={cerrarDetalle} onAvanzar={avanzar} />

      {/* ── Registrar entrada de inventario ── */}
      {modalAbierto && (
        <ModalEntrada insumos={insumos} onCerrar={cerrarModal} onConfirmar={registrarEntrada} />
      )}

      {/* ── Aviso ── */}
      {aviso && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[60] w-[min(92vw,26rem)] -translate-x-1/2 border-2 border-p-acento bg-p-panel px-5 py-4 shadow-2xl transition-all duration-300 starting:translate-y-4 starting:opacity-0 lg:bottom-8"
        >
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center bg-p-ok-solido text-black"
            >
              <Icono nombre="check" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-body font-bold leading-tight">{aviso.texto}</p>
              {aviso.detalle && (
                <p className="mt-0.5 font-body text-sm text-p-texto/60">{aviso.detalle}</p>
              )}
            </div>
            {aviso.accion && (
              <button
                type="button"
                onClick={aviso.accion.alHacerClic}
                className="shrink-0 font-body text-xs font-bold uppercase tracking-[0.15em] text-p-acento underline decoration-2 underline-offset-4 hover:text-p-plata-texto focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-p-acento"
              >
                {aviso.accion.etiqueta}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
