"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardHeader } from "@/components/dashboard-header";
import { useRealtimeRefresh } from "@/components/erp/useRealtimeRefresh";
import { getCostBySource, getDashboardKpis, listFactRows } from "@/lib/erp/service";
import type { ChartPoint, DashboardKpis, ReportRow } from "@/lib/erp/types";

const defaults: DashboardKpis = {
  custo_operacional_total: 0,
  custo_por_tonelada: 0,
  custo_por_metro_perfurado: 0,
  custo_por_furo: 0,
  consumo_diesel: 0,
  disponibilidade_fisica: 0,
};

function currency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}

export default function IndicadoresPage() {
  const [kpis, setKpis] = useState<DashboardKpis>(defaults);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [ranking, setRanking] = useState<ReportRow[]>([]);

  const refresh = useCallback(async () => {
    const [kpiResult, chartResult, rankingResult] = await Promise.all([
      getDashboardKpis({}),
      getCostBySource({}),
      listFactRows({}, 20),
    ]);

    setKpis(kpiResult);
    setChartData(chartResult);
    setRanking(rankingResult);
  }, []);

  useRealtimeRefresh(refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rankingByAmount = useMemo(
    () => [...ranking].sort((a, b) => b.amount - a.amount).slice(0, 10),
    [ranking]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DashboardHeader />
      <main className="mx-auto max-w-screen-2xl space-y-6 px-4 py-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><p className="text-xs text-slate-400">Custo Operacional Total</p><p className="text-2xl font-semibold">{currency(kpis.custo_operacional_total)}</p></article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><p className="text-xs text-slate-400">Custo por Tonelada</p><p className="text-2xl font-semibold">{currency(kpis.custo_por_tonelada)}/t</p></article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><p className="text-xs text-slate-400">Disponibilidade Física</p><p className="text-2xl font-semibold">{kpis.disponibilidade_fisica.toFixed(2)}%</p></article>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Comparativo por Fonte</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip formatter={(v: number) => currency(v)} />
                <Legend />
                <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Ranking de Maiores Custos</h2>
          <div className="overflow-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Fonte</th>
                  <th className="px-3 py-2">Valor</th>
                  <th className="px-3 py-2">Toneladas</th>
                </tr>
              </thead>
              <tbody>
                {rankingByAmount.map((row, i) => (
                  <tr key={`${row.occurred_at}-${row.source}-${i}`} className="border-t border-white/5">
                    <td className="px-3 py-2">{row.occurred_at}</td>
                    <td className="px-3 py-2">{row.source}</td>
                    <td className="px-3 py-2">{currency(row.amount)}</td>
                    <td className="px-3 py-2">{row.tons.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
