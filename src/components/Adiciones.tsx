import { ADICIONES, PRECIO_SALSA, SALSAS } from "@/data/menu";
import { cop } from "@/lib/formato";
import BotonAgregar from "./BotonAgregar";
import Revela from "./Revela";
import TostonCard from "./TostonCard";

function Encabezado({ titulo, nota }: { titulo: string; nota: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <h3 className="font-display text-4xl uppercase leading-none tracking-wide sm:text-5xl">
        {titulo}
      </h3>
      <p className="font-marker text-lg text-oro">{nota}</p>
    </div>
  );
}

export default function Adiciones() {
  return (
    <section
      id="adiciones"
      className="grano relative isolate scroll-mt-4 overflow-hidden bg-carbon px-5 py-28 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <Revela className="mb-16">
          <p className="mb-5 flex items-center gap-4 font-body text-xs font-bold uppercase tracking-[0.4em] text-oro">
            <span aria-hidden="true" className="h-[2px] w-12 bg-oro" />
            Personaliza
          </p>
          <h2 className="font-display text-[clamp(3rem,8vw,6rem)] uppercase leading-[0.9]">
            Adiciones <span className="text-oro">y salsas</span>
          </h2>
        </Revela>

        <div className="grid gap-16 lg:grid-cols-12 lg:gap-12">
          {/* Adiciones */}
          <Revela className="lg:col-span-7">
            <Encabezado titulo="Adiciones" nota="hazlo a tu manera" />
            <ul className="grid gap-px border border-hueso/10 bg-hueso/10 sm:grid-cols-2">
              {ADICIONES.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 bg-negro p-4 transition-colors hover:bg-grafito"
                >
                  <div>
                    <p className="font-body font-bold leading-tight">{a.nombre}</p>
                    <p className="font-display text-xl tracking-wide text-oro">
                      {cop(a.precio)}
                    </p>
                  </div>
                  <BotonAgregar
                    id={a.id}
                    nombre={a.nombre}
                    precio={a.precio}
                    compacto
                  />
                </li>
              ))}
            </ul>
          </Revela>

          {/* Salsas y tostón */}
          <div className="space-y-16 lg:col-span-5">
            <Revela retraso={150}>
              <Encabezado
                titulo="Salsas"
                nota={`${cop(PRECIO_SALSA)} c/u`}
              />
              <ul className="grid gap-px border border-hueso/10 bg-hueso/10">
                {SALSAS.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-4 bg-negro p-4 transition-colors hover:bg-grafito"
                  >
                    <p className="font-body font-bold">{s.nombre}</p>
                    <BotonAgregar
                      id={s.id}
                      nombre={`Salsa ${s.nombre}`}
                      precio={s.precio}
                      compacto
                    />
                  </li>
                ))}
              </ul>
            </Revela>

            <Revela retraso={300}>
              <TostonCard />
            </Revela>
          </div>
        </div>
      </div>
    </section>
  );
}
