import React from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { SuprimentosFornecedores } from "@/components/suprimentos/suprimentos-fornecedores";

export const metadata = {
  title: "Fornecedores — Suprimentos | AVG",
  description: "Cadastro e indicadores de Fornecedores",
};

export default function FornecedoresPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <SuprimentosFornecedores />
      </main>
    </div>
  );
}

