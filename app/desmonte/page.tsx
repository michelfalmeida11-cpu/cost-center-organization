import { DashboardHeader } from "@/components/dashboard-header";
import { CrudPage } from "@/components/erp/CrudPage";

export default function DesmontePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DashboardHeader />
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        <CrudPage
          title="Desmonte"
          description="Cadastro de desmonte com custo e volume integrado aos indicadores e custos operacionais."
          table="erp_blasting_entries"
          orderBy="occurred_at"
          fields={[
            { key: "occurred_at", label: "Data", type: "date", required: true },
            { key: "company_id", label: "Empresa", required: true },
            { key: "bench", label: "Bancada" },
            { key: "explosive", label: "Explosivo" },
            { key: "quantity", label: "Quantidade", type: "number", required: true },
            { key: "volume", label: "Volume", type: "number", required: true },
            { key: "cost_value", label: "Custo", type: "number", required: true },
          ]}
          defaultValues={{
            occurred_at: "",
            company_id: "",
            bench: "",
            explosive: "",
            quantity: 0,
            volume: 0,
            cost_value: 0,
          }}
        />
      </main>
    </div>
  );
}
