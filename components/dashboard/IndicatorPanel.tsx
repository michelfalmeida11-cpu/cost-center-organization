"use client";

import React from "react";
import DashboardCard from "./DashboardCard";

export default function IndicatorPanel({ data }: { data: any[] }) {
  return (
    <DashboardCard className="min-h-[340px]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Indicadores de Operação</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Indicadores de Operação</h2>
        </div>
      </div>
      <div className="mt-6 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[20px] border border-[#233754] bg-[#091623] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#0A172A] text-white" style={{ color: item.color }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 truncate">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white truncate">{item.value}</p>
                </div>
              </div>
              <div className="mt-4 inline-flex items-center rounded-full bg-white/5 px-3 py-2 text-sm font-semibold" style={{ color: item.color }}>
                {item.trend}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
