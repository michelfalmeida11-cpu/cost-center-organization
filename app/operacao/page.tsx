"use client";

import React, { useMemo, useState } from "react";

import { DashboardHeader } from "@/components/dashboard-header";
import { OperacaoShell } from "@/components/operacao/operacao-shell";

export const metadata = {
  title: "Operação da Mineração — AVG | Mina do Brumado",
  description:
    "Módulo completo da OPERAÇÃO DA MINERAÇÃO (Equipamentos, Diesel, Perfuração, Desmonte e Logística).",
};

export default function OperacaoPage() {
  const [active, setActive] = useState<
    "equipamentos" | "diesel" | "perfuracao" | "desmonte" | "logistica"
  >("equipamentos");

  const subtitle = useMemo(() => {
    const map: Record<typeof active, string> = {
      equipamentos: "Cadastros e disponibilidade",
      diesel: "Abastecimentos e consumo",
      perfuracao: "Produtividade e perfuração",
      desmonte: "Indicadores do desmonte",
      logistica: "Produção transportada e viagens",
    };
    return map[active];
  }, [active]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <OperacaoShell
          activeTab={active}
          onTabChange={setActive}
          subtitle={subtitle}
        />
      </main>
    </div>
  );
}

