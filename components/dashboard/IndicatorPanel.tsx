"use client";

import React from "react";
import DashboardCard from "./DashboardCard";

export default function IndicatorPanel({ data }: { data: any[] }) {
  return (
    <DashboardCard className="h-[340px]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Indicadores de Operação</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Indicadores de Operação</h2>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="h-[72px] rounded-[14px] border border-[#233754] bg-[#091623] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#0A172A] text-white" style={{ color: item.color }}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-slate-400 truncate">{item.label}</p>
                  <p className="mt-1 text-[13px] font-semibold text-white truncate">{item.value}</p>
                  <div className="mt-1 text-[11px] font-semibold" style={{ color: item.color }}>
                    {item.trend}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
