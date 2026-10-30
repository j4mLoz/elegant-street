"use server";

import { z } from "zod";
import { conPunto, cuandoAbre, hamburguesas } from "@/lib/formato";
import { esquemaPedido, type CampoPedido, type ResultadoPedido } from "@/lib/pedido";
import { supabaseServidor } from "@/lib/supabase";

const ERROR_GENERAL =
  "No pudimos registrar tu pedido. Inténtalo de nuevo en un momento o escríbenos por WhatsApp.";

type RespuestaRpc = {
  ok: boolean;
  error?: string;
  numero?: number;
  items?: { nombre: string; cantidad: number; precio_unitario: number }[];
  subtotal?: number;
  domicilio?: number;
  total?: number;
  llave_transferencia?: string;
  quedan?: number;
  proxima_apertura?: string | null;
};

export async function crearPedido(entrada: unknown): Promise<ResultadoPedido> {
  const datos = esquemaPedido.safeParse(entrada);
  if (!datos.success) {
    const campos: Partial<Record<CampoPedido, string>> = {};
    for (const p of datos.error.issues) {
      const campo = p.path[0] as CampoPedido;
      if (campo && !campos[campo]) campos[campo] = p.message;
    }
    return {
      ok: false,
      error: "datos_invalidos",
      mensaje: "Revisa los datos marcados.",
      campos,
    };
  }

  const d = datos.data;

  // Campo trampa lleno = bot. No se guarda nada.
  if (d.sitio_web && d.sitio_web.trim() !== "") {
    return { ok: false, error: "no_disponible", mensaje: ERROR_GENERAL };
  }

  const sb = supabaseServidor();
  if (!sb) {
    console.error("Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY");
    return { ok: false, error: "no_disponible", mensaje: ERROR_GENERAL };
  }

  const { data, error } = await sb.rpc("crear_pedido", {
    p_cliente: d.nombre,
    p_telefono: d.telefono,
    p_torre: d.torre,
    p_apto: d.apto,
    p_pago: d.pago,
    p_notas: d.notas,
    p_items: d.items,
    p_origen: d.origen,
    p_campana: d.campana ?? null,
    p_referrer: d.referrer ?? null,
    p_sesion_id: d.sesionId ?? null,
  });

  if (error || !data) {
    console.error("crear_pedido falló:", error?.message);
    return { ok: false, error: "no_disponible", mensaje: ERROR_GENERAL };
  }

  const r = data as RespuestaRpc;

  if (r.ok && r.numero) {
    return {
      ok: true,
      numero: r.numero,
      items: r.items ?? [],
      subtotal: r.subtotal ?? 0,
      domicilio: r.domicilio ?? 0,
      total: r.total ?? 0,
      llaveTransferencia: r.llave_transferencia ?? "",
    };
  }

  const cuando = cuandoAbre(r.proxima_apertura ?? null);
  switch (r.error) {
    case "fuera_de_horario":
      return {
        ok: false,
        error: "fuera_de_horario",
        mensaje: cuando
          ? `Ahora estamos cerrados. ${conPunto(`Abrimos ${cuando}`)}`
          : "Ahora estamos cerrados. Síguenos en Instagram para saber cuándo abrimos.",
        proximaApertura: r.proxima_apertura ?? null,
      };
    case "cupo_lleno":
      return {
        ok: false,
        error: "cupo_lleno",
        quedan: r.quedan ?? 0,
        mensaje:
          r.quedan && r.quedan > 0
            ? `Solo quedan ${hamburguesas(r.quedan)} para hoy. Ajusta tu pedido.`
            : `Se agotó el cupo de hoy.${cuando ? ` ${conPunto(`Volvemos ${cuando}`)}` : ""}`,
        proximaApertura: r.proxima_apertura ?? null,
      };
    case "demasiados_pedidos":
      return {
        ok: false,
        error: "demasiados_pedidos",
        mensaje:
          "Ya recibimos varios pedidos con este teléfono hace poco. Escríbenos por WhatsApp si necesitas otro.",
      };
    case "producto_invalido":
      return {
        ok: false,
        error: "producto_invalido",
        mensaje: "Uno de los productos no está disponible por ahora, así que no creamos tu pedido. Recarga la página o escríbenos por WhatsApp.",
      };
    case "datos_invalidos":
      return { ok: false, error: "datos_invalidos", mensaje: "Revisa los datos del pedido." };
    default:
      return { ok: false, error: "no_disponible", mensaje: ERROR_GENERAL };
  }
}

const esquemaVisita = z.object({
  origen: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{1,30}$/).catch("directo"),
  campana: z.string().trim().max(60).optional().catch(undefined),
  referrer: z.string().trim().max(300).optional().catch(undefined),
  sesionId: z.uuid(),
});

/** Registra la visita (una por sesión). Si falla, no pasa nada: no bloquea la web. */
export async function registrarVisita(entrada: unknown): Promise<void> {
  const v = esquemaVisita.safeParse(entrada);
  const sb = supabaseServidor();
  if (!v.success || !sb) return;
  const { error } = await sb.rpc("registrar_visita", {
    p_origen: v.data.origen,
    p_campana: v.data.campana ?? null,
    p_referrer: v.data.referrer ?? null,
    p_sesion_id: v.data.sesionId,
  });
  if (error) console.error("registrar_visita falló:", error.message);
}
