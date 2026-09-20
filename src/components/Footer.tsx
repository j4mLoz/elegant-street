import { CONTACTO } from "@/data/menu";

const ICONO = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const REDES = [
  {
    nombre: "Instagram",
    detalle: CONTACTO.usuario,
    href: CONTACTO.instagram,
    icono: (
      <svg {...ICONO}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
      </svg>
    ),
  },
  {
    nombre: "Facebook",
    detalle: CONTACTO.usuario,
    href: CONTACTO.facebook,
    icono: (
      <svg {...ICONO}>
        <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8z" />
      </svg>
    ),
  },
  {
    nombre: "WhatsApp",
    detalle: CONTACTO.whatsappVisible,
    href: `https://wa.me/${CONTACTO.whatsappNumero}`,
    icono: (
      <svg {...ICONO}>
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        <path d="M9 9.5c.5 2 2.5 4 5 5l1.5-1.5-2-1-1 .8c-.8-.4-1.6-1.2-2-2l.8-1-1-2z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="grano relative isolate overflow-hidden border-t-4 border-oro bg-negro px-5 pb-10 pt-20 sm:px-8">
      <span
        aria-hidden="true"
        className="texto-contorno-oro pointer-events-none absolute inset-x-0 bottom-0 -z-10 select-none text-center font-display text-[clamp(5rem,22vw,20rem)] uppercase leading-[0.75] opacity-[0.12]"
      >
        Elegant
      </span>

      <div className="mx-auto grid max-w-7xl gap-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-5xl uppercase leading-[0.9] sm:text-6xl">
            Elegant <span className="text-oro">Street</span>
          </p>
          <p className="mt-4 font-marker text-xl text-hueso/70">
            cocina oculta · est. 2026
          </p>
          <p className="mt-6 max-w-sm font-body text-hueso/60">
            Sabor colombiano con alma de freestyle y joga bonito.
          </p>
        </div>

        <nav aria-label="Redes sociales y contacto" className="md:col-span-7">
          <p className="mb-6 font-body text-xs font-bold uppercase tracking-[0.4em] text-oro">
            Encuéntranos
          </p>
          <ul className="grid gap-px border border-hueso/10 bg-hueso/10 sm:grid-cols-3">
            {REDES.map((r) => (
              <li key={r.nombre} className="bg-negro">
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col gap-3 p-6 transition-colors hover:bg-oro hover:text-negro focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-oro"
                >
                  <span className="text-oro transition-colors group-hover:text-negro">
                    {r.icono}
                  </span>
                  <span className="font-display text-2xl uppercase tracking-wide">
                    {r.nombre}
                  </span>
                  <span className="break-all font-body text-sm text-hueso/60 transition-colors group-hover:text-negro/80">
                    {r.detalle}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-16 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-hueso/10 pt-6 font-body text-xs uppercase tracking-[0.2em] text-hueso/40">
        <span>© 2026 Elegant Street</span>
        <span>Hecho con sabor y ritmo</span>
      </div>
    </footer>
  );
}
