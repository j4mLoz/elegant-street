/**
 * Carteles (banners) de la web: los flyers que manda Sebas.
 *
 * PARA CAMBIAR UN CARTEL: reemplaza el archivo de /public/carteles con el MISMO nombre
 * (o cambia `src` aquí) y actualiza `alt`. Todo lo demás se acomoda solo.
 *
 * OJO: el cartel de la carta trae los precios y el horario DENTRO de la imagen. Si cambian
 * en Supabase, hay que subir un cartel nuevo; la web no puede editar el texto de una imagen.
 */
export type Cartel = {
  id: string;
  /** Archivo en /public */
  src: string;
  /** Tamaño real de la imagen en píxeles */
  ancho: number;
  alto: number;
  /** Describe lo que dice la imagen (para lectores de pantalla y por si no carga) */
  alt: string;
  /** Rótulo pequeño sobre el título */
  etiqueta: string;
  /** Título en dos líneas: la segunda va en contorno, como en el resto de la web */
  titulo: [string, string];
  /** Frase corta en letra de brocha */
  nota: string;
  texto: string;
  /** Si es true, se ofrece "Ver en grande" y "Descargar" */
  ampliable?: boolean;
};

export const CARTELES: { cuatro: Cartel; carta: Cartel } = {
  cuatro: {
    id: "cuatro-de-la-casa",
    src: "/carteles/cuatro-de-la-casa.webp",
    ancho: 1254,
    alto: 1254,
    alt: "Cartel de Elegant Street con las cuatro hamburguesas de la casa: Clásica, Doble, Carioca y Abacaxi, sobre un fondo en blanco y negro de las casitas de una ladera de Medellín. Más que comida, es estilo de vida.",
    etiqueta: "Los cuatro de la casa",
    titulo: ["Cuatro", "streets"],
    nota: "más que comida, es estilo de vida",
    texto: "Clásica, Doble, Carioca y Abacaxi. Cada una con su propio giro y todas armadas al momento.",
  },
  carta: {
    id: "carta",
    src: "/carteles/carta.webp",
    ancho: 1254,
    alto: 1254,
    alt: "Carta de Elegant Street: Clásica $28.000, Doble $33.000, Carioca $30.000 y Abacaxi $30.000. Abierto viernes, sábado y domingo de 4:00 p. m. a 10:00 p. m. en Medellín. Instagram @ele.gantstreet, WhatsApp 311 374 9498.",
    etiqueta: "La carta",
    titulo: ["Todo en", "un vistazo"],
    nota: "guárdala o mándasela a un amigo",
    texto: "Precios y horario en una sola imagen, lista para compartir por WhatsApp o Instagram.",
    ampliable: true,
  },
};
