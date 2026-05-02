"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Download,
  RefreshCw,
  Settings,
  ChevronDown,
  Calendar,
  Activity,
  Wifi,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PERIODS = [
  "Janeiro 2026",
  "Fevereiro 2026",
  "Março 2026",
  "Abril 2026",
  "YTD — Jan/Abr 2026",
];

export function DashboardHeader() {
  const [period, setPeriod] = useState("YTD — Jan/Abr 2026");
  const [refreshing, setRefreshing] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[oklch(0.75_0.20_185/0.25)] bg-[oklch(0.07_0.015_240/0.95)] backdrop-blur-md">
      {/* top accent bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[oklch(0.75_0.20_185)] to-transparent opacity-80" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">

        {/* ── Brand ── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative h-9 w-20 shrink-0">
            <Image
              src="/avg-logo.png"
              alt="Grupo AVG"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span
              className="text-[11px] font-mono font-semibold tracking-[0.2em] uppercase"
              style={{ color: "oklch(0.75 0.20 185)", textShadow: "0 0 10px oklch(0.75 0.20 185 / 0.6)" }}
            >
              AVG
            </span>
            <span className="text-[10px] text-muted-foreground tracking-widest hidden md:block">
              Mina do Brumado
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-[oklch(0.75_0.20_185/0.25)]" />

        {/* ── Nav label ── */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <LayoutDashboard className="h-3.5 w-3.5 text-[oklch(0.75_0.20_185)]" />
          <span className="text-xs font-mono font-medium tracking-wide">
            GESTÃO DE CENTRO DE CUSTO
          </span>
        </div>

        <div className="flex-1" />

        {/* ── Live indicator ── */}
        <div className="hidden md:flex items-center gap-1.5 mr-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.65_0.20_145)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[oklch(0.65_0.20_145)]" />
          </span>
          <span className="text-[10px] font-mono text-[oklch(0.65_0.20_145)] tracking-widest">LIVE</span>
        </div>

        {/* ── Period selector ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 border-[oklch(0.75_0.20_185/0.35)] bg-[oklch(0.75_0.20_185/0.07)] text-[oklch(0.75_0.20_185)] hover:bg-[oklch(0.75_0.20_185/0.15)] font-mono"
            >
              <Calendar className="h-3.5 w-3.5" />
              {period}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-[oklch(0.10_0.018_240)] border-[oklch(0.75_0.20_185/0.25)]"
          >
            {PERIODS.map((p) => (
              <DropdownMenuItem
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs font-mono cursor-pointer ${p === period ? "text-[oklch(0.75_0.20_185)]" : "text-muted-foreground"}`}
              >
                {p === period && <span className="mr-2 text-[oklch(0.75_0.20_185)]">›</span>}
                {p}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ── Refresh ── */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-[oklch(0.75_0.20_185)] hover:bg-[oklch(0.75_0.20_185/0.10)]"
          onClick={handleRefresh}
          title="Atualizar dados"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[oklch(0.75_0.20_185)]" : ""}`} />
          <span className="sr-only">Atualizar dados</span>
        </Button>

        {/* ── Export ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-[oklch(0.75_0.20_185)] hover:bg-[oklch(0.75_0.20_185/0.10)]"
              title="Exportar"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only">Exportar relatório</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-[oklch(0.10_0.018_240)] border-[oklch(0.75_0.20_185/0.25)]"
          >
            <DropdownMenuItem className="text-xs font-mono text-muted-foreground cursor-pointer hover:text-[oklch(0.75_0.20_185)]">
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-mono text-muted-foreground cursor-pointer hover:text-[oklch(0.75_0.20_185)]">
              Exportar XLSX
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[oklch(0.20_0.03_220)]" />
            <DropdownMenuItem className="text-xs font-mono text-muted-foreground cursor-pointer hover:text-[oklch(0.75_0.20_185)]">
              Relatório PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ── Theme toggle ── */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-[oklch(0.75_0.20_185)] hover:bg-[oklch(0.75_0.20_185/0.10)]"
          title={resolvedTheme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark"
            ? <Sun className="h-3.5 w-3.5" />
            : <Moon className="h-3.5 w-3.5" />
          }
          <span className="sr-only">Alternar tema</span>
        </Button>

        {/* ── Settings ── */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-[oklch(0.75_0.20_185)] hover:bg-[oklch(0.75_0.20_185/0.10)]"
          title="Configurações"
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="sr-only">Configurações</span>
        </Button>
      </div>
    </header>
  );
}
