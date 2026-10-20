export type Producto = {
  /** Debe coincidir con el id de la tabla public.productos */
  id: string;
  nombre: string;
  descripcion: string;
  /** Precio de respaldo en pesos. El precio real lo da Supabase. */
  precio: number;
  /** Foto en /public. Para cambiarla, reemplaza el archivo con el mismo nombre. */
  foto: string;
  fotoAlt: string;
  /** Frase corta en letra de brocha */
  nota: string;
};

export const PRODUCTOS: Producto[] = [
  {
    id: "street-carioca",
    nombre: "Street Carioca",
    descripcion:
      "Pan brioche, lechuga, tomate, carne premium, mermelada de tocineta, queso cheddar, queso crema y salsa de la casa.",
    precio: 30000,
    foto: "/productos/street-carioca.jpg",
    fotoAlt:
      "Street Carioca: hamburguesa en pan brioche con lechuga, carne, queso cheddar y mermelada de tocineta",
    nota: "la clásica",
  },
  {
    id: "street-abacaxi",
    nombre: "Street Abacaxi",
    descripcion:
      "Pan brioche, lechuga, tomate, piña asada, carne premium, queso derretido, queso crema y salsa de la casa.",
    precio: 30000,
    foto: "/productos/street-abacaxi.jpg",
    fotoAlt:
      "Street Abacaxi: hamburguesa en pan brioche con piña asada, queso derretido y queso crema",
    nota: "con piña asada",
  },
];

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO || "573113749498";

/** "573113749498" -> "311 374 9498" */
function visible(numero: string): string {
  const local = numero.startsWith("57") ? numero.slice(2) : numero;
  return local.replace(/^(\d{3})(\d{3})(\d+)$/, "$1 $2 $3");
}

export const CONTACTO = {
  whatsappNumero: WHATSAPP,
  whatsappVisible: visible(WHATSAPP),
  instagram: "https://www.instagram.com/ele.gantstreet",
  facebook: "https://www.facebook.com/61590255880038",
  usuario: "@ele.gantstreet",
  zona: "Unidad Siempre Verde",
};
