export type Uuid = string;

export type DashboardFilters = {
  companyId?: Uuid;
  startDate?: string;
  endDate?: string;
  costCenterId?: Uuid;
  equipmentId?: Uuid;
  sector?: string;
};

export type DashboardKpis = {
  custo_operacional_total: number;
  custo_por_tonelada: number;
  custo_por_metro_perfurado: number;
  custo_por_furo: number;
  consumo_diesel: number;
  disponibilidade_fisica: number;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type EvolutionPoint = {
  month: string;
  custo: number;
  diesel: number;
  perfuracao: number;
  desmonte: number;
  logistica: number;
};

export type Company = {
  id: Uuid;
  name: string;
};

export type CostCenter = {
  id: Uuid;
  name: string;
  sector: string | null;
};

export type Equipment = {
  id: Uuid;
  name: string;
};

export type ReportRow = {
  occurred_at: string;
  source: string;
  amount: number;
  tons: number;
  drilled_meters: number;
  holes_count: number;
  liters: number;
};
