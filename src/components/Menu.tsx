import { HAMBURGUESAS, SALCHIPAPAS, type Producto } from "@/data/menu";
import { cop } from "@/lib/formato";
import BotonAgregar from "./BotonAgregar";
import Revela from "./Revela";

function Tarjeta({ producto, indice }: { producto: Producto; indice: number }) {
  return (
    <Revela retraso={indice * 120} className="h-full">
      <article className="group relative flex h-full flex-col overflow-hidden border border-hueso/10 bg-carbon p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-oro/70 sm:p-8">
        {/* Esquina que se enciende al pasar el mouse */}
        <span
          aria-hidden="true"
          className="absolute -right-10 -top-10 h-24 w-24 rotate-45 bg-oro opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
        <span
          aria-hidden="true"
          className="font-display text-6xl leading-none text-oro/25 transition-colors duration-500 group-hover:text-oro"
        >
          {String(indice + 1).padStart(2, "0")}
        </span>

        <h4 className="mt-5 font-display text-4xl uppercase leading-none tracking-wide">
          {producto.nombre}
        </h4>
        <p className="mt-4 flex-1 font-body leading-relaxed text-hueso/65">
          {producto.descripcion}
        </p>

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-hueso/10 pt-6">
          <span className="font-display text-3xl tracking-wide text-oro">
            {cop(producto.precio)}
          </span>
          <BotonAgregar
            id={producto.id}
            nombre={producto.nombre}
            precio={producto.precio}
          />
        </div>
      </article>
    </Revela>
  );
}

function Categoria({
  titulo,
  nota,
  productos,
  columnas,
}: {
  titulo: string;
  nota: string;
  productos: Producto[];
  columnas: string;
}) {
  return (
    <div className="mt-20 first:mt-0">
      <Revela className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h3 className="font-display text-[clamp(2.6rem,7vw,5.5rem)] uppercase leading-[0.9]">
          <span className="texto-contorno">{titulo}</span>
        </h3>
        <p className="-rotate-2 font-marker text-xl text-oro sm:text-2xl">{nota}</p>
      </Revela>
      <div className={`grid gap-5 ${columnas}`}>
        {productos.map((p, i) => (
          <Tarjeta key={p.id} producto={p} indice={i} />
        ))}
      </div>
    </div>
  );
}

export default function Menu() {
  return (
    <section
      id="menu"
      className="relative isolate scroll-mt-4 overflow-hidden bg-negro px-5 py-28 sm:px-8 sm:py-36"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[15%] top-[20%] -z-10 h-[70vmin] w-[70vmin] rounded-full bg-oro/5 blur-3xl"
      />

      <div className="mx-auto max-w-7xl">
        <Revela className="mb-20">
          <p className="mb-5 flex items-center gap-4 font-body text-xs font-bold uppercase tracking-[0.4em] text-oro">
            <span aria-hidden="true" className="h-[2px] w-12 bg-oro" />
            El menú
          </p>
          <h2 className="font-display text-[clamp(3.2rem,9vw,7rem)] uppercase leading-[0.88]">
            Elige tu <span className="text-oro">jugada</span>
          </h2>
          <p className="mt-5 max-w-xl font-body text-lg text-hueso/70">
            Todo se arma al momento. Agrega lo que quieras y mira tu pedido en
            el carrito.
          </p>
        </Revela>

        <Categoria
          titulo="Hamburguesas"
          nota="brioche, carne artesanal y actitud"
          productos={HAMBURGUESAS}
          columnas="md:grid-cols-2 lg:grid-cols-3"
        />
        <Categoria
          titulo="Salchipapas"
          nota="montañas de sabor"
          productos={SALCHIPAPAS}
          columnas="md:grid-cols-2"
        />
      </div>
    </section>
  );
}
