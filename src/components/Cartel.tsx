import Image from "next/image";
import type { Cartel as CartelDatos } from "@/data/carteles";
import Revela from "./Revela";

type Props = {
  cartel: CartelDatos;
  /** Pone el afiche a la izquierda y el texto a la derecha (en pantallas grandes) */
  invertido?: boolean;
  /** Fondo de la sección, para alternar entre secciones vecinas */
  fondo?: "negro" | "carbon";
};

/**
 * Un cartel de la marca, pegado en la pared: afiche con marco blanco, cinta y leve inclinación,
 * junto a un texto corto. Los datos salen de data/carteles.ts.
 */
export default function Cartel({ cartel, invertido = false, fondo = "negro" }: Props) {
  const idTitulo = `cartel-${cartel.id}`;

  return (
    <section
      aria-labelledby={idTitulo}
      className={`grano relative isolate overflow-hidden px-5 py-20 sm:px-8 sm:py-28 ${fondo === "carbon" ? "bg-carbon" : "bg-negro"}`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12 lg:gap-10">
        {/* Afiche */}
        <Revela className={`lg:col-span-6 ${invertido ? "lg:order-1" : "lg:order-2 lg:col-start-7"}`}>
          <figure className="group relative mx-auto w-full max-w-[34rem]">
            {/* Cintas */}
            <span
              aria-hidden="true"
              className="absolute -top-3 left-6 z-10 h-7 w-24 -rotate-[8deg] bg-hueso/75 shadow-[0_2px_0_rgba(0,0,0,0.35)]"
            />
            <span
              aria-hidden="true"
              className="absolute -top-3 right-6 z-10 h-7 w-24 rotate-[7deg] bg-hueso/75 shadow-[0_2px_0_rgba(0,0,0,0.35)]"
            />
            <div
              className={`bg-hueso p-2.5 shadow-[10px_10px_0_0_rgba(255,255,255,0.16)] transition-transform duration-500 ease-out sm:p-3.5 ${invertido ? "rotate-[1.4deg]" : "-rotate-[1.4deg]"} group-hover:rotate-0`}
            >
              <Image
                src={cartel.src}
                alt={cartel.alt}
                width={cartel.ancho}
                height={cartel.alto}
                sizes="(min-width: 1024px) 34rem, 92vw"
                className="h-auto w-full"
              />
            </div>
          </figure>
        </Revela>

        {/* Texto */}
        <Revela
          retraso={150}
          className={`lg:col-span-5 ${invertido ? "lg:order-2 lg:col-start-8" : "lg:order-1 lg:col-start-1"}`}
        >
          <p className="mb-4 flex items-center gap-4 font-body text-xs font-bold uppercase tracking-[0.4em] text-hueso/70">
            <span aria-hidden="true" className="h-[2px] w-12 bg-oro" />
            {cartel.etiqueta}
          </p>
          <h2
            id={idTitulo}
            className="font-display text-[clamp(2.6rem,10vw,5.2rem)] font-black uppercase leading-[0.9] tracking-tight"
          >
            {cartel.titulo[0]}
            <br />
            <span className="texto-contorno tracking-[0.02em]">{cartel.titulo[1]}</span>
          </h2>
          <p className="mt-5 -rotate-2 font-marker text-xl text-hueso/70 sm:text-2xl">{cartel.nota}</p>
          <p className="mt-5 max-w-md font-body text-lg leading-relaxed text-hueso/70">{cartel.texto}</p>

          <div className="mt-7 flex flex-wrap items-center gap-5">
            <a
              href="#menu"
              className="inline-flex items-center gap-3 bg-oro px-7 py-3.5 font-display text-base font-extrabold uppercase tracking-widest text-negro shadow-[5px_5px_0_0_rgba(255,255,255,0.35)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_rgba(255,255,255,0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oro"
            >
              Pedir ahora <span aria-hidden="true">→</span>
            </a>
            {cartel.ampliable && (
              <>
                <a
                  href={cartel.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm font-bold uppercase tracking-[0.2em] text-hueso/70 underline decoration-hueso/40 decoration-2 underline-offset-8 transition-colors hover:text-hueso"
                >
                  Ver en grande
                </a>
                <a
                  href={cartel.src}
                  download="elegant-street-carta.webp"
                  className="font-body text-sm font-bold uppercase tracking-[0.2em] text-hueso/70 underline decoration-hueso/40 decoration-2 underline-offset-8 transition-colors hover:text-hueso"
                >
                  Descargar
                </a>
              </>
            )}
          </div>
        </Revela>
      </div>
    </section>
  );
}
