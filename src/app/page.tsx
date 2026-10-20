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

  // Precio y disponibilidad salen de Supabase; si no responde, se usan los de respaldo
  const precios: Record<string, number> = estado
    ? Object.fromEntries(estado.productos.map((p) => [p.id, p.precio]))
    : Object.fromEntries(PRODUCTOS.map((p) => [p.id, p.precio]));

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
