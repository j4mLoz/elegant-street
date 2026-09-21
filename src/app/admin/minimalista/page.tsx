import type { Metadata } from "next";
import PanelMinimal from "@/components/admin-minimal/PanelMinimal";

export const metadata: Metadata = {
  title: "Panel de Control (minimalista) — Elegant Street",
  description: "Variante minimalista del panel de control de demostración de Elegant Street.",
  robots: { index: false, follow: false },
};

export default function AdminMinimalistaPage() {
  return <PanelMinimal />;
}
