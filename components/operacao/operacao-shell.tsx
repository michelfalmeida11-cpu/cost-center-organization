"use client";

import React from "react";
import Link from "next/link";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type OperacaoTab =
  | "equipamentos"
  | "diesel"
  | "perfuracao"
  | "desmonte"
  | "logistica";

export function OperacaoShell({
  activeTab,
  subtitle,
  onTabChange,
}: {
  activeTab: OperacaoTab;
  subtitle?: string;
  onTabChange?: (t: OperacaoTab) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold font-mono" style={{ color: "oklch(0.93 0.02 195)" }}>
            OPERAÇÃO DA MINERAÇÃO
          </h1>
          {subtitle ? (
            <p className="text-[11px] font-mono" style={{ color: "oklch(0.42 0.03 220)" }}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="bg-[oklch(0.10_0.02_240)] border border-[oklch(0.75_0.20_185/0.3)] rounded-xl p-1">
          <TabsTrigger value="equipamentos" onClick={() => onTabChange?.("equipamentos")}>
            Equipamentos
          </TabsTrigger>
          <TabsTrigger value="diesel" onClick={() => onTabChange?.("diesel")}>
            Diesel
          </TabsTrigger>
          <TabsTrigger value="perfuracao" onClick={() => onTabChange?.("perfuracao")}>
            Perfuração
          </TabsTrigger>
          <TabsTrigger value="desmonte" onClick={() => onTabChange?.("desmonte")}>
            Desmonte
          </TabsTrigger>
          <TabsTrigger value="logistica" onClick={() => onTabChange?.("logistica")}>
            Logística
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipamentos">
          <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-sm font-mono">Módulo Equipamentos (CRUD + Dashboard + Gráficos + Export) — em desenvolvimento.</p>
          </div>
        </TabsContent>

        <TabsContent value="diesel">
          <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-sm font-mono">Módulo Diesel (Abastecimentos + Consumo) — em desenvolvimento.</p>
          </div>
        </TabsContent>

        <TabsContent value="perfuracao">
          <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-sm font-mono">Módulo Perfuração (Produtividade) — em desenvolvimento.</p>
          </div>
        </TabsContent>

        <TabsContent value="desmonte">
          <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-sm font-mono">Módulo Desmonte (Indicadores) — em desenvolvimento.</p>
          </div>
        </TabsContent>

        <TabsContent value="logistica">
          <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-sm font-mono">Módulo Logística (Produção transportada) — em desenvolvimento.</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-[10px] font-mono" style={{ color: "oklch(0.38 0.03 220)" }}>
        Nota: componentes de CRUD, validações, dashboards, gráficos e exportação serão implementados no próximo passo para cada módulo.
      </div>

      {/* Placeholder links (future): manter rota compatível */}
      <div className="hidden">
        <Link href="/operacao/equipamentos" />
      </div>
    </div>
  );
}

