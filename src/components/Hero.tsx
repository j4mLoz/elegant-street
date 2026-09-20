import Image from "next/image";
import type { CSSProperties } from "react";
import Marquesina from "./Marquesina";

/** Retraso escalonado de la entrada, en ms */
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function Hero() {
  return (
    <header className="grano relative isolate flex min-h-screen flex-col overflow-hidden bg-negro">
      {/* Atmósfera: destello dorado y viñeta */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[20%] top-[-10%] -z-10 h-[90vmin] w-[90vmin] rounded-full bg-oro/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.75)_100%)]"
      />

      {/* Barra superior */}
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-6 sm:px-8">
        <span
          className="entra font-display text-lg uppercase tracking-[0.3em] text-oro"
          style={d(100)}
        >
          E·S
        </span>
        <span
          className="entra hidden font-body text-xs font-semibold uppercase tracking-[0.35em] text-hueso/60 sm:block"
          style={d(200)}
        >
          Cocina oculta · Colombia · Est. 2026
        </span>
        <a
          href="#menu"
          className="entra font-body text-xs font-bold uppercase tracking-[0.25em] text-hueso/80 transition-colors hover:text-oro"
          style={d(300)}
        >
          Menú
        </a>
      </nav>

      {/* Cuerpo del hero */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-6 px-5 py-10 sm:px-8 lg:grid-cols-12 lg:gap-4">
        {/* Texto */}
        <div className="relative z-10 lg:col-span-7">
          <p
            className="entra mb-4 font-marker text-2xl text-oro sm:text-3xl"
            style={d(250)}
          >
            sabor colombiano, alma de freestyle
          </p>

          <h1 className="font-display uppercase leading-[0.82] tracking-tight">
            <span
              className="entra texto-contorno block text-[clamp(4.5rem,23vw,8rem)] lg:text-[clamp(4.2rem,15.5vw,12rem)]"
              style={d(350)}
            >
              Elegant
            </span>
            <span
              className="entra block text-[clamp(4.5rem,23vw,8rem)] lg:text-[clamp(4.2rem,15.5vw,12rem)] text-oro [text-shadow:0_0_60px_rgba(201,168,76,0.35)]"
              style={d(500)}
            >
              Street
            </span>
          </h1>

          <p
            className="entra mt-8 max-w-xl font-body text-lg leading-relaxed text-hueso/80 sm:text-xl"
            style={d(750)}
          >
            Aquí no hay vitrina ni cartel.{" "}
            <strong className="font-extrabold text-hueso">
              Solo los que saben, saben.
            </strong>{" "}
            Hamburguesas y salchipapas armadas como una jugada: con técnica,
            con flow y con mucho sabor.
          </p>

          <div
            className="entra mt-10 flex flex-wrap items-center gap-4"
            style={d(950)}
          >
            <a
              href="#menu"
              className="btn-oro inline-flex -skew-x-6 items-center gap-3 bg-oro px-9 py-4 font-display text-xl uppercase tracking-widest text-negro shadow-[6px_6px_0_0_rgba(255,255,255,0.9)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_0_rgba(255,255,255,0.9)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oro"
            >
              <span className="inline-block skew-x-6">Pedir ahora</span>
              <span aria-hidden="true" className="inline-block skew-x-6">
                →
              </span>
            </a>
            <a
              href="#historia"
              className="font-body text-sm font-bold uppercase tracking-[0.25em] text-hueso/70 underline decoration-oro decoration-2 underline-offset-8 transition-colors hover:text-oro"
            >
              Nuestra historia
            </a>
          </div>
        </div>

        {/* Logo flotante */}
        <div
          className="entra relative mx-auto aspect-square w-[min(88vw,34rem)] lg:col-span-5 lg:w-full"
          style={d(600)}
        >
          <div aria-hidden="true" className="halo-oro absolute inset-[-12%]" />
          <div
            aria-hidden="true"
            className="anillo absolute inset-[8%] rounded-full border border-oro/50"
          />
          <div
            aria-hidden="true"
            className="anillo absolute inset-[8%] rounded-full border border-oro/50 [animation-delay:2.2s]"
          />
          <div className="flota relative h-full w-full">
            <Image
              src="/elegant-street-logo.png"
              alt="Logo de Elegant Street: el Cristo Redentor rodeado de farolitos, con el texto Elegant Street, Est. 2026"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 88vw"
              className="logo-fusion object-contain"
            />
          </div>
        </div>
      </div>

      {/* Indicador de scroll */}
      <div
        className="entra pointer-events-none mb-6 flex flex-col items-center gap-2 text-hueso/50"
        style={d(1300)}
      >
        <span className="font-body text-[0.65rem] font-bold uppercase tracking-[0.4em]">
          Baja
        </span>
        <span aria-hidden="true" className="rebota text-oro">
          ↓
        </span>
      </div>

      <Marquesina />
    </header>
  );
}
