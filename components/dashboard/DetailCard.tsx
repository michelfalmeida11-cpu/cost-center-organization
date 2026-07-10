"use client";

import React from "react";
import DashboardCard from "../dashboard/DashboardCard";
import Sparkline from "../dashboard/Sparkline";

export default function DetailCard({ item }: { item: any }) {
  const Icon = item.icon;
  return (
    <DashboardCard className="h-[130px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.1667em] text-slate-400">{item.label}</p>
          <p className="mt-2 text-[18px] font-semibold leading-tight text-white xl:text-[20px]">{item.value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F1B2D] text-white">
          <Icon className="h-6 w-6" style={{ color: item.color }} />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[13px] text-slate-400">{item.percent} do total</p>
      </div>
      <div className="mt-3 rounded-[14px] bg-[#0F1B2D] p-1.5">
        <Sparkline data={item.series} color={item.color} height={26} />
      </div>
    </DashboardCard>
  );
}
