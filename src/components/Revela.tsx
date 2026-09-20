"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Retraso en ms para escalonar la entrada de varios elementos */
  retraso?: number;
};

/** Hace que el contenido "suba" cuando entra en pantalla. */
export default function Revela({ children, className = "", retraso = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          el.classList.add("visible");
          observador.disconnect();
        }
      },
      { threshold: 0.18 },
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`revela ${className}`}
      style={{ "--d": `${retraso}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
