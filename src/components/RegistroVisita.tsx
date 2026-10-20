"use client";

import { useEffect } from "react";
import { registrarVisita } from "@/app/acciones";
import {
  atribucionVigente,
  origenDeLaUrl,
  referrerDeEstaVisita,
  sesionId,
} from "@/lib/atribucion";

const MARCA = "es-visita-registrada";

/** Guarda la fuente (?src=) y registra una visita por sesión. No pinta nada. */
export default function RegistroVisita() {
  useEffect(() => {
    atribucionVigente();
    const id = sesionId();
    if (!id) return;
    try {
      if (sessionStorage.getItem(MARCA)) return;
      sessionStorage.setItem(MARCA, "1");
    } catch {
      return;
    }
    const url = origenDeLaUrl();
    void registrarVisita({
      origen: url.origen ?? "directo",
      campana: url.campana,
      referrer: referrerDeEstaVisita(),
      sesionId: id,
    });
  }, []);
  return null;
}
