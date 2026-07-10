import { DashboardHeader } from "@/components/dashboard-header";
import { CrudPage } from "@/components/erp/CrudPage";

export default function ConfiguracoesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DashboardHeader />
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        <CrudPage
          title="Configurações"
          description="Parâmetros de empresa, tema, integrações e preferências operacionais."
          table="erp_settings"
          orderBy="updated_at"
          fields={[
            { key: "company_id", label: "Empresa", required: true },
            { key: "theme", label: "Tema" },
            { key: "logo_url", label: "Logo URL" },
            { key: "preferences", label: "Preferências (JSON)", type: "textarea" },
            { key: "integrations", label: "Integrações (JSON)", type: "textarea" },
          ]}
          defaultValues={{
            company_id: "",
            theme: "dark-premium",
            logo_url: "",
            preferences: "{}",
            integrations: "{}",
          }}
        />
      </main>
    </div>
  );
}
