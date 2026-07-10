"use client";

import React from "react";
import DashboardCard from "./DashboardCard";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import ChartTooltip from "./ChartTooltip";
import ActiveDot from "./ActiveDot";

export default function EvolutionPanel({ data, activeMetric }: { data: any[]; activeMetric?: string | null }) {
  return (
    <DashboardCard className="h-full min-h-[340px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Evolução Mensal</p>
          <h2 className="mt-3 text-xl font-semibold text-white">Evolução Mensal dos Custos (R$)</h2>
        </div>
      </div>
      <div className="mt-5 h-[270px] 2xl:h-[282px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 28, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientEquipamentos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.44} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientDiesel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FACC15" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#FACC15" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientPerfuração" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#1C2A42" strokeDasharray="4 8" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, letterSpacing: '0.01em' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, letterSpacing: '0.01em' }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ color: '#94A3B8', fontSize: 12, paddingTop: 2 }} />
            <Line type="monotone" dataKey="Equipamentos" stroke="#3B82F6" strokeWidth={activeMetric === 'Equipamentos' ? 4 : 3} dot={false} activeDot={<ActiveDot />} strokeOpacity={activeMetric && activeMetric !== 'Equipamentos' ? 0.28 : 1} />
            <Line type="monotone" dataKey="Diesel" stroke="#FACC15" strokeWidth={activeMetric === 'Diesel' ? 4 : 3} dot={false} activeDot={<ActiveDot />} strokeOpacity={activeMetric && activeMetric !== 'Diesel' ? 0.28 : 1} />
            <Line type="monotone" dataKey="Perfuração" stroke="#22D3EE" strokeWidth={activeMetric === 'Perfuração' ? 4 : 3} dot={false} activeDot={<ActiveDot />} strokeOpacity={activeMetric && activeMetric !== 'Perfuração' ? 0.28 : 1} />
            <Line type="monotone" dataKey="Desmonte" stroke="#A855F7" strokeWidth={activeMetric === 'Desmonte' ? 4 : 3} dot={false} activeDot={<ActiveDot />} strokeOpacity={activeMetric && activeMetric !== 'Desmonte' ? 0.28 : 1} />
            <Line type="monotone" dataKey="Logística" stroke="#4ADE80" strokeWidth={activeMetric === 'Logística' ? 4 : 3} dot={false} activeDot={<ActiveDot />} strokeOpacity={activeMetric && activeMetric !== 'Logística' ? 0.28 : 1} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
