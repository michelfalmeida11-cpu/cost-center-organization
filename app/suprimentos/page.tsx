import React from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { SuprimentosExecutiveDashboard } from "@/components/suprimentos/suprimentos-executive-dashboard";

export const metadata = {
  title: "Suprimentos — AVG | Mina do Brumado",
  description: "Dashboard executivo de Suprimentos (SC/OC, Notas Fiscais, Fornecedores e Contratos)",
};

export default function SuprimentosPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <SuprimentosExecutiveDashboard />
      </main>
    </div>
  );
}

