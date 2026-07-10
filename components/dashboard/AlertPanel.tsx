"use client";

import React from "react";
import DashboardCard from "./DashboardCard";

export default function AlertPanel({ data }: { data: any[] }) {
  return (
    <div className="grid auto-rows-fr gap-5 md:grid-cols-2">
      {data.map((item) => {
        const Icon = item.icon;
        return (
          <DashboardCard key={item.label} className="h-[86px] !rounded-[16px] !p-4" style={{ background: item.bg, borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-start gap-4 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/10">
                <Icon size={18} weight="regular" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1667em] text-slate-200">{item.label}</p>
                <p className="mt-1.5 text-[13px] leading-5 text-slate-100">{item.description}</p>
              </div>
            </div>
          </DashboardCard>
        );
      })}
    </div>
  );
}
