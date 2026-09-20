import Adiciones from "@/components/Adiciones";
import Carrito from "@/components/Carrito";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Historia from "@/components/Historia";
import Menu from "@/components/Menu";
import { CarritoProvider } from "@/context/CarritoContext";

export default function Home() {
  return (
    <CarritoProvider>
      <main>
        <Hero />
        <Historia />
        <Menu />
        <Adiciones />
      </main>
      <Footer />
      <Carrito />
    </CarritoProvider>
  );
}
