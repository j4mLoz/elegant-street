import type { Metadata } from "next";
import PanelAdmin from "@/components/admin/PanelAdmin";

export const metadata: Metadata = {
  title: "Panel de Control — Elegant Street",
  description: "Panel de control de demostración para el dueño de Elegant Street.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <PanelAdmin />;
}
