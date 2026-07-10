"use client";

import React from "react";
import DashboardCard from "./DashboardCard";

export default function RankingPanel({ data }: { data: any[] }) {
  return (
    <DashboardCard className="h-[340px]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.1667em] text-slate-400">Custo por Equipamento (R$)</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Maiores custos por equipamento</h2>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {data.map((item) => (
          <div key={item.label} className="space-y-2.5">
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <p className="truncate text-slate-200">{item.label}</p>
              <span className="font-medium text-slate-200">{item.value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#0B1221]">
              <div className="h-full rounded-full" style={{ width: `${item.progress}%`, background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}CC 100%)` }} />
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
