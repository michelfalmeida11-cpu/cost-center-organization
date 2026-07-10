import { DashboardHeader } from "@/components/dashboard-header";
import { CrudPage } from "@/components/erp/CrudPage";

export default function DieselPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DashboardHeader />
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        <CrudPage
          title="Diesel"
          description="Cadastro de abastecimentos com cálculo automático de valor total e atualização instantânea do dashboard."
          table="erp_diesel_entries"
          orderBy="occurred_at"
          fields={[
            { key: "occurred_at", label: "Data", type: "date", required: true },
            { key: "company_id", label: "Empresa", required: true },
            { key: "equipment_id", label: "Equipamento", required: true },
            { key: "driver_name", label: "Motorista" },
            { key: "liters", label: "Litros", type: "number", required: true },
            { key: "value_per_liter", label: "Valor por Litro", type: "number", required: true },
            { key: "hourmeter", label: "Horímetro", type: "number" },
          ]}
          defaultValues={{
            occurred_at: "",
            company_id: "",
            equipment_id: "",
            driver_name: "",
            liters: 0,
            value_per_liter: 0,
            hourmeter: 0,
          }}
        />
      </main>
    </div>
  );
}
