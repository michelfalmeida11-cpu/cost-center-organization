import { DashboardHeader } from "@/components/dashboard-header";
import { CrudPage } from "@/components/erp/CrudPage";

export default function PerfuracaoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DashboardHeader />
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        <CrudPage
          title="Perfuração"
          description="Cadastro de produção de perfuração com impacto direto em custo por metro e custo por furo."
          table="erp_drilling_entries"
          orderBy="occurred_at"
          fields={[
            { key: "occurred_at", label: "Data", type: "date", required: true },
            { key: "company_id", label: "Empresa", required: true },
            { key: "equipment_id", label: "Equipamento", required: true },
            { key: "operator_name", label: "Operador" },
            { key: "drilled_meters", label: "Metros Perfurados", type: "number", required: true },
            { key: "holes_count", label: "Quantidade de Furos", type: "number", required: true },
            { key: "worked_time_hours", label: "Tempo Trabalhado", type: "number", required: true },
          ]}
          defaultValues={{
            occurred_at: "",
            company_id: "",
            equipment_id: "",
            operator_name: "",
            drilled_meters: 0,
            holes_count: 0,
            worked_time_hours: 0,
          }}
        />
      </main>
    </div>
  );
}
