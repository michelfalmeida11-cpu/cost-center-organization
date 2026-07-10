"use client";

import React, { useState } from "react";

import { DashboardHeader } from "@/components/dashboard-header";
import { AdministracaoShell, type AdministracaoTab } from "@/components/administracao/administracao-shell";

const tabContent: Record<AdministracaoTab, { title: string; description: string }> = {
  dashboard: {
    title: "Visão Geral Administrativa",
    description: "Painel consolidado com status da administração, acessos, auditoria e operação de segurança.",
  },
  usuarios: {
    title: "Gestão de Usuários",
    description: "Cadastro, ativação, bloqueio e ciclo de vida de usuários da plataforma.",
  },
  perfis: {
    title: "Gestão de Perfis",
    description: "Definição de perfis com escopos funcionais para cada área do negócio.",
  },
  permissoes: {
    title: "Gestão de Permissões",
    description: "Matriz de acesso por módulo, ação e criticidade de informação.",
  },
  auditoria: {
    title: "Auditoria",
    description: "Rastreabilidade completa de alterações e eventos relevantes de segurança.",
  },
  configuracoes: {
    title: "Configurações",
    description: "Parâmetros globais da aplicação e políticas administrativas.",
  },
  logs: {
    title: "Logs do Sistema",
    description: "Consulta de logs operacionais e técnicos com foco em diagnóstico rápido.",
  },
  backup: {
    title: "Backup e Recuperação",
    description: "Status de backups, janelas de retenção e histórico de restaurações.",
  },
};

export default function AdministracaoPage() {
  const [activeTab, setActiveTab] = useState<AdministracaoTab>("dashboard");
  const current = tabContent[activeTab];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
        <AdministracaoShell activeTab={activeTab} onTabChange={setActiveTab}>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">{current.title}</h2>
            <p className="text-sm text-muted-foreground">{current.description}</p>
          </div>
        </AdministracaoShell>
      </main>
    </div>
  );
}