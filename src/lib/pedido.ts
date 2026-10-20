import { z } from "zod";

/** Teléfono celular colombiano: acepta "311 374 9498", "+57 3113749498"… y deja 10 dígitos */
const telefono = z
  .string()
  .transform((t) => {
    const d = t.replace(/\D/g, "");
    return d.length === 12 && d.startsWith("57") ? d.slice(2) : d;
  })
  .pipe(z.string().regex(/^3\d{9}$/, "Escribe un celular de 10 dígitos (ej. 311 374 9498)"));

export const esquemaPedido = z.object({
  nombre: z.string().trim().min(2, "Cuéntanos tu nombre").max(60, "Máximo 60 letras"),
  telefono,
  torre: z.string().trim().min(1, "¿En qué torre?").max(10, "Máximo 10 caracteres"),
  apto: z.string().trim().min(1, "¿Qué apartamento?").max(10, "Máximo 10 caracteres"),
  pago: z.enum(["efectivo", "transferencia"], "Elige cómo pagas"),
  notas: z.string().trim().max(300, "Máximo 300 caracteres").optional().default(""),
  items: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]{2,40}$/),
        cantidad: z.number().int().min(1).max(10),
      }),
    )
    .min(1, "Agrega al menos una hamburguesa")
    .max(10),
  // Atribución
  origen: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]{1,30}$/)
    .catch("directo"),
  campana: z.string().trim().max(60).optional().catch(undefined),
  referrer: z.string().trim().max(300).optional().catch(undefined),
  sesionId: z.uuid().optional().catch(undefined),
  // Campo trampa: las personas no lo ven; los bots lo llenan
  sitio_web: z.string().optional(),
});

export type EntradaPedido = z.input<typeof esquemaPedido>;

export type CampoPedido = "nombre" | "telefono" | "torre" | "apto" | "pago" | "items";

export type ItemConfirmado = {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
};

export type ResultadoPedido =
  | {
      ok: true;
      numero: number;
      items: ItemConfirmado[];
      subtotal: number;
      domicilio: number;
      total: number;
      llaveTransferencia: string;
    }
  | {
      ok: false;
      error:
        | "datos_invalidos"
        | "fuera_de_horario"
        | "cupo_lleno"
        | "demasiados_pedidos"
        | "producto_invalido"
        | "no_disponible";
      mensaje: string;
      campos?: Partial<Record<CampoPedido, string>>;
      quedan?: number;
      proximaApertura?: string | null;
    };
