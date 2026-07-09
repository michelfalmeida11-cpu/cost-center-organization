"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Filter,
  Search,
  Bell,
  CalendarDays,
  Download,
  Upload,
  Settings,
  Users,
  Gauge,
  Activity,
  DollarSign,
  Truck,
  Fuel,
  PieChart,
  BarChart3,
  Boxes,
  Package,
  Zap,
  Truck as TruckIcon,
} from "lucide-react";

import { fioriColors } from "../theme";

export type FioriSidebarMenuItem = {
  key: string;
  label: string;
  icon: React.ElementType;
  href: string;
};

const ICON_FALLBACK: React.ElementType = LayoutDashboard;

export function FioriSidebar({
  menus,
  activeKey,
  brandLabel,
  brandImageSrc,
  onSearch,
  footer,
}: {
  menus: FioriSidebarMenuItem[];
  activeKey: string;
  brandLabel: string;
  brandImageSrc: string;
  onSearch?: (q: string) => void;
  footer: {
    version: string;
    environmentLabel: string;
    userLabel: string;
  };
}) {
  const [collapsed, setCollapsed] = useState(false);
  const IconMap = useMemo(
    () => new Map<string, React.ElementType>(menus.map((m) => [m.key, m.icon || ICON_FALLBACK])),
    [menus]
  );

  return (
    <aside
      className="relative md:sticky top-0 h-[100vh]"
      style={{ width: collapsed ? 88 : 280, transition: "width 220ms ease" }}
    >
      <div
        className="h-full flex flex-col"
        style={{ background: fioriColors.sidebar, borderRight: `1px solid ${fioriColors.border}` }}
      >
        <div className="px-5 py-5 flex items-center gap-3">
          <img
            src={brandImageSrc}
            alt={brandLabel}
            className="h-10 w-10 rounded-2xl object-cover"
            style={{ border: `1px solid color-mix(in oklch, ${fioriColors.primary} 35%, transparent)` }}
          />

          <div
            className="min-w-0"
            style={{ opacity: collapsed ? 0 : 1, transition: "opacity 160ms ease" }}
          >
            <div className="text-[12px] font-mono font-bold" style={{ color: fioriColors.text }}>
              {brandLabel}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="ml-auto rounded-2xl h-9 w-9 flex items-center justify-center"
            style={{
              background: "color-mix(in oklch, var(--fiori-cards) 70%, transparent)",
              border: `1px solid ${fioriColors.border}`,
            }}
            aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
            title={collapsed ? "Expandir" : "Recolher"}
          >
            <div style={{ transition: "transform 200ms ease", transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}>
              <Filter className="h-4 w-4" style={{ color: fioriColors.primary }} />
            </div>
          </button>
        </div>

        <div className="px-5 pb-4">
          <div className="relative" style={{ opacity: collapsed ? 0 : 1, transition: "opacity 160ms ease" }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: fioriColors.primary }} />
            <input
              aria-label="Pesquisar no menu"
              className="h-10 w-full rounded-2xl pl-10 pr-3 text-[11px] font-mono outline-none"
              style={{ background: fioriColors.sidebar, border: `1px solid ${fioriColors.border}`, color: fioriColors.text }}
              placeholder="Pesquisar..."
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>

        <div className="px-5">
          <div style={{ height: 1, background: fioriColors.border }} />
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <nav className="px-2">
            {menus.map((item) => {
              const active = item.key === activeKey;
              const Icon = IconMap.get(item.key) || ICON_FALLBACK;
              return (
                <Link key={item.key} href={item.href} className="block" title={collapsed ? item.label : undefined}>
                  <div
                    className="relative mx-1 my-1 rounded-2xl"
                    style={{
                      background: active ? `color-mix(in oklch, ${fioriColors.primary} 12%, transparent)` : "transparent",
                      border: active
                        ? `1px solid color-mix(in oklch, ${fioriColors.primary} 35%, transparent)`
                        : `1px solid transparent`,
                    }}
                  >
                    <div
                      className="flex items-center gap-3 px-3 py-3"
                      style={{ transition: "background 160ms ease, border-color 160ms ease" }}
                    >
                      <div
                        className="h-9 w-9 rounded-2xl flex items-center justify-center shrink-0"
                        style={{
                          background: active
                            ? `color-mix(in oklch, ${fioriColors.primary} 18%, transparent)`
                            : `color-mix(in oklch, ${fioriColors.cards} 55%, transparent)`,
                          border: `1px solid ${fioriColors.border}`,
                        }}
                      >
                        <Icon
                          className="h-4 w-4"
                          style={{
                            color: active
                              ? fioriColors.primary
                              : "color-mix(in oklch, var(--fiori-text) 70%, transparent)",
                          }}
                        />
                      </div>

                      {!collapsed && (
                        <span className="text-[11px] font-mono font-semibold whitespace-nowrap" style={{ color: fioriColors.text }}>
                          {item.label}
                        </span>
                      )}
                    </div>

                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        opacity: active ? 0.9 : 0,
                        transition: "opacity 160ms ease",
                        background: `radial-gradient(circle at 25% 50%, ${fioriColors.primary}33 0%, transparent 60%)`,
                      }}
                    />
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-5 py-4">
          <div className="flex flex-col gap-3" style={{ opacity: collapsed ? 0.92 : 1, transition: "opacity 160ms ease" }}>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.20em]" style={{ color: "color-mix(in oklch, var(--fiori-text) 55%, transparent)" }}>
                Versão
              </div>
              <div className="text-[11px] font-mono font-semibold" style={{ color: fioriColors.text }}>
                {footer.version}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.20em]" style={{ color: "color-mix(in oklch, var(--fiori-text) 55%, transparent)" }}>
                Ambiente
              </div>
              <div className="text-[11px] font-mono font-semibold" style={{ color: fioriColors.text }}>
                {footer.environmentLabel}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.20em]" style={{ color: "color-mix(in oklch, var(--fiori-text) 55%, transparent)" }}>
                Usuário
              </div>
              <div className="text-[11px] font-mono font-semibold" style={{ color: fioriColors.text }}>
                {footer.userLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

