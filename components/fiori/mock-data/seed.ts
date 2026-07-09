import type { ExecutiveDashboardMock, SparkPoint, Trend } from "./types";

function spark(n: number, base: number, variance: number): SparkPoint[] {
  const arr: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    const wave = Math.sin(t * Math.PI * 1.2) * variance * 0.6;
    const drift = (t - 0.5) * variance * 0.9;
    arr.push(Math.max(0, base + wave + drift));
  }
  return arr;
}

function trendByDelta(values: number[]): Trend {
  if (values.length < 2) return "flat";
  const first = values[0];
  const last = values[values.length - 1];
  const delta = (last - first) / Math.max(1e-9, first);
  if (delta > 0.05) return "up";
  if (delta < -0.05) return "down";
  return "flat";
}

function pctTone(p: number): "success" | "warning" | "danger" | "info" {
  // heuristic
  if (p >= 12) return "success";
  if (p <= -12) return "danger";
  if (Math.abs(p) > 5) return "warning";
  return "info";
}

export function getExecutiveDashboardMock(): ExecutiveDashboardMock {
  const kpiLabels = [
    { id: "kpi-01", label: "Custo Operacional Total", value: "R$ 12.48M", comparePct: -3.2, compareLabel: "vs. Mês" },
    { id: "kpi-02", label: "Custo por Tonelada", value: "R$ 86.41", comparePct: 1.7, compareLabel: "vs. Mês" },
    { id: "kpi-03", label: "Custo por Metro Perfurado", value: "R$ 412.90", comparePct: -2.1, compareLabel: "vs. Mês" },
    { id: "kpi-04", label: "Custo por Furo", value: "R$ 38.65", comparePct: 4.8, compareLabel: "vs. Mês" },
    { id: "kpi-05", label: "Consumo Diesel", value: "18.2k L", comparePct: 2.4, compareLabel: "vs. Mês" },
    { id: "kpi-06", label: "Disponibilidade Física", value: "97.6%", comparePct: 0.6, compareLabel: "vs. Mês" },
    { id: "kpi-07", label: "MTBF", value: "312 h", comparePct: 6.1, compareLabel: "vs. Mês" },
    { id: "kpi-08", label: "MTTR", value: "9.4 h", comparePct: -5.0, compareLabel: "vs. Mês" },
  ] as const;

  const kpis = kpiLabels.map((k, idx) => {
    const base = 30 + idx * 6;
    const variance = 16 + idx * 1.8;
    const values = spark(16, base, variance);
    const tr = trendByDelta(values);

    return {
      id: k.id,
      label: k.label,
      value: k.value,
      compareLabel: k.compareLabel,
      comparePct: k.comparePct,
      trend: tr,
      sparkline: values,
    };
  });

  const costParticipationRaw = [
    { id: "cp-equip", label: "Equipamentos", total: "R$ 4.21M", participationPct: 34.6, trend: "up" as Trend },
    { id: "cp-diesel", label: "Diesel", total: "R$ 2.63M", participationPct: 21.7, trend: "down" as Trend },
    { id: "cp-perf", label: "Perfuração", total: "R$ 1.88M", participationPct: 15.5, trend: "flat" as Trend },
    { id: "cp-desm", label: "Desmonte", total: "R$ 1.34M", participationPct: 11.0, trend: "up" as Trend },
    { id: "cp-log", label: "Logística", total: "R$ 1.46M", participationPct: 12.0, trend: "down" as Trend },
  ];

  const costParticipation = costParticipationRaw.map((c, idx) => {
    const base = 20 + idx * 4;
    const variance = 12 + idx * 2;
    const values = spark(14, base, variance);
    const pTone = pctTone(c.participationPct - 20);

    return {
      id: c.id,
      label: c.label,
      total: c.total,
      participationPct: c.participationPct,
      trend: c.trend,
      sparkline: values,
      badge: {
        label:
          c.trend === "up"
            ? "Tendência ↑"
            : c.trend === "down"
              ? "Tendência ↓"
              : "Estável",
        tone: pTone,
      },
    };
  });

  return {
    kpis,
    costParticipation,
    pie: {
      name: "Participação dos Custos",
      items: costParticipation.map((c) => ({ label: c.label, value: c.participationPct })),
    },
    monthlyEvolution: {
      months: [
        "J-12","J-11","J-10","J-9","J-8","J-7","J-6","J-5","J-4","J-3","J-2","J-1",
      ],
      series: spark(12, 120, 48).map((v) => Math.round(v)),
    },
    top10Expenses: {
      items: [
        { category: "Diesel — Equip. A", value: 540_000, pct: 18.3 },
        { category: "Perfuração — Serviço", value: 410_000, pct: 13.9 },
        { category: "Desmonte — Explosivos", value: 360_000, pct: 12.2 },
        { category: "Logística — Fretes", value: 295_000, pct: 10.0 },
        { category: "Manutenção — Peças", value: 240_000, pct: 8.1 },
        { category: "Energia — Operação", value: 210_000, pct: 7.1 },
        { category: "Operação — Insumos", value: 185_000, pct: 6.3 },
        { category: "Equipamentos — Contratos", value: 160_000, pct: 5.4 },
        { category: "Perfuração — Ferramentas", value: 130_000, pct: 4.4 },
        { category: "Logística — Acessórios", value: 118_000, pct: 4.0 },
      ],
    },
    operationalIndicators: [
      { id: "op-01", label: "Gauge Diesel", unit: "%", meta: 92, realized: 95.4, efficiencyLabel: "+3.4pp" },
      { id: "op-02", label: "Produção", unit: "Ton", meta: 28_000, realized: 30_100, efficiencyLabel: "+7.5%" },
      { id: "op-03", label: "Disponibilidade Física", unit: "%", meta: 96, realized: 97.6, efficiencyLabel: "+1.6pp" },
    ],
    ranking: {
      rows: [
        {
          id: "r-01",
          equipamento: "Escavadeira EX-01",
          horasTrabalhadas: 812,
          horasParadas: 22,
          disponibilidadePct: 97.4,
          custo: "R$ 1.12M",
          mtbf: "268 h",
          mttr: "8.9 h",
          status: "OK",
        },
        {
          id: "r-02",
          equipamento: "Perf. PF-02",
          horasTrabalhadas: 775,
          horasParadas: 41,
          disponibilidadePct: 94.9,
          custo: "R$ 860k",
          mtbf: "214 h",
          mttr: "11.7 h",
          status: "ATENÇÃO",
        },
        {
          id: "r-03",
          equipamento: "Caminhão TR-07",
          horasTrabalhadas: 734,
          horasParadas: 58,
          disponibilidadePct: 92.7,
          custo: "R$ 790k",
          mtbf: "188 h",
          mttr: "14.6 h",
          status: "ATENÇÃO",
        },
        {
          id: "r-04",
          equipamento: "Trator TD-03",
          horasTrabalhadas: 690,
          horasParadas: 92,
          disponibilidadePct: 88.2,
          custo: "R$ 650k",
          mtbf: "142 h",
          mttr: "19.8 h",
          status: "CRÍTICO",
        },
        {
          id: "r-05",
          equipamento: "Carregadeira CL-05",
          horasTrabalhadas: 652,
          horasParadas: 80,
          disponibilidadePct: 89.1,
          custo: "R$ 612k",
          mtbf: "156 h",
          mttr: "17.3 h",
          status: "CRÍTICO",
        },
      ],
    },
    alerts: {
      critical: [
        {
          id: "a-01",
          severity: "critical",
          title: "Equipamento parado",
          description: "Parada não planejada detectada no equipamento TD-03 (últimas 3h).",
          time: "Agora",
          equipment: "Trator TD-03",
        },
        {
          id: "a-02",
          severity: "critical",
          title: "Diesel acima da meta",
          description: "Consumo diesel acima de 10% no turno noturno (PF-02).",
          time: "Há 1h",
          equipment: "Perf. PF-02",
        },
      ],
      medium: [
        {
          id: "a-03",
          severity: "medium",
          title: "Produção abaixo da meta",
          description: "Indicador de produção 2.1% abaixo da meta parcial do dia.",
          time: "Há 3h",
        },
        {
          id: "a-04",
          severity: "medium",
          title: "Disponibilidade abaixo da meta",
          description: "Disponibilidade do grupo de perfuração 94.9% (meta 96%).",
          time: "Há 4h",
        },
      ],
      info: [
        {
          id: "a-05",
          severity: "info",
          title: "Estoque crítico",
          description: "Sinalização de estoque mínimo para peças de manutenção (CA-05).",
          time: "Ontem",
        },
      ],
    },
  };
}

