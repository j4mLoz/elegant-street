const formateador = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** 26000 -> "$ 26.000" */
export function cop(valor: number): string {
  return formateador.format(valor);
}

/** 12 -> "#0012" */
export function formatoNumero(numero: number): string {
  return `#${String(numero).padStart(4, "0")}`;
}

/** Fecha ISO -> "el viernes 23 de octubre a las 4:00 p. m." (hora de Colombia) */
export function cuandoAbre(iso: string | null): string | null {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  const dia = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fecha);
  const hora = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
  }).format(fecha);
  return `el ${dia.replace(",", "")} a las ${hora}`;
}

/** "16:00" -> "4:00 p. m." */
export function horaBonita(hhmm: string | null): string | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const sufijo = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

/** Cierra una frase con punto sin duplicarlo ("p. m." ya termina en punto) */
export function conPunto(frase: string): string {
  return frase.endsWith(".") ? frase : `${frase}.`;
}

/** 1 -> "1 hamburguesa", 3 -> "3 hamburguesas" */
export function hamburguesas(n: number): string {
  return `${n} ${n === 1 ? "hamburguesa" : "hamburguesas"}`;
}
