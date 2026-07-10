import { DashboardHeader } from "@/components/dashboard-header";
import { CrudPage } from "@/components/erp/CrudPage";

export default function EquipamentosPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DashboardHeader />
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        <CrudPage
          title="Equipamentos"
          description="CRUD completo de equipamentos com atualização em tempo real de indicadores de disponibilidade."
          table="erp_equipments"
          orderBy="updated_at"
          fields={[
            { key: "company_id", label: "Empresa", required: true },
            { key: "cost_center_id", label: "Centro de Custo" },
            { key: "name", label: "Nome", required: true },
            { key: "model", label: "Modelo" },
            { key: "manufacturer", label: "Fabricante" },
            { key: "year", label: "Ano", type: "number" },
            { key: "hourmeter", label: "Horímetro", type: "number" },
            { key: "worked_hours", label: "Horas Trabalhadas", type: "number" },
            { key: "downtime_hours", label: "Horas Paradas", type: "number" },
            { key: "status", label: "Status", required: true },
          ]}
          defaultValues={{
            company_id: "",
            cost_center_id: "",
            name: "",
            model: "",
            manufacturer: "",
            year: 2026,
            hourmeter: 0,
            worked_hours: 0,
            downtime_hours: 0,
            status: "ATIVO",
          }}
        />
      </main>
    </div>
  );
}
