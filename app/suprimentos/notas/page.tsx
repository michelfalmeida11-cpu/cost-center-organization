import React from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { SuprimentosNotasFiscais } from "@/components/suprimentos/suprimentos-notas-fiscais";

export const metadata = {
  title: "Notas Fiscais — Suprimentos | AVG",
  description: "Gestão de Notas Fiscais de entrada",
};

export default function NotasFiscaisPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <SuprimentosNotasFiscais />
      </main>
    </div>
  );
}

