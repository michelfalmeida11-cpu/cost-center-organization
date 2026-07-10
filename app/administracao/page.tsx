"use client";

import React, { useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  AdministracaoShell,
  type AdministracaoTab,
} from "@/components/administracao/administracao-shell";
import { Card } from "@/components/ui/card";

function DashboardAdministracao() {
  const items = [
    { label: "Total Usuários", value: "0" },
    { label: "Usuários Ativos", value: "0" },
    { label: "Usuários Online", value: "0" },
    { label: "Backups", value: "0" },
    { label: "Logs", value: "0" },
    { label: "Auditorias", value: "0" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-mono text-muted-foreground">{item.label}</p>
          <p className="text-2xl font-bold font-mono mt-2">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}

function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <h2 className="text-base font-semibold font-mono">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
    </div>
  );
}

export default function AdministracaoPage() {
  const [activeTab, setActiveTab] = useState<AdministracaoTab>("dashboard");

  const content = useMemo(() => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardAdministracao />;
      case "usuarios":
        return (
          <Placeholder
            title="Usuários"
            subtitle="CRUD completo de usuários será conectado nas próximas etapas via API /app/api/administracao/users."
          />
        );
      case "perfis":
        return <Placeholder title="Perfis" subtitle="Gestão de perfis e vínculo com permissões." />;
      case "permissoes":
        return <Placeholder title="Permissões" subtitle="Matriz RBAC por módulo e ação." />;
      case "auditoria":
        return <Placeholder title="Auditoria" subtitle="Rastreamento de alterações e trilha de auditoria." />;
      case "configuracoes":
        return <Placeholder title="Configurações" subtitle="Parâmetros do sistema, SMTP e integrações." />;
      case "logs":
        return <Placeholder title="Logs" subtitle="Eventos de login, falhas, exceções e erros." />;
      case "backup":
        return <Placeholder title="Backup" subtitle="Backup manual/automático, restore e histórico." />;
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <AdministracaoShell activeTab={activeTab} onTabChange={setActiveTab}>
          {content}
        </AdministracaoShell>
      </main>
    </div>
  );
}
