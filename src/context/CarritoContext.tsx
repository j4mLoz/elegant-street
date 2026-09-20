"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ItemCarrito = {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

type NuevoItem = Omit<ItemCarrito, "cantidad">;

type CarritoCtx = {
  items: ItemCarrito[];
  abierto: boolean;
  total: number;
  cantidadTotal: number;
  abrir: () => void;
  cerrar: () => void;
  agregar: (item: NuevoItem) => void;
  cambiarCantidad: (id: string, delta: number) => void;
  quitar: (id: string) => void;
  vaciar: () => void;
  cantidadDe: (id: string) => number;
};

const LLAVE = "elegant-street-carrito";
const Contexto = createContext<CarritoCtx | null>(null);

function leerGuardado(): ItemCarrito[] {
  try {
    const crudo = localStorage.getItem(LLAVE);
    if (!crudo) return [];
    const datos: unknown = JSON.parse(crudo);
    if (!Array.isArray(datos)) return [];
    return datos.filter(
      (i): i is ItemCarrito =>
        typeof i?.id === "string" &&
        typeof i?.nombre === "string" &&
        Number.isFinite(i?.precio) &&
        Number.isInteger(i?.cantidad) &&
        i.cantidad > 0,
    );
  } catch {
    return [];
  }
}

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [hidratado, setHidratado] = useState(false);

  // Se lee después de montar para no desalinear el HTML del servidor
  useEffect(() => {
    setItems(leerGuardado());
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    try {
      localStorage.setItem(LLAVE, JSON.stringify(items));
    } catch {
      /* modo privado o almacenamiento lleno: el carrito sigue en memoria */
    }
  }, [items, hidratado]);

  const agregar = useCallback((nuevo: NuevoItem) => {
    setItems((actual) => {
      const existe = actual.some((i) => i.id === nuevo.id);
      return existe
        ? actual.map((i) =>
            i.id === nuevo.id ? { ...i, cantidad: i.cantidad + 1 } : i,
          )
        : [...actual, { ...nuevo, cantidad: 1 }];
    });
  }, []);

  const cambiarCantidad = useCallback((id: string, delta: number) => {
    setItems((actual) =>
      actual
        .map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0),
    );
  }, []);

  const quitar = useCallback((id: string) => {
    setItems((actual) => actual.filter((i) => i.id !== id));
  }, []);

  const vaciar = useCallback(() => setItems([]), []);
  const abrir = useCallback(() => setAbierto(true), []);
  const cerrar = useCallback(() => setAbierto(false), []);

  const valor = useMemo<CarritoCtx>(() => {
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const cantidadTotal = items.reduce((s, i) => s + i.cantidad, 0);
    return {
      items,
      abierto,
      total,
      cantidadTotal,
      abrir,
      cerrar,
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
      cantidadDe: (id) => items.find((i) => i.id === id)?.cantidad ?? 0,
    };
  }, [items, abierto, abrir, cerrar, agregar, cambiarCantidad, quitar, vaciar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCarrito(): CarritoCtx {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  return ctx;
}
