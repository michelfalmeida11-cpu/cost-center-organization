import { DashboardHeader } from "@/components/dashboard-header";
import { CrudPage } from "@/components/erp/CrudPage";

export default function CustosOperacionaisPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DashboardHeader />
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        <CrudPage
          title="Custos Operacionais"
          description="Cadastro operacional com cálculo automático de valor total (quantity x unit_value) no banco."
          table="erp_operational_costs"
          orderBy="occurred_at"
          fields={[
            { key: "occurred_at", label: "Data", type: "date", required: true },
            { key: "company_id", label: "Empresa", required: true },
            { key: "cost_center_id", label: "Centro de Custo" },
            { key: "equipment_id", label: "Equipamento" },
            { key: "category_id", label: "Categoria" },
            { key: "cost_type_id", label: "Tipo de Custo" },
            { key: "quantity", label: "Quantidade", type: "number", required: true },
            { key: "unit", label: "Unidade" },
            { key: "unit_value", label: "Valor Unitário", type: "number", required: true },
            { key: "notes", label: "Observação", type: "textarea" },
          ]}
          defaultValues={{
            occurred_at: "",
            company_id: "",
            cost_center_id: "",
            equipment_id: "",
            category_id: "",
            cost_type_id: "",
            quantity: 0,
            unit: "",
            unit_value: 0,
            notes: "",
          }}
        />
      </main>
    </div>
  );
}
