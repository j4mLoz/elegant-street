export type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  /** Pesos colombianos, entero */
  precio: number;
};

export type Extra = {
  id: string;
  nombre: string;
  precio: number;
};

export const HAMBURGUESAS: Producto[] = [
  {
    id: "street-paulista",
    nombre: "Street Paulista",
    descripcion:
      "Pan brioche, verduras, carne artesanal premium, tocineta ahumada, queso cheddar, papas a la francesa.",
    precio: 26000,
  },
  {
    id: "street-gaucha",
    nombre: "Street Gaucha",
    descripcion:
      "Pan brioche, verduras, doble carne artesanal premium, tocineta ahumada, queso cheddar, papas a la francesa.",
    precio: 32000,
  },
  {
    id: "street-carioca",
    nombre: "Street Carioca",
    descripcion:
      "Pan brioche, verduras, carne artesanal premium, mermelada de tocineta, queso crema.",
    precio: 30000,
  },
];

export const SALCHIPAPAS: Producto[] = [
  {
    id: "street-ranchera",
    nombre: "Street Ranchera",
    descripcion:
      "Papas a la francesa, salchicha ranchera, tocineta ahumada, maduritos, queso mozzarella.",
    precio: 28000,
  },
  {
    id: "street-honey",
    nombre: "Street Honey",
    descripcion:
      "Papas a la francesa, salchicha zenú, tocineta ahumada, pollo bañado en miel, maicitos, queso mozzarella.",
    precio: 28000,
  },
  {
    id: "street-mex",
    nombre: "Street Mex",
    descripcion:
      "Papas a la francesa, guacamole, pico e' gallo, carne desmechada, pollo desmechado, queso mozzarella.",
    precio: 28000,
  },
  {
    id: "street-classic",
    nombre: "Street Classic",
    descripcion:
      "Papas a la francesa, salchicha zenú, tocineta, queso cheddar.",
    precio: 22000,
  },
];

export const ADICIONES: Extra[] = [
  { id: "add-carne-artesanal", nombre: "Carne artesanal", precio: 6000 },
  { id: "add-tocineta-ahumada", nombre: "Tocineta ahumada", precio: 5000 },
  { id: "add-queso-cheddar", nombre: "Queso cheddar", precio: 4000 },
  {
    id: "add-mermelada-tocineta",
    nombre: "Mermelada de tocineta",
    precio: 6000,
  },
  { id: "add-papas-francesa", nombre: "Papas a la francesa", precio: 6000 },
  { id: "add-salchicha-ranchera", nombre: "Salchicha ranchera", precio: 5000 },
  { id: "add-salchicha-zenu", nombre: "Salchicha zenú", precio: 4000 },
  { id: "add-pollo-desmechado", nombre: "Pollo desmechado", precio: 5000 },
  { id: "add-carne-desmechada", nombre: "Carne desmechada", precio: 6000 },
  { id: "add-maduros", nombre: "Maduros", precio: 3000 },
  { id: "add-guacamole", nombre: "Guacamole", precio: 4000 },
];

export const PRECIO_SALSA = 2500;

export const SALSAS: Extra[] = [
  { id: "salsa-bbq-dulce", nombre: "BBQ Dulce", precio: PRECIO_SALSA },
  { id: "salsa-dulce-maiz", nombre: "Dulce Maíz", precio: PRECIO_SALSA },
  {
    id: "salsa-mayo-cilantro",
    nombre: "Mayonesa Cilantro",
    precio: PRECIO_SALSA,
  },
  { id: "salsa-mayo-relish", nombre: "Mayonesa Relish", precio: PRECIO_SALSA },
];

export const TOSTON = {
  id: "toston-queso",
  nombre: "Tostón de queso",
  precio: 7900,
  /** Costo extra si se pide con tocineta */
  extraTocineta: 1900,
};

export const CONTACTO = {
  whatsappNumero: "573007022596",
  whatsappVisible: "+57 300 702 2596",
  instagram: "https://www.instagram.com/ele.gantstreet",
  facebook: "https://www.facebook.com/61590255880038",
  usuario: "@Ele.gantstreet",
};
