"use client";

import React from "react";
import DashboardCard from "./DashboardCard";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import ChartTooltip from "./ChartTooltip";
import ActiveDot from "./ActiveDot";

export default function EvolutionPanel({ data, activeMetric }: { data: any[]; activeMetric?: string | null }) {
  return (
    <DashboardCard>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.1667em] text-slate-400">Evolução Mensal</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Evolução Mensal dos Custos (R$)</h2>
        </div>
      </div>
      <div className="mt-6 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#1F2D46" strokeDasharray="3 6" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ color: "#94A3B8", fontSize: 12, paddingTop: 12 }} />
            <Line type="monotone" dataKey="Equipamentos" stroke="#3B82F6" strokeWidth={activeMetric === 'Equipamentos' ? 4 : 2} dot={false} activeDot={<ActiveDot />} strokeOpacity={activeMetric && activeMetric !== 'Equipamentos' ? 0.25 : 1} />
            <Line type="monotone" dataKey="Diesel" stroke="#FACC15" strokeWidth={activeMetric === 'Diesel' ? 4 : 2} dot={false} activeDot={<ActiveDot />} strokeOpacity={activeMetric && activeMetric !== 'Diesel' ? 0.25 : 1} />
            <Line type="monotone" dataKey="Perfuração" stroke="#22D3EE" strokeWidth={activeMetric === 'Perfuração' ? 4 : 2} dot={false} activeDot={<ActiveDot />} strokeOpacity={activeMetric && activeMetric !== 'Perfuração' ? 0.25 : 1} />
            <Line type="monotone" dataKey="Desmonte" stroke="#A855F7" strokeWidth={activeMetric === 'Desmonte' ? 4 : 2} dot={false} activeDot={<ActiveDot />} strokeOpacity={activeMetric && activeMetric !== 'Desmonte' ? 0.25 : 1} />
            <Line type="monotone" dataKey="Logística" stroke="#4ADE80" strokeWidth={activeMetric === 'Logística' ? 4 : 2} dot={false} activeDot={<ActiveDot />} strokeOpacity={activeMetric && activeMetric !== 'Logística' ? 0.25 : 1} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
