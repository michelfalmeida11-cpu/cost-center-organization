"use client";

import React, { useMemo, useState } from "react";
import { Bell, CalendarDays, Download, Filter, Search, Upload } from "lucide-react";

import { fioriColors } from "../theme";
import { FioriBreadcrumb, type BreadcrumbItem } from "./FioriBreadcrumb";

export function FioriHeader({
  title,
  breadcrumbItems,
}: {
  title: string;
  breadcrumbItems: BreadcrumbItem[];
}) {
  const [period, setPeriod] = useState("YTD");
  const [project, setProject] = useState<string>("Todos");
  const [equipment, setEquipment] = useState<string>("Todos");
  const [costCenter, setCostCenter] = useState<string>("Todos");
  const [sector, setSector] = useState<string>("Todos");

  const breadcrumbRight = useMemo(() => {
    return (
      <div className="hidden lg:flex items-center gap-3">
        <button
          type="button"
          className="px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition hover:opacity-90"
          style={{
            background: "color-mix(in oklch, var(--fiori-primary) 12%, transparent)",
            border: `1px solid color-mix(in oklch, ${fioriColors.primary} 50%, transparent)`,
            color: fioriColors.primary,
          }}
          title="Atualizar"
        >
          Atualizar
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition hover:opacity-90 flex items-center gap-1"
          style={{
            background: "color-mix(in oklch, ${fioriColors.cards} 70%, transparent)",
            border: `1px solid ${fioriColors.border}`,
            color: fioriColors.text,
          }}
          title="Exportar"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar
        </button>
      </div>
    );
  }, []);

  return (
    <header
      className="sticky top-0 z-40 h-18 md:h-20 px-4 sm:px-6 flex items-center border-b backdrop-blur-md"
      style={{
        background: "color-mix(in oklch, var(--fiori-cards) 62%, transparent)",
        borderColor: fioriColors.border,
      }}
    >
      <div className="w-full flex items-center gap-4">
        <div className="hidden md:block">
          <div className="text-[10px] font-mono uppercase tracking-[0.20em]" style={{ color: "color-mix(in oklch, var(--fiori-text) 60%, transparent)" }}>
            {title}
          </div>
          <div className="text-[12px] font-mono font-semibold" style={{ color: fioriColors.text }}>
            Modern UI base
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <FioriBreadcrumb items={breadcrumbItems} rightSlot={breadcrumbRight} />
        </div>

        <div className="hidden xl:flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: fioriColors.primary }} />
            <input
              aria-label="Campo de pesquisa"
              className="h-10 pl-10 pr-3 rounded-2xl text-[11px] font-mono outline-none"
              style={{
                background: fioriColors.cards,
                border: `1px solid ${fioriColors.border}`,
                color: fioriColors.text,
              }}
              placeholder="Pesquisar..."
            />
          </div>

          <div className="flex items-center gap-2 rounded-2xl px-3 h-10" style={{ background: "color-mix(in oklch, var(--fiori-cards) 85%, transparent)", border: `1px solid ${fioriColors.border}` }}>
            <CalendarDays className="h-4 w-4" style={{ color: fioriColors.primary }} />
            <select
              aria-label="Filtro de período"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent outline-none text-[11px] font-mono"
              style={{ color: fioriColors.text }}
            >
              <option value="YTD">YTD</option>
              <option value="MENSAL">Mensal</option>
              <option value="TRIM">Trimestre</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-2xl px-3 h-10" style={{ background: "color-mix(in oklch, var(--fiori-cards) 85%, transparent)", border: `1px solid ${fioriColors.border}` }}>
            <Filter className="h-4 w-4" style={{ color: fioriColors.primary }} />
            <select
              aria-label="Filtro de projeto"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="bg-transparent outline-none text-[11px] font-mono"
              style={{ color: fioriColors.text }}
            >
              <option>Todos</option>
              <option>Projeto A</option>
              <option>Projeto B</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-2xl px-3 h-10" style={{ background: "color-mix(in oklch, var(--fiori-cards) 85%, transparent)", border: `1px solid ${fioriColors.border}` }}>
            <Bell className="h-4 w-4" style={{ color: fioriColors.primary }} />
            <span className="text-[11px] font-mono font-semibold" style={{ color: fioriColors.text }}>
              3
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-2xl px-3 h-10" style={{ background: "color-mix(in oklch, var(--fiori-cards) 85%, transparent)", border: `1px solid ${fioriColors.border}` }}>
            <Upload className="h-4 w-4" style={{ color: fioriColors.primary }} />
            <span className="text-[11px] font-mono" style={{ color: fioriColors.text }}>
              Theme
            </span>
          </div>

          <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ background: "color-mix(in oklch, var(--fiori-primary) 14%, transparent)", border: `1px solid color-mix(in oklch, ${fioriColors.primary} 35%, transparent)` }}>
            <span className="text-[11px] font-mono font-bold" style={{ color: fioriColors.primary }}>
              U
            </span>
          </div>
        </div>

        {/* Mobile filter row omitted by design base (will be added in next module) */}
      </div>

      {/* CSS variables consumed by module */}
      <style jsx>{`
        :global(:root) {
          --fiori-primary: ${fioriColors.primary};
          --fiori-cards: ${fioriColors.cards};
          --fiori-border: ${fioriColors.border};
          --fiori-text: ${fioriColors.text};
        }
      `}</style>
    </header>
  );
}

