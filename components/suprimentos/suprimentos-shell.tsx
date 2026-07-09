"use client";

import React from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export type SuprimentosTab = "dashboard" | "gestao" | "notas" | "fornecedores" | "contratos";


export function SuprimentosShell({ activeTab = "dashboard", children, headerTitle }: {
  activeTab?: SuprimentosTab;
  headerTitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl font-bold font-mono" style={{ color: "oklch(0.93 0.02 195)" }}>
          {headerTitle}
        </h1>
        <p className="text-[11px] font-mono" style={{ color: "oklch(0.42 0.03 220)" }}>
          Controle premium de SC/OC, Notas Fiscais, Fornecedores e Contratos.
        </p>
      </div>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="bg-[oklch(0.10_0.02_240)] border border-[oklch(0.75_0.20_185/0.3)] rounded-xl p-1">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-[oklch(0.75_0.20_185/0.15)] data-[state=active]:text-[oklch(0.75_0.20_185)]">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="gestao" className="data-[state=active]:bg-[oklch(0.00_0.00_0/0.0)] data-[state=active]:text-[oklch(0.00 0.00 0)]" asChild>
            <Link href="/suprimentos/gestao">Gestão SC/OC</Link>
          </TabsTrigger>
          <TabsTrigger value="notas" className="data-[state=active]:bg-[oklch(0.00 0.00 0/0.0)]" asChild>
            <Link href="/suprimentos/notas">Notas Fiscais</Link>
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="data-[state=active]:bg-[oklch(0.00 0.00 0/0.0)]" asChild>
            <Link href="/suprimentos/fornecedores">Fornecedores</Link>
          </TabsTrigger>
          <TabsTrigger value="contratos" className="data-[state=active]:bg-[oklch(0.00 0.00 0/0.0)]" asChild>
            <Link href="/suprimentos/contratos">Contratos</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>{children}</TabsContent>
      </Tabs>
    </div>
  );
}

