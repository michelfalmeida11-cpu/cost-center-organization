"use client";

import React from "react";
import { SuprimentosShell } from "@/components/suprimentos/suprimentos-shell";

export function SuprimentosContratos() {
  return (
    <SuprimentosShell headerTitle="Contratos" activeTab="contratos">
      <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="text-[11px] font-mono" style={{ color: "oklch(0.42 0.03 220)" }}>
          Em construção: cadastro, status de vigência, saldo contratual e alertas automáticos.
        </div>
      </div>
    </SuprimentosShell>
  );
}

