import React from "react";

import { fioriColors } from "../theme";

export function FioriFooter({
  version,
  userLabel,
  databaseLabel,
  environmentLabel,
  year,
}: {
  version: string;
  userLabel: string;
  databaseLabel: string;
  environmentLabel: string;
  year: number;
}) {
  return (
    <footer
      className="hidden md:flex items-center justify-between px-6 h-14 border-t"
      style={{
        background: "color-mix(in oklch, var(--fiori-cards) 92%, transparent)",
        borderColor: fioriColors.border,
      }}
    >
      <div className="flex items-center gap-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.20em]" style={{ color: "color-mix(in oklch, var(--fiori-text) 55%, transparent)" }}>
            Versão
          </div>
          <div className="text-[11px] font-mono font-semibold" style={{ color: fioriColors.text }}>
            {version}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.20em]" style={{ color: "color-mix(in oklch, var(--fiori-text) 55%, transparent)" }}>
            Usuário
          </div>
          <div className="text-[11px] font-mono font-semibold" style={{ color: fioriColors.text }}>
            {userLabel}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.20em]" style={{ color: "color-mix(in oklch, var(--fiori-text) 55%, transparent)" }}>
            Banco conectado
          </div>
          <div className="text-[11px] font-mono font-semibold" style={{ color: fioriColors.text }}>
            {databaseLabel}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.20em]" style={{ color: "color-mix(in oklch, var(--fiori-text) 55%, transparent)" }}>
            Ambiente
          </div>
          <div className="text-[11px] font-mono font-semibold" style={{ color: fioriColors.text }}>
            {environmentLabel}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.20em]" style={{ color: "color-mix(in oklch, var(--fiori-text) 55%, transparent)" }}>
            Ano
          </div>
          <div className="text-[11px] font-mono font-semibold" style={{ color: fioriColors.text }}>
            {year}
          </div>
        </div>
      </div>
    </footer>
  );
}

