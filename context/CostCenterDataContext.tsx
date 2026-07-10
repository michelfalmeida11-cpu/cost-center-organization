"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PROCESSES, Process } from "@/lib/cost-centers";
import { loadCostCenters, saveCostCenters } from "@/lib/supabase";

const LS_KEY = "avg-cost-centers-v1";

async function loadData(): Promise<Process[]> {
  try {
    const supabaseData = await loadCostCenters();
    if (Array.isArray(supabaseData) && supabaseData.length > 0) {
      return supabaseData;
    }
  } catch (error) {
    console.warn("Supabase load failed:", error);
  }

  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("LocalStorage load failed:", error);
  }

  return PROCESSES;
}

async function saveData(processes: Process[]) {
  try {
    await saveCostCenters(processes);
  } catch (error) {
    console.warn("Supabase save failed:", error);
  }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(processes));
  } catch (error) {
    console.warn("LocalStorage save failed:", error);
  }
}

interface CostCenterDataContextValue {
  processes: Process[];
  setProcesses: React.Dispatch<React.SetStateAction<Process[]>>;
  hydrated: boolean;
  saveNow: () => void;
}

const CostCenterDataContext = createContext<CostCenterDataContextValue | null>(null);

export function CostCenterDataProvider({ children }: { children: React.ReactNode }) {
  const [processes, setProcesses] = useState<Process[]>(PROCESSES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadData().then((saved) => {
      if (!mounted) return;
      setProcesses(saved);
      setHydrated(true);
    });
    return () => { mounted = false; };
  }, []);

  const saveNow = useCallback(() => {
    saveData(processes);
  }, [processes]);

  useEffect(() => {
    if (!hydrated) return;
    saveData(processes);
  }, [processes, hydrated]);

  const value = useMemo(
    () => ({ processes, setProcesses, hydrated, saveNow }),
    [processes, hydrated, saveNow]
  );

  return (
    <CostCenterDataContext.Provider value={value}>
      {children}
    </CostCenterDataContext.Provider>
  );
}

export function useCostCenterData() {
  const ctx = useContext(CostCenterDataContext);
  if (!ctx) throw new Error("useCostCenterData must be used within CostCenterDataProvider");
  return ctx;
}
