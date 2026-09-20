import type { Metadata } from "next";
import { Anton, Archivo, Permanent_Marker } from "next/font/google";
import "./globals.css";

const anton = Anton({
  variable: "--nf-anton",
  subsets: ["latin"],
  weight: "400",
});

const archivo = Archivo({
  variable: "--nf-archivo",
  subsets: ["latin"],
});

const marker = Permanent_Marker({
  variable: "--nf-marker",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Elegant Street — Cocina oculta colombiana",
  description:
    "Hamburguesas y salchipapas de cocina oculta con alma de freestyle y joga bonito. Nacimos en 2026 bajo la mirada del Cristo Redentor.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${anton.variable} ${archivo.variable} ${marker.variable}`}
    >
      <body className="min-h-screen bg-negro text-hueso">{children}</body>
    </html>
  );
}
