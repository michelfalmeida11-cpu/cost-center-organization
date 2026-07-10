"use client";

import React from "react";
import DashboardCard from "./DashboardCard";

export default function RankingPanel({ data }: { data: any[] }) {
  return (
    <DashboardCard>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.1667em] text-slate-400">Ranking</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Ranking de Equipamentos</h2>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {data.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-200 truncate">{item.label}</p>
              <span className="text-sm font-semibold text-white">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#0B1221]">
              <div className="h-full rounded-full" style={{ width: `${item.progress}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
