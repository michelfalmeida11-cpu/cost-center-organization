"use client";

import { useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { CrudPage, type CrudField } from "@/components/erp/CrudPage";

type AdminTab =
  | "empresas"
  | "usuarios"
  | "perfis"
  | "permissoes"
  | "centros"
  | "categorias"
  | "fornecedores"
  | "tipos";

const tabConfig: Record<
  AdminTab,
  {
    label: string;
    table: string;
    orderBy?: string;
    fields: CrudField[];
    defaults: Record<string, string | number>;
    description: string;
  }
> = {
  empresas: {
    label: "Empresas",
    table: "erp_companies",
    orderBy: "updated_at",
    description: "Cadastro corporativo (empresa, razao social, CNPJ e status).",
    fields: [
      { key: "name", label: "Nome", required: true },
      { key: "legal_name", label: "Razao Social" },
      { key: "tax_id", label: "CNPJ" },
      { key: "logo_url", label: "Logo URL" },
      { key: "is_active", label: "Ativa" },
    ],
    defaults: { name: "", legal_name: "", tax_id: "", logo_url: "", is_active: "true" },
  },
  usuarios: {
    label: "Usuarios",
    table: "erp_users",
    orderBy: "updated_at",
    description: "Usuarios vinculados ao Supabase Auth com empresa e status.",
    fields: [
      { key: "id", label: "ID (auth.users)", required: true },
      { key: "company_id", label: "Empresa" },
      { key: "full_name", label: "Nome", required: true },
      { key: "email", label: "Email", required: true },
      { key: "is_active", label: "Ativo" },
    ],
    defaults: { id: "", company_id: "", full_name: "", email: "", is_active: "true" },
  },
  perfis: {
    label: "Perfis",
    table: "erp_profiles",
    orderBy: "updated_at",
    description: "Perfis de acesso (Admin, Operacao, Financeiro, etc.).",
    fields: [
      { key: "code", label: "Codigo", required: true },
      { key: "name", label: "Nome", required: true },
      { key: "description", label: "Descricao", type: "textarea" },
      { key: "is_active", label: "Ativo" },
    ],
    defaults: { code: "", name: "", description: "", is_active: "true" },
  },
  permissoes: {
    label: "Permissoes",
    table: "erp_permissions",
    orderBy: "created_at",
    description: "Permissoes por modulo e acao para montagem da matriz RBAC.",
    fields: [
      { key: "module_key", label: "Modulo", required: true },
      { key: "action_key", label: "Acao", required: true },
      { key: "description", label: "Descricao", type: "textarea" },
    ],
    defaults: { module_key: "", action_key: "", description: "" },
  },
  centros: {
    label: "Centros de Custo",
    table: "erp_cost_centers",
    orderBy: "updated_at",
    description: "Cadastro de centros e setores por empresa.",
    fields: [
      { key: "company_id", label: "Empresa", required: true },
      { key: "code", label: "Codigo", required: true },
      { key: "name", label: "Nome", required: true },
      { key: "sector", label: "Setor" },
      { key: "is_active", label: "Ativo" },
    ],
    defaults: { company_id: "", code: "", name: "", sector: "", is_active: "true" },
  },
  categorias: {
    label: "Categorias",
    table: "erp_cost_categories",
    orderBy: "updated_at",
    description: "Categorias usadas nos custos operacionais.",
    fields: [
      { key: "company_id", label: "Empresa", required: true },
      { key: "name", label: "Nome", required: true },
      { key: "description", label: "Descricao", type: "textarea" },
    ],
    defaults: { company_id: "", name: "", description: "" },
  },
  fornecedores: {
    label: "Fornecedores",
    table: "erp_suppliers",
    orderBy: "updated_at",
    description: "Cadastro de fornecedores para custos e suprimentos.",
    fields: [
      { key: "company_id", label: "Empresa", required: true },
      { key: "name", label: "Nome", required: true },
      { key: "document", label: "Documento" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Telefone" },
      { key: "is_active", label: "Ativo" },
    ],
    defaults: { company_id: "", name: "", document: "", email: "", phone: "", is_active: "true" },
  },
  tipos: {
    label: "Tipos de Custos",
    table: "erp_cost_types",
    orderBy: "updated_at",
    description: "Classificacao de tipos de custos para analise gerencial.",
    fields: [
      { key: "company_id", label: "Empresa", required: true },
      { key: "name", label: "Nome", required: true },
      { key: "unit", label: "Unidade" },
    ],
    defaults: { company_id: "", name: "", unit: "" },
  },
};

export default function AdministracaoPage() {
  const [active, setActive] = useState<AdminTab>("empresas");
  const current = useMemo(() => tabConfig[active], [active]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DashboardHeader />
      <main className="mx-auto max-w-screen-2xl space-y-4 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <h1 className="text-xl font-semibold">Administracao</h1>
          <p className="text-sm text-slate-400">Gestao central do ERP (cadastros mestres, usuarios e permissoes).</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(tabConfig) as AdminTab[]).map((tab) => (
              <button
                key={tab}
                className={`rounded-lg border px-3 py-2 text-sm ${active === tab ? "border-cyan-400 bg-cyan-500/15 text-cyan-200" : "border-white/10 text-slate-300"}`}
                onClick={() => setActive(tab)}
                type="button"
              >
                {tabConfig[tab].label}
              </button>
            ))}
          </div>
        </section>

        <CrudPage
          title={current.label}
          description={current.description}
          table={current.table}
          fields={current.fields}
          defaultValues={current.defaults}
          orderBy={current.orderBy}
        />
      </main>
    </div>
  );
}
