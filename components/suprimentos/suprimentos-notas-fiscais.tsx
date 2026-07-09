"use client";

import React from "react";
import { SuprimentosShell } from "@/components/suprimentos/suprimentos-shell";

export function SuprimentosNotasFiscais() {
  return (
    <SuprimentosShell headerTitle="Notas Fiscais" activeTab="notas">
      <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="text-[11px] font-mono" style={{ color: "oklch(0.42 0.03 220)" }}>
          Em construção: controle completo de XML/PDF, statuses, indicadores e alertas de divergência.
        </div>
      </div>
    </SuprimentosShell>
  );
}

