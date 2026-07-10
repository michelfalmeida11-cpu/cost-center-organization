"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export type AdministracaoTab =
  | "dashboard"
  | "usuarios"
  | "perfis"
  | "permissoes"
  | "auditoria"
  | "configuracoes"
  | "logs"
  | "backup";

type Props = {
  activeTab: AdministracaoTab;
  onTabChange: (tab: AdministracaoTab) => void;
  children: React.ReactNode;
};

export function AdministracaoShell({ activeTab, onTabChange, children }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl font-bold font-mono" style={{ color: "oklch(0.93 0.02 195)" }}>
          ADMINISTRAÇÃO
        </h1>
        <p className="text-[11px] font-mono" style={{ color: "oklch(0.42 0.03 220)" }}>
          Gestão de usuários, perfis, permissões, auditoria, configurações, logs e backup.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as AdministracaoTab)} className="w-full">
        <TabsList className="bg-[oklch(0.10_0.02_240)] border border-[oklch(0.75_0.20_185/0.3)] rounded-xl p-1 flex flex-wrap gap-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="perfis">Perfis</TabsTrigger>
          <TabsTrigger value="permissoes">Permissões</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card className="rounded-xl p-4 sm:p-6 border border-border bg-card">{children}</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
