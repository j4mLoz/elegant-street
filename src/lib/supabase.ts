import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null | undefined;

/**
 * Cliente de Supabase SOLO para el servidor (Server Actions y Server Components).
 * Usa la llave pública: la base no deja leer ni escribir tablas, solo llamar
 * a las funciones estado_servicio, crear_pedido y registrar_visita.
 * Devuelve null si faltan las variables de entorno.
 */
export function supabaseServidor(): SupabaseClient | null {
  if (cliente !== undefined) return cliente;
  const url = process.env.SUPABASE_URL;
  const llave = process.env.SUPABASE_PUBLISHABLE_KEY;
  cliente =
    url && llave
      ? createClient(url, llave, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  return cliente;
}
