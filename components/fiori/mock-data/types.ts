export type Trend = "up" | "down" | "flat";

export type SparkPoint = number;

export interface KPIBase {
  id: string;
  label: string;
  value: string;
  compareLabel: string;
  comparePct: number; // e.g. -3.2
  trend: Trend;
  sparkline: SparkPoint[];
}

export interface CostParticipationCard {
  id: string;
  label: string;
  total: string;
  participationPct: number;
  trend: Trend;
  sparkline: SparkPoint[];
  badge: {
    label: string;
    tone: "info" | "success" | "warning" | "danger";
  };
}

export interface OperationalIndicator {
  id: string;
  label: string;
  unit: string;
  meta: number;
  realized: number;
  efficiencyLabel?: string;
}

export interface RankingEquipmentRow {
  id: string;
  equipamento: string;
  horasTrabalhadas: number;
  horasParadas: number;
  disponibilidadePct: number;
  custo: string;
  mtbf: string;
  mttr: string;
  status: "OK" | "ATENÇÃO" | "CRÍTICO";
}

export interface AlertItem {
  id: string;
  severity: "critical" | "medium" | "info";
  title: string;
  description: string;
  time: string;
  equipment?: string;
}

export interface ExecutiveDashboardMock {
  kpis: KPIBase[];
  costParticipation: CostParticipationCard[];
  pie: {
    name: string;
    items: Array<{ label: string; value: number }>;
  };
  monthlyEvolution: {
    months: string[];
    series: number[];
  };
  top10Expenses: {
    items: Array<{ category: string; value: number; pct: number }>;
  };
  operationalIndicators: OperationalIndicator[];
  ranking: {
    rows: RankingEquipmentRow[];
  };
  alerts: {
    critical: AlertItem[];
    medium: AlertItem[];
    info: AlertItem[];
  };
}

