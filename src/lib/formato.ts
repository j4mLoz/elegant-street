const formateador = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** 26000 -> "$ 26.000" */
export function cop(valor: number): string {
  return formateador.format(valor);
}
