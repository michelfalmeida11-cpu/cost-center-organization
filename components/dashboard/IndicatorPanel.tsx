"use client";

import React from "react";
import DashboardCard from "./DashboardCard";

export default function IndicatorPanel({ data }: { data: any[] }) {
  return (
    <DashboardCard>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.1667em] text-slate-400">Indicadores de Operação</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Indicadores de Operação</h2>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[16px] border border-[#233754] bg-[#0E1B34] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111C2E]" style={{ color: item.color }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold" style={{ color: item.color }}>{item.trend}</p>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
