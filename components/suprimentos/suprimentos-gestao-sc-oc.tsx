"use client";

import React from "react";
import { SuprimentosShell } from "@/components/suprimentos/suprimentos-shell";

export function SuprimentosGestaoScOc() {
  return (
    <SuprimentosShell headerTitle="Gestão de SC / OC" activeTab="gestao">
      <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="text-[11px] font-mono" style={{ color: "oklch(0.42 0.03 220)" }}>
          Em construção: cadastro completo de SC, geração automática de OC, filtros e tabela avançada.
        </div>
      </div>
    </SuprimentosShell>
  );
}

