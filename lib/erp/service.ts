import { supabase } from "@/lib/supabase";
import type {
  ChartPoint,
  Company,
  CostCenter,
  DashboardFilters,
  DashboardKpis,
  Equipment,
  EvolutionPoint,
  ReportRow,
} from "@/lib/erp/types";

function applyFactFilters(query: any, filters: DashboardFilters) {
  let q = query;

  if (filters.companyId) q = q.eq("company_id", filters.companyId);
  if (filters.startDate) q = q.gte("occurred_at", filters.startDate);
  if (filters.endDate) q = q.lte("occurred_at", filters.endDate);
  if (filters.costCenterId) q = q.eq("cost_center_id", filters.costCenterId);
  if (filters.equipmentId) q = q.eq("equipment_id", filters.equipmentId);
  if (filters.sector) q = q.eq("sector", filters.sector);

  return q;
}

export async function listCompanies(): Promise<Company[]> {
  const { data, error } = await supabase.from("erp_companies").select("id, name").order("name");
  if (error) throw error;
  return (data ?? []) as Company[];
}

export async function listCostCenters(companyId?: string): Promise<CostCenter[]> {
  let query = supabase.from("erp_cost_centers").select("id, name, sector").order("name");
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CostCenter[];
}

export async function listEquipments(companyId?: string): Promise<Equipment[]> {
  let query = supabase.from("erp_equipments").select("id, name").order("name");
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Equipment[];
}

export async function listSectors(companyId?: string): Promise<string[]> {
  let query = supabase.from("erp_cost_centers").select("sector").not("sector", "is", null);
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query;
  if (error) throw error;

  const sectors = new Set<string>();
  for (const row of data ?? []) {
    if (row.sector) sectors.add(String(row.sector));
  }

  return Array.from(sectors).sort();
}

export async function getDashboardKpis(filters: DashboardFilters): Promise<DashboardKpis> {
  const { data, error } = await supabase.rpc("erp_dashboard_kpis", {
    p_company: filters.companyId ?? null,
    p_start: filters.startDate ?? null,
    p_end: filters.endDate ?? null,
    p_cost_center: filters.costCenterId ?? null,
    p_equipment: filters.equipmentId ?? null,
    p_sector: filters.sector ?? null,
  });

  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as DashboardKpis | undefined;
  return (
    row ?? {
      custo_operacional_total: 0,
      custo_por_tonelada: 0,
      custo_por_metro_perfurado: 0,
      custo_por_furo: 0,
      consumo_diesel: 0,
      disponibilidade_fisica: 0,
    }
  );
}

export async function getCostBySource(filters: DashboardFilters): Promise<ChartPoint[]> {
  const query = supabase
    .from("erp_v_fact_costs")
    .select("source, amount")
    .order("occurred_at", { ascending: true });

  const { data, error } = await applyFactFilters(query, filters);
  if (error) throw error;

  const buckets = new Map<string, number>();
  for (const row of data ?? []) {
    const source = String(row.source ?? "OUTROS");
    const amount = Number(row.amount ?? 0);
    buckets.set(source, (buckets.get(source) ?? 0) + amount);
  }

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
}

export async function getMonthlyEvolution(filters: DashboardFilters): Promise<EvolutionPoint[]> {
  const query = supabase
    .from("erp_v_fact_costs")
    .select("occurred_at, source, amount")
    .order("occurred_at", { ascending: true });

  const { data, error } = await applyFactFilters(query, filters);
  if (error) throw error;

  const map = new Map<string, EvolutionPoint>();

  for (const row of data ?? []) {
    const occurredAt = String(row.occurred_at ?? "");
    const month = occurredAt.slice(0, 7);
    if (!month) continue;

    if (!map.has(month)) {
      map.set(month, {
        month,
        custo: 0,
        diesel: 0,
        perfuracao: 0,
        desmonte: 0,
        logistica: 0,
      });
    }

    const item = map.get(month)!;
    const source = String(row.source ?? "");
    const amount = Number(row.amount ?? 0);

    if (source === "CUSTO_OPERACIONAL") item.custo += amount;
    if (source === "DIESEL") item.diesel += amount;
    if (source === "PERFURACAO") item.perfuracao += amount;
    if (source === "DESMONTE") item.desmonte += amount;
    if (source === "LOGISTICA") item.logistica += amount;
  }

  return Array.from(map.values());
}

export async function listFactRows(filters: DashboardFilters, limit = 100): Promise<ReportRow[]> {
  const query = supabase
    .from("erp_v_fact_costs")
    .select("occurred_at, source, amount, tons, drilled_meters, holes_count, liters")
    .order("occurred_at", { ascending: false })
    .limit(limit);

  const { data, error } = await applyFactFilters(query, filters);
  if (error) throw error;

  const rows = (data ?? []) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    occurred_at: String(row.occurred_at ?? ""),
    source: String(row.source ?? ""),
    amount: Number(row.amount ?? 0),
    tons: Number(row.tons ?? 0),
    drilled_meters: Number(row.drilled_meters ?? 0),
    holes_count: Number(row.holes_count ?? 0),
    liters: Number(row.liters ?? 0),
  }));
}

export async function insertRow(table: string, payload: Record<string, unknown>) {
  const { error } = await supabase.from(table).insert(payload);
  if (error) throw error;
}

export async function updateRow(table: string, id: string, payload: Record<string, unknown>) {
  const { error } = await supabase.from(table).update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteRow(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}
