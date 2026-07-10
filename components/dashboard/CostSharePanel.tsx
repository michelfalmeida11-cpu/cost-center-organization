"use client";

import React from "react";
import DashboardCard from "./DashboardCard";
import ApexChart from "./ApexChart";
import type { ApexOptions } from "apexcharts";
import { DollarSign } from "lucide-react";

export default function CostSharePanel({ data, total, visible = new Set(), onToggle }: { data: any[]; total: string; visible?: Set<string>; onToggle?: (name: string) => void }) {
  const visibleData = data.filter((item) => visible.has(item.name));
  const donutOptions: ApexOptions = {
    chart: { sparkline: { enabled: true }, background: "transparent" },
    colors: visibleData.map((item) => item.color),
    labels: visibleData.map((item) => item.name),
    legend: { show: false },
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "78%",
          labels: { show: false },
        },
      },
    },
    tooltip: {
      theme: "dark",
      y: { formatter: (value: number) => `${value.toFixed(2).replace('.', ',')}%` },
    },
  };

  return (
    <DashboardCard className="h-[340px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.1667em] text-slate-400">Participação dos Custos</p>
          <h2 className="mt-3 text-xl font-semibold text-white">Custo Total</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-[12px] border border-white/5 bg-[#0F1B2D] px-4 py-2 text-sm text-slate-200">{total}</div>
      </div>

      <div className="mt-5 grid h-[268px] gap-5 xl:grid-cols-[250px_1fr]">
        <div className="relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[14px] bg-[#0F1B2D] p-4">
          <div className="relative z-10 flex flex-col items-center justify-center text-center text-slate-100">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#111C2E]">
              <DollarSign className="h-5 w-5 text-[#2F80ED]" />
            </div>
            <div className="h-[164px] w-[164px]">
              <ApexChart
                type="donut"
                height={164}
                series={visibleData.map((item) => item.value)}
                options={donutOptions}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[11px] font-semibold text-white">R$ 8.764.520,45</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">Custo Total</p>
            </div>
          </div>
        </div>

        <div className="grid h-full content-between gap-2.5">
          {data.map((item) => (
            <button key={item.name} type="button" onClick={() => onToggle?.(item.name)} className={`flex items-center justify-between gap-4 rounded-[14px] border border-white/5 bg-[#0F1B2D] px-4 py-3 ${!visible.has(item.name) ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                <span className="text-[13px] text-slate-200">{item.name}</span>
              </div>
              <span className="text-[13px] font-medium text-white">{item.value.toFixed(2).replace('.', ',')}%</span>
            </button>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
