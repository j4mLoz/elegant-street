/**
 * Atribución por ?src= (ig, tiktok, wa, fb, qr, pauta…).
 * Se guarda la PRIMERA fuente durante 7 días; vale también ?utm_source=.
 * Solo se usa en el navegador.
 */
const LLAVE = "es-atribucion";
const LLAVE_SESION = "es-sesion";
const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;
const VALIDO = /^[a-z0-9_-]{1,30}$/;

export type Atribucion = {
  origen: string;
  campana?: string;
  referrer?: string;
  /** Primera visita, en ms */
  desde: number;
};

function limpiar(valor: string | null): string | undefined {
  const v = valor?.trim().toLowerCase();
  return v && VALIDO.test(v) ? v : undefined;
}

/** Origen de ESTA visita (lo que trae la URL ahora) */
export function origenDeLaUrl(): { origen?: string; campana?: string } {
  const p = new URLSearchParams(window.location.search);
  return {
    origen: limpiar(p.get("src")) ?? limpiar(p.get("utm_source")),
    campana: p.get("c")?.trim().slice(0, 60) || p.get("utm_campaign")?.trim().slice(0, 60) || undefined,
  };
}

function referrerExterno(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const r = new URL(document.referrer);
    return r.host === window.location.host ? undefined : r.host.slice(0, 300);
  } catch {
    return undefined;
  }
}

/** Lee la atribución guardada; si no hay (o venció), guarda la de esta visita. */
export function atribucionVigente(): Atribucion {
  const ahora = Date.now();
  try {
    const guardada = JSON.parse(localStorage.getItem(LLAVE) ?? "null") as Atribucion | null;
    if (guardada && VALIDO.test(guardada.origen) && ahora - guardada.desde < SIETE_DIAS) {
      return guardada;
    }
  } catch {
    /* almacenamiento no disponible o dañado */
  }
  const url = origenDeLaUrl();
  const nueva: Atribucion = {
    origen: url.origen ?? "directo",
    campana: url.campana,
    referrer: referrerExterno(),
    desde: ahora,
  };
  // "directo" no ocupa el lugar: si luego llega con ?src=, esa fuente gana
  if (url.origen) {
    try {
      localStorage.setItem(LLAVE, JSON.stringify(nueva));
    } catch {
      /* modo privado */
    }
  }
  return nueva;
}

/** Id de la sesión de esta pestaña (une la visita con el pedido) */
export function sesionId(): string | undefined {
  try {
    let id = sessionStorage.getItem(LLAVE_SESION);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(LLAVE_SESION, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export function referrerDeEstaVisita(): string | undefined {
  return referrerExterno();
}
