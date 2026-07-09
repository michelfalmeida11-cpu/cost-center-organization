"use client";

import React from "react";
import { SuprimentosShell } from "@/components/suprimentos/suprimentos-shell";

export function SuprimentosFornecedores() {
  return (
    <SuprimentosShell headerTitle="Fornecedores" activeTab="fornecedores">
      <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="text-[11px] font-mono" style={{ color: "oklch(0.42 0.03 220)" }}>
          Em construção: cadastro completo, indicadores (qualidade/atrasos), ranking e bloqueio.
        </div>
      </div>
    </SuprimentosShell>
  );
}

