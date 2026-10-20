import { supabaseServidor } from "./supabase";

export type Motivo = "abierto" | "antes_de_abrir" | "cerrado" | "cupo_lleno";

export type EstadoServicio = {
  abierto: boolean;
  motivo: Motivo;
  quedan: number | null;
  cupo: number | null;
  abre_a: string | null;
  cierra_a: string | null;
  proxima_apertura: string | null;
  domicilio: number;
  llave_transferencia: string;
  productos: { id: string; nombre: string; precio: number }[];
};

/** Estado actual (abierto, quedan X, próxima apertura). null = no se pudo consultar. */
export async function obtenerEstado(): Promise<EstadoServicio | null> {
  const sb = supabaseServidor();
  if (!sb) return null;
  const { data, error } = await sb.rpc("estado_servicio");
  if (error || !data) {
    console.error("estado_servicio falló:", error?.message);
    return null;
  }
  return data as EstadoServicio;
}
