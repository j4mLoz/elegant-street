import Carrito from "@/components/Carrito";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Historia from "@/components/Historia";
import Menu from "@/components/Menu";
import RegistroVisita from "@/components/RegistroVisita";
import { CarritoProvider } from "@/context/CarritoContext";
import { PRODUCTOS } from "@/data/menu";
import { obtenerEstado } from "@/lib/servicio";

// El horario y el cupo cambian minuto a minuto: se consulta en cada visita
export const dynamic = "force-dynamic";

export default async function Home() {
  const estado = await obtenerEstado();

  // Si Supabase no responde, se usan los precios de respaldo
  const respaldo: Record<string, number> = Object.fromEntries(
    PRODUCTOS.map((p) => [p.id, p.precio]),
  );
  const deLaBase: Record<string, number> | null = estado
    ? Object.fromEntries(estado.productos.map((p) => [p.id, p.precio]))
    : null;
  // Precio y disponibilidad salen de Supabase. Los productos nuevos que la base aún no
  // conoce (mostrarSinBase) se muestran igual, pero el servidor rechaza su pedido.
  const precios: Record<string, number> = deLaBase
    ? {
        ...Object.fromEntries(
          PRODUCTOS.filter((p) => p.mostrarSinBase).map((p) => [p.id, p.precio]),
        ),
        ...deLaBase,
      }
    : respaldo;

  return (
    <CarritoProvider precios={precios}>
      <RegistroVisita />
      <main>
        <Hero estado={estado} />
        <Menu precios={precios} />
        <Historia />
      </main>
      <Footer />
      <Carrito estado={estado} />
    </CarritoProvider>
  );
}
