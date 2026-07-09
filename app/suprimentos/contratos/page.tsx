import React from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { SuprimentosContratos } from "@/components/suprimentos/suprimentos-contratos";

export const metadata = {
  title: "Contratos — Suprimentos | AVG",
  description: "Cadastro e controle de contratos",
};

export default function ContratosPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <SuprimentosContratos />
      </main>
    </div>
  );
}

