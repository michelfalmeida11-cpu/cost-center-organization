import { DashboardHeader } from "@/components/dashboard-header";
import { CrudPage } from "@/components/erp/CrudPage";

export default function LogisticaPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DashboardHeader />
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        <CrudPage
          title="Logística"
          description="Cadastro de transporte com cálculo de produtividade e reflexo imediato no dashboard."
          table="erp_logistics_entries"
          orderBy="occurred_at"
          fields={[
            { key: "occurred_at", label: "Data", type: "date", required: true },
            { key: "company_id", label: "Empresa", required: true },
            { key: "truck", label: "Caminhão" },
            { key: "driver_name", label: "Motorista" },
            { key: "trips", label: "Viagens", type: "number", required: true },
            { key: "distance_km", label: "Distância", type: "number", required: true },
            { key: "tons", label: "Toneladas", type: "number", required: true },
            { key: "transport_cost", label: "Custo Transporte", type: "number", required: true },
          ]}
          defaultValues={{
            occurred_at: "",
            company_id: "",
            truck: "",
            driver_name: "",
            trips: 0,
            distance_km: 0,
            tons: 0,
            transport_cost: 0,
          }}
        />
      </main>
    </div>
  );
}
