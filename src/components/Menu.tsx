import Image from "next/image";
import { PRODUCTOS, type Producto } from "@/data/menu";
import { cop } from "@/lib/formato";
import BotonAgregar from "./BotonAgregar";
import Revela from "./Revela";

function Tarjeta({
  producto,
  precio,
  indice,
}: {
  producto: Producto;
  precio: number;
  indice: number;
}) {
  return (
    <Revela retraso={indice * 120} className="h-full">
      <article className="group flex h-full flex-col overflow-hidden border border-hueso/15 bg-carbon">
        <div className="relative aspect-square overflow-hidden md:aspect-[4/5] bg-grafito">
          <Image
            src={producto.foto}
            alt={producto.fotoAlt}
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover object-[50%_40%] grayscale-[15%] transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <span
            aria-hidden="true"
            className="absolute left-4 top-4 bg-negro px-3 py-1 font-display text-sm font-extrabold tracking-widest"
          >
            {String(indice + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <p className="-rotate-1 font-marker text-lg text-hueso/70">{producto.nota}</p>
          <h3 className="mt-1 font-display text-4xl font-black uppercase leading-none tracking-tight">
            {producto.nombre}
          </h3>
          <p className="mt-4 flex-1 font-body leading-relaxed text-hueso/70">{producto.descripcion}</p>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-hueso/15 pt-5">
            <span className="font-display text-3xl font-extrabold tracking-tight">{cop(precio)}</span>
            <BotonAgregar id={producto.id} nombre={producto.nombre} precio={precio} />
          </div>
        </div>
      </article>
    </Revela>
  );
}

export default function Menu({ precios }: { precios: Record<string, number> }) {
  const disponibles = PRODUCTOS.filter((p) => p.id in precios);
  return (
    <section id="menu" className="relative isolate scroll-mt-4 bg-negro px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Revela className="mb-12">
          <p className="mb-4 flex items-center gap-4 font-body text-xs font-bold uppercase tracking-[0.4em] text-hueso/70">
            <span aria-hidden="true" className="h-[2px] w-12 bg-oro" />
            El menú
          </p>
          <h2 className="font-display text-[clamp(2.8rem,11vw,6rem)] font-black uppercase leading-[0.9] tracking-tight">
            Elige tu <span className="texto-contorno tracking-[0.02em]">street</span>
          </h2>
          <p className="mt-4 max-w-xl font-body text-lg text-hueso/70">
            Cuatro hamburguesas, cero relleno. Se arman al momento y llegan a tu apartamento.
          </p>
        </Revela>

        <div className="grid gap-5 md:grid-cols-2">
          {disponibles.map((p, i) => (
            <Tarjeta key={p.id} producto={p} precio={precios[p.id]} indice={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
