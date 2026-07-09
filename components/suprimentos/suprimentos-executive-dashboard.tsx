"use client";

import React from "react";
import { SuprimentosShell } from "@/components/suprimentos/suprimentos-shell";

export function SuprimentosExecutiveDashboard() {
  return (
    <SuprimentosShell headerTitle="Dashboard Executivo — Suprimentos" activeTab="dashboard">
      <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="text-[11px] font-mono" style={{ color: "oklch(0.42 0.03 220)" }}>
          Em construção: KPIs premium, gráficos (Recharts), tabelas e alertas em tempo real.
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total SC", value: "—" },
            { label: "Total OC", value: "—" },
            { label: "Valor Solicitado", value: "—" },
            { label: "Valor Comprado", value: "—" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl p-4" style={{ background: "oklch(0.105 0.017 240)", border: "1px solid oklch(0.20 0.02 240)" }}>
              <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "oklch(0.38 0.025 220)" }}>{k.label}</p>
              <p className="text-lg font-mono font-bold" style={{ color: "oklch(0.94 0.018 195)" }}>{k.value}</p>
            </div>
          ))}
        </div>
      </div>
    </SuprimentosShell>
  );
}

