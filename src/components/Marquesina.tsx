const FRASES = [
  "Street Carioca",
  "Street Abacaxi",
  "La calle también come rico",
  "Buena comida, buena gente",
  "Est. 2026",
];

/** Cinta blanca inclinada que corre sin parar, como cinta de calle. */
export default function Marquesina() {
  return (
    <div
      aria-hidden="true"
      className="relative z-20 -rotate-[1.6deg] scale-[1.03] overflow-hidden border-y-2 border-negro bg-oro py-3"
    >
      {/* Dos copias idénticas: al desplazar -50% el bucle no se nota */}
      <div className="marquesina-pista">
        {[0, 1].map((copia) => (
          <ul key={copia} className="flex shrink-0 items-center">
            {[...FRASES, ...FRASES].map((frase, i) => (
              <li
                key={`${copia}-${i}`}
                className="flex items-center font-display text-xl font-extrabold uppercase tracking-wider text-negro sm:text-2xl"
              >
                <span className="px-6">{frase}</span>
                <span className="text-lg">✦</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
