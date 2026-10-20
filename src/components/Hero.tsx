import Image from "next/image";
import type { CSSProperties } from "react";
import type { EstadoServicio } from "@/lib/servicio";
import AvisoServicio from "./AvisoServicio";
import Marquesina from "./Marquesina";

/** Retraso escalonado de la entrada, en ms */
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function Hero({ estado }: { estado: EstadoServicio | null }) {
  return (
    <header className="grano relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-negro">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]"
      />

      {/* Barra superior */}
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 sm:px-8">
        <span className="entra font-display text-lg font-extrabold uppercase tracking-[0.3em]" style={d(100)}>
          E·S
        </span>
        <span
          className="entra hidden font-body text-xs font-semibold uppercase tracking-[0.3em] text-hueso/60 sm:block"
          style={d(200)}
        >
          Unidad Siempre Verde · Est. 2026
        </span>
        <a
          href="#menu"
          className="entra font-body text-xs font-bold uppercase tracking-[0.25em] text-hueso/80 underline-offset-8 transition-colors hover:underline"
          style={d(300)}
        >
          Menú
        </a>
      </nav>

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-4 px-5 py-4 sm:px-8 lg:grid-cols-12 lg:gap-6">
        {/* Logo */}
        <div
          className="entra relative mx-auto aspect-square w-[min(46vw,26rem)] lg:order-2 lg:col-span-5 lg:w-full"
          style={d(250)}
        >
          <div aria-hidden="true" className="halo-oro absolute inset-[-10%]" />
          <div className="flota relative h-full w-full">
            <Image
              src="/elegant-street-logo.png"
              alt="Logo de Elegant Street: el Cristo Redentor con cajitas de comida y el texto Elegant Street, Est. 2026"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 46vw"
              className="logo-fusion object-contain"
            />
          </div>
        </div>

        {/* Texto */}
        <div className="relative z-10 lg:order-1 lg:col-span-7">
          <p className="entra -rotate-2 font-marker text-xl sm:text-3xl" style={d(350)}>
            más que comida, es estilo de vida
          </p>

          <h1 className="mt-3 font-display font-black uppercase leading-[0.86] tracking-tight">
            <span className="entra block text-[clamp(3.2rem,16vw,8.5rem)]" style={d(450)}>
              Elegant
            </span>
            <span className="entra texto-contorno block tracking-[0.02em] text-[clamp(3.2rem,16vw,8.5rem)]" style={d(550)}>
              Street
            </span>
          </h1>

          <p
            className="entra mt-5 max-w-xl font-body text-base leading-relaxed text-hueso/80 sm:text-lg"
            style={d(700)}
          >
            Hamburguesas con sabor carioca, armadas al momento y{" "}
            <strong className="font-bold text-hueso">entregadas en tu apartamento</strong> de la
            Unidad Siempre Verde. Viernes, sábado y domingo desde las 4:00 p. m.
          </p>

          <div className="entra mt-5" style={d(800)}>
            <AvisoServicio estado={estado} />
          </div>

          <div className="entra mt-6 flex flex-wrap items-center gap-5" style={d(900)}>
            <a
              href="#menu"
              className="btn-oro inline-flex items-center gap-3 bg-oro px-8 py-4 font-display text-lg font-extrabold uppercase tracking-widest text-negro shadow-[5px_5px_0_0_rgba(255,255,255,0.35)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_rgba(255,255,255,0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oro"
            >
              Pedir ahora <span aria-hidden="true">→</span>
            </a>
            <a
              href="#historia"
              className="font-body text-sm font-bold uppercase tracking-[0.2em] text-hueso/70 underline decoration-hueso/40 decoration-2 underline-offset-8 transition-colors hover:text-hueso"
            >
              Nuestra historia
            </a>
          </div>
        </div>
      </div>

      <Marquesina />
    </header>
  );
}
