import React from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { SuprimentosGestaoScOc } from "@/components/suprimentos/suprimentos-gestao-sc-oc";

export const metadata = {
  title: "Gestão SC/OC — Suprimentos | AVG",
  description: "Gestão de Solicitações de Compra e Ordens de Compra",
};

export default function GestaoScOcPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <SuprimentosGestaoScOc />
      </main>
    </div>
  );
}

