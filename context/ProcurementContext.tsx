"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AppState,
  CurrentUser,
  GlobalFilters,
  PurchaseOrder,
  PurchaseRequest,
  SCStatus,
  Sector,
  Supplier,
} from "@/lib/procurement/types";
import { EMPTY_FILTERS, MOCK_STATE } from "@/lib/procurement/data";
import {
  apiChangeSCStatus,
  apiCreateOC,
  apiCreateSC,
  apiCreateSector,
  apiCreateSupplier,
  apiDeleteOC,
  apiDeleteSC,
  apiDeleteSector,
  apiDeleteSupplier,
  apiGetState,
  apiLogin,
  apiLogout,
  apiMe,
  apiMoveKanban,
  apiReplaceState,
  apiUpdateOC,
  apiUpdateSC,
  apiUpdateSector,
  apiUpdateSupplier,
} from "@/lib/procurement/client-api";

const LS_USER_KEY = "cyberproc-user-v1";

type LoginResult = { ok: true } | { ok: false; message: string };

interface ProcurementContextValue {
  state: AppState;
  filters: GlobalFilters;
  currentUser: CurrentUser | null;
  collapsedSidebar: boolean;
  hydrated: boolean;
  login: (email: string, senha: string) => Promise<LoginResult>;
  logout: () => void;
  canEdit: boolean;
  setCollapsedSidebar: (value: boolean) => void;
  setFilters: (filters: GlobalFilters) => void;
  resetFilters: () => void;
  refreshState: () => Promise<void>;
  createSector: (payload: Omit<Sector, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<void>;
  updateSector: (id: string, payload: Partial<Sector>) => Promise<void>;
  deleteSector: (id: string) => Promise<void>;
  createSupplier: (payload: Omit<Supplier, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<void>;
  createSupplierWithResult: (payload: Omit<Supplier, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<Supplier>;
  updateSupplier: (id: string, payload: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  createSC: (payload: Omit<PurchaseRequest, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<void>;
  updateSC: (id: string, payload: Partial<PurchaseRequest>) => Promise<void>;
  deleteSC: (id: string) => Promise<void>;
  createOC: (payload: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<void>;
  updateOC: (id: string, payload: Partial<PurchaseOrder>) => Promise<void>;
  deleteOC: (id: string) => Promise<void>;
  changeScStatus: (id: string, status: SCStatus, reason?: string) => Promise<void>;
  moveTrackingItem: (entity: "SC" | "OC", id: string, targetStatus: string) => Promise<void>;
  importAllData: (payload: AppState) => Promise<void>;
}

const ProcurementContext = createContext<ProcurementContextValue | null>(null);

function canEditByRole(role: CurrentUser["role"] | undefined) {
  return role === "ADMINISTRADOR" || role === "COMPRAS" || role === "GESTOR";
}

export function ProcurementProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(MOCK_STATE);
  const [filters, setFiltersState] = useState<GlobalFilters>(EMPTY_FILTERS);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const refreshState = useCallback(async () => {
    try {
      const data = await apiGetState(EMPTY_FILTERS);
      setState(data.state as AppState);
    } catch {
      // Keep last known state if API is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const userRaw = localStorage.getItem(LS_USER_KEY);
        if (userRaw) setCurrentUser(JSON.parse(userRaw) as CurrentUser);
        try {
          const me = await apiMe();
          setCurrentUser(me.user);
          localStorage.setItem(LS_USER_KEY, JSON.stringify(me.user));
        } catch {
          setCurrentUser(null);
          localStorage.removeItem(LS_USER_KEY);
        }
        await refreshState();
      } catch {
        setState(MOCK_STATE);
      } finally {
        setHydrated(true);
      }
    };

    void bootstrap();
  }, [refreshState]);

  const setFilters = useCallback((next: GlobalFilters) => setFiltersState(next), []);
  const resetFilters = useCallback(() => setFiltersState(EMPTY_FILTERS), []);

  const login = useCallback(async (email: string, senha: string): Promise<LoginResult> => {
    try {
      const data = await apiLogin(email, senha);
      setCurrentUser(data.user);
      localStorage.setItem(LS_USER_KEY, JSON.stringify(data.user));
      await refreshState();
      return { ok: true };
    } catch (error) {
      return { ok: false, message: (error as Error).message };
    }
  }, [refreshState]);

  const logout = useCallback(() => {
    void apiLogout().catch(() => undefined);
    setCurrentUser(null);
    localStorage.removeItem(LS_USER_KEY);
  }, []);

  const canEdit = canEditByRole(currentUser?.role);

  const createSector = useCallback(async (payload: Omit<Sector, "id" | "createdAt" | "updatedAt" | "deletedAt">) => {
    await apiCreateSector(payload, currentUser);
    await refreshState();
  }, [currentUser, refreshState]);

  const updateSector = useCallback(async (id: string, payload: Partial<Sector>) => {
    await apiUpdateSector(id, payload, currentUser);
    await refreshState();
  }, [currentUser, refreshState]);

  const deleteSector = useCallback(async (id: string) => {
    await apiDeleteSector(id, currentUser);
    await refreshState();
  }, [currentUser, refreshState]);

  const createSupplierWithResult = useCallback(async (payload: Omit<Supplier, "id" | "createdAt" | "updatedAt" | "deletedAt">) => {
    const data = await apiCreateSupplier(payload, currentUser);
    await refreshState();
    return data.item;
  }, [currentUser, refreshState]);

  const createSupplier = useCallback(async (payload: Omit<Supplier, "id" | "createdAt" | "updatedAt" | "deletedAt">) => {
    await createSupplierWithResult(payload);
  }, [createSupplierWithResult]);

  const updateSupplier = useCallback(async (id: string, payload: Partial<Supplier>) => {
    await apiUpdateSupplier(id, payload, currentUser);
    await refreshState();
  }, [currentUser, refreshState]);

  const deleteSupplier = useCallback(async (id: string) => {
    await apiDeleteSupplier(id, currentUser);
    await refreshState();
  }, [currentUser, refreshState]);

  const createSC = useCallback(async (payload: Omit<PurchaseRequest, "id" | "createdAt" | "updatedAt" | "deletedAt">) => {
    await apiCreateSC(payload, currentUser);
    await refreshState();
  }, [currentUser, refreshState]);

  const updateSC = useCallback(async (id: string, payload: Partial<PurchaseRequest>) => {
    await apiUpdateSC(id, payload, currentUser);
    await refreshState();
  }, [currentUser, refreshState]);

  const deleteSC = useCallback(async (id: string) => {
    await apiDeleteSC(id, currentUser);
    await refreshState();
  }, [currentUser, refreshState]);

  const createOC = useCallback(async (payload: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "deletedAt">) => {
    await apiCreateOC(payload, currentUser);
    await refreshState();
  }, [currentUser, refreshState]);

  const updateOC = useCallback(async (id: string, payload: Partial<PurchaseOrder>) => {
    await apiUpdateOC(id, payload, currentUser);
    await refreshState();
  }, [currentUser, refreshState]);

  const deleteOC = useCallback(async (id: string) => {
    await apiDeleteOC(id, currentUser);
    await refreshState();
  }, [currentUser, refreshState]);

  const changeScStatus = useCallback(async (id: string, status: SCStatus, reason?: string) => {
    await apiChangeSCStatus(id, status, currentUser, reason);
    await refreshState();
  }, [currentUser, refreshState]);

  const moveTrackingItem = useCallback(async (entity: "SC" | "OC", id: string, targetStatus: string) => {
    await apiMoveKanban(entity, id, targetStatus as SCStatus, currentUser);
    await refreshState();
  }, [currentUser, refreshState]);

  const importAllData = useCallback(async (payload: AppState) => {
    await apiReplaceState(payload, currentUser);
    await refreshState();
  }, [currentUser, refreshState]);

  const value = useMemo<ProcurementContextValue>(
    () => ({
      state,
      filters,
      currentUser,
      collapsedSidebar,
      hydrated,
      login,
      logout,
      canEdit,
      setCollapsedSidebar,
      setFilters,
      resetFilters,
      refreshState,
      createSector,
      updateSector,
      deleteSector,
      createSupplier,
      createSupplierWithResult,
      updateSupplier,
      deleteSupplier,
      createSC,
      updateSC,
      deleteSC,
      createOC,
      updateOC,
      deleteOC,
      changeScStatus,
      moveTrackingItem,
      importAllData,
    }),
    [
      state,
      filters,
      currentUser,
      collapsedSidebar,
      hydrated,
      login,
      logout,
      canEdit,
      refreshState,
      setFilters,
      resetFilters,
      createSector,
      updateSector,
      deleteSector,
      createSupplier,
      createSupplierWithResult,
      updateSupplier,
      deleteSupplier,
      createSC,
      updateSC,
      deleteSC,
      createOC,
      updateOC,
      deleteOC,
      changeScStatus,
      moveTrackingItem,
      importAllData,
    ],
  );

  return <ProcurementContext.Provider value={value}>{children}</ProcurementContext.Provider>;
}

export function useProcurement() {
  const ctx = useContext(ProcurementContext);
  if (!ctx) throw new Error("useProcurement must be used within ProcurementProvider");
  return ctx;
}
