import type { Metadata, Viewport } from "next";
import { Outfit, Permanent_Marker, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--nf-outfit",
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--nf-jakarta",
  subsets: ["latin"],
});

// Letra de brocha (la misma del flyer)
const marker = Permanent_Marker({
  variable: "--nf-marker",
  subsets: ["latin"],
  weight: "400",
});

const titulo = "Elegant Street · Hamburguesas a domicilio en Unidad Siempre Verde";
const descripcion =
  "Clásica, Doble, Street Carioca y Street Abacaxi desde $28.000. Pide viernes, sábado y domingo desde las 4:00 p. m. y recíbela en tu apartamento.";

// Netlify define URL (dominio principal) al construir; SITIO_URL permite forzar otro
const sitio = process.env.SITIO_URL || process.env.URL || "http://localhost:3200";

export const metadata: Metadata = {
  metadataBase: new URL(sitio),
  title: titulo,
  description: descripcion,
  openGraph: {
    title: titulo,
    description: descripcion,
    images: [{ url: "/elegant-street-logo.png", width: 1254, height: 1254, alt: "Elegant Street" }],
    locale: "es_CO",
    type: "website",
  },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${outfit.variable} ${jakarta.variable} ${marker.variable}`}>
      <body className="min-h-screen bg-negro text-hueso">{children}</body>
    </html>
  );
}
