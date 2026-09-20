import Revela from "./Revela";

const PILARES = [
  {
    numero: "01",
    titulo: "Freestyle",
    texto:
      "Del freestyle tomamos el flow: improvisar, mezclar y atreverse. Cada plato lleva un giro que nadie espera.",
  },
  {
    numero: "02",
    titulo: "Joga Bonito",
    texto:
      "Del joga bonito, la alegría y el jogo de cintura. Hacer las cosas bien, con estilo y con ganas de gustar.",
  },
  {
    numero: "03",
    titulo: "Cocina Oculta",
    texto:
      "Sin vitrina y sin cartel. Cocinamos para los que llegan hasta aquí por el sabor, no por la fachada.",
  },
];

export default function Historia() {
  return (
    <section
      id="historia"
      className="grano relative isolate overflow-hidden bg-carbon px-5 py-28 sm:px-8 sm:py-36"
    >
      {/* Número gigante de fondo */}
      <span
        aria-hidden="true"
        className="texto-contorno-oro pointer-events-none absolute -left-4 top-6 -z-10 select-none font-display text-[clamp(10rem,38vw,34rem)] leading-none opacity-[0.16] sm:left-4"
      >
        2026
      </span>

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          {/* Título */}
          <Revela className="lg:col-span-5">
            <p className="mb-5 flex items-center gap-4 font-body text-xs font-bold uppercase tracking-[0.4em] text-oro">
              <span aria-hidden="true" className="h-[2px] w-12 bg-oro" />
              Nuestra historia
            </p>
            <h2 className="font-display text-[clamp(3.2rem,9vw,7rem)] uppercase leading-[0.88]">
              Nacimos
              <br />
              <span className="text-oro">con ritmo</span>
            </h2>
            <p className="mt-6 -rotate-2 font-marker text-2xl text-hueso/70 sm:text-3xl">
              y con la pelota pegada al pie.
            </p>
          </Revela>

          {/* Relato */}
          <div className="space-y-7 lg:col-span-6 lg:col-start-7 lg:pt-14">
            <Revela retraso={150}>
              <p className="font-body text-xl leading-relaxed text-hueso sm:text-2xl">
                Nacimos en{" "}
                <strong className="font-extrabold text-oro">2026</strong>{" "}
                inspirados en la magia del{" "}
                <strong className="font-extrabold">freestyle</strong> y el{" "}
                <strong className="font-extrabold">joga bonito</strong>, bajo
                la mirada del{" "}
                <strong className="font-extrabold">Cristo Redentor</strong>.
              </p>
            </Revela>
            <Revela retraso={300}>
              <p className="border-l-4 border-oro pl-6 font-body text-lg leading-relaxed text-hueso/75">
                Llevamos esa energía de calle a una cocina oculta colombiana,
                donde cada hamburguesa y cada salchipapa se arma como una
                jugada: con técnica, con sabor y con la actitud de quien sabe
                que lo bueno no necesita gritar para que lo encuentren.
              </p>
            </Revela>
          </div>
        </div>

        {/* Pilares */}
        <ul className="mt-24 grid gap-px overflow-hidden border border-hueso/10 bg-hueso/10 sm:mt-32 md:grid-cols-3">
          {PILARES.map((p, i) => (
            <li key={p.numero} className="bg-negro">
              <Revela retraso={i * 150} className="group h-full">
                <article className="relative h-full p-8 transition-colors duration-500 hover:bg-grafito sm:p-10">
                  <span className="font-display text-6xl text-oro/25 transition-colors duration-500 group-hover:text-oro">
                    {p.numero}
                  </span>
                  <h3 className="mt-4 font-display text-4xl uppercase tracking-wide">
                    {p.titulo}
                  </h3>
                  <p className="mt-3 font-body leading-relaxed text-hueso/65">
                    {p.texto}
                  </p>
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 h-1 w-0 bg-oro transition-all duration-500 group-hover:w-full"
                  />
                </article>
              </Revela>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
