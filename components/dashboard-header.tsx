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
    <header className="sticky top-0 z-40 border-b border-border bg-card backdrop-blur-md shadow-md">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-[oklch(0.75_0.20_185)] to-transparent opacity-90" />

      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 h-16 flex items-center gap-4">

        {/* Brand */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative h-10 w-24 shrink-0">
            <Image
              src="/avg-logo.png"
              alt="Grupo AVG"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span
              className="text-[11px] font-mono font-semibold tracking-widest uppercase"
              style={{
                color: "oklch(0.75 0.20 185)",
                textShadow: "0 0 12px oklch(0.75 0.20 185 / 0.7)",
              }}
            >
              AVG
            </span>
            <span className="text-[11px] text-muted-foreground tracking-widest hidden md:block">
              Mina do Brumado
            </span>
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-[oklch(0.75_0.20_185/0.3)]" />

        {/* Nav label */}
        <div className="flex items-center gap-2 text-muted-foreground select-none">
          <LayoutDashboard className="h-4 w-4 text-[oklch(0.75_0.20_185)]" />
          <span className="text-xs font-mono font-semibold tracking-wide text-[oklch(0.75 0.15 180)]">
            GESTÃO DE CENTRO DE CUSTO
          </span>
        </div>

        <div className="flex-1" />

        {/* Live indicator */}
        <div className="hidden md:flex items-center gap-2 mr-2 select-none">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.65_0.20_145)] opacity-70" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[oklch(0.65_0.20_145)]" />
          </span>
          <span
            className="text-[11px] font-mono text-[oklch(0.65_0.20_145)] tracking-widest font-semibold"
            aria-label="Indicador de sistema online"
          >
            LIVE
          </span>
        </div>

        {/* Period selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              aria-label="Selecionar período do dashboard"
              className="gap-2 text-sm h-9 border-[oklch(0.75_0.20_185/0.4)] bg-[oklch(0.75_0.20_185/0.1)] text-[oklch(0.75_0.20_185)] hover:bg-[oklch(0.75_0.20_185/0.2)] font-mono transition-colors duration-200"
            >
              <Calendar className="h-4 w-4" />
              {period}
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 bg-[oklch(0.10_0.02_240)] border-[oklch(0.75_0.20_185/0.3)] shadow-lg"
          >
            {PERIODS.map((p) => (
              <DropdownMenuItem
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-sm font-mono cursor-pointer px-4 py-2 ${
                  p === period
                    ? "text-[oklch(0.75_0.20_185)] font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {p === period && (
                  <span className="mr-3 text-[oklch(0.75_0.20_185)] font-semibold">›</span>
                )}
                {p}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh */}
        <Button
          variant="ghost"
          size="sm"
          aria-label="Atualizar dados"
          onClick={handleRefresh}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-[oklch(0.75_0.20_185)] hover:bg-[oklch(0.75_0.20_185/0.15)] rounded-md focus:outline-none focus:ring-2 focus:ring-[oklch(0.75_0.20_185)] transition"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin text-[oklch(0.75_0.20_185)]" : ""}`}
          />
        </Button>

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Exportar relatório"
              className="h-9 w-9 p-0 text-muted-foreground hover:text-[oklch(0.75_0.20_185)] hover:bg-[oklch(0.75_0.20_185/0.15)] rounded-md focus:outline-none focus:ring-2 focus:ring-[oklch(0.75_0.20_185)] transition"
            >
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.75_0.20_185/0.3)] shadow-lg"
          >
            <DropdownMenuItem className="text-sm font-mono text-muted-foreground cursor-pointer px-4 py-2 hover:text-[oklch(0.75_0.20_185)]">
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm font-mono text-muted-foreground cursor-pointer px-4 py-2 hover:text-[oklch(0.75_0.20_185)]">
              Exportar XLSX
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[oklch(0.20_0.03_220)]" />
            <DropdownMenuItem className="text-sm font-mono text-muted-foreground cursor-pointer px-4 py-2 hover:text-[oklch(0.75_0.20_185)]">
              Relatório PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          aria-label={
            resolvedTheme === "dark"
              ? "Mudar para modo claro"
              : "Mudar para modo escuro"
          }
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-[oklch(0.75_0.20_185)] hover:bg-[oklch(0.75_0.20_185/0.15)] rounded-md focus:outline-none focus:ring-2 focus:ring-[oklch(0.75_0.20_185)] transition"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="sm"
          aria-label="Configurações"
          className="h-9 w-9 p-0 text-muted-foreground hover:text-[oklch(0.75_0.20_185)] hover:bg-[oklch(0.75_0.20_185/0.15)] rounded-md focus:outline-none focus:ring-2 focus:ring-[oklch(0.75_0.20_185)] transition"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}