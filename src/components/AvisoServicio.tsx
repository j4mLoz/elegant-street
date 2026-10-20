import { cuandoAbre, hamburguesas, horaBonita } from "@/lib/formato";
import type { EstadoServicio } from "@/lib/servicio";

/** Texto corto del estado: abierto / quedan X / cerrado / cupo lleno */
export function textoServicio(estado: EstadoServicio | null): {
  titulo: string;
  detalle?: string;
  abierto: boolean;
} | null {
  if (!estado) return null;
  const cuando = cuandoAbre(estado.proxima_apertura);
  switch (estado.motivo) {
    case "abierto":
      return {
        abierto: true,
        titulo: "Abiertos ahora",
        detalle: [
          estado.quedan !== null ? `quedan ${hamburguesas(estado.quedan)} para hoy` : null,
          estado.cierra_a ? `pedidos hasta las ${horaBonita(estado.cierra_a)}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    case "antes_de_abrir":
      return {
        abierto: false,
        titulo: `Hoy abrimos a las ${horaBonita(estado.abre_a)}`,
        detalle: estado.cupo ? `cupo de ${hamburguesas(estado.cupo)}` : undefined,
      };
    case "cupo_lleno":
      return {
        abierto: false,
        titulo: "Se agotó el cupo de hoy",
        detalle: cuando ? `volvemos ${cuando}` : undefined,
      };
    default:
      return {
        abierto: false,
        titulo: "Ahora estamos cerrados",
        detalle: cuando ? `abrimos ${cuando}` : "viernes, sábado y domingo desde las 4:00 p. m.",
      };
  }
}

export default function AvisoServicio({ estado }: { estado: EstadoServicio | null }) {
  const t = textoServicio(estado);
  if (!t) return null;
  return (
    <p
      className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 border px-4 py-2.5 font-body text-sm ${
        t.abierto ? "border-oro bg-oro text-negro" : "border-hueso/30 text-hueso"
      }`}
    >
      <span className="flex items-center gap-2 font-display font-extrabold uppercase tracking-wider">
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${t.abierto ? "bg-negro" : "bg-hueso/40"}`}
        />
        {t.titulo}
      </span>
      {t.detalle && <span className={t.abierto ? "text-negro/75" : "text-hueso/65"}>{t.detalle}</span>}
    </p>
  );
}
