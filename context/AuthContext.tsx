"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthRole = "ADMIN" | "VIEWER";

type AuthContextValue = {
  role: AuthRole;
  isHydrated: boolean;
  canEdit: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authenticateWithAdminPassword: (password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LS_KEY_ROLE = "avg-auth-role-v1";

const ADMIN_PASSWORD = "admin123";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AuthRole>("VIEWER");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_ROLE);
      if (raw === "ADMIN" || raw === "VIEWER") setRole(raw);
    } catch {
      // ignore
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const authenticateWithAdminPassword = useCallback((password: string) => {
    if (password !== ADMIN_PASSWORD) return false;
    setRole("ADMIN");
    try {
      localStorage.setItem(LS_KEY_ROLE, "ADMIN");
    } catch {
      // ignore
    }
    setIsAuthModalOpen(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    setRole("VIEWER");
    try {
      localStorage.setItem(LS_KEY_ROLE, "VIEWER");
    } catch {
      // ignore
    }
    setIsAuthModalOpen(false);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      role,
      isHydrated,
      canEdit: role === "ADMIN" && isHydrated,
      openAuthModal,
      closeAuthModal,
      isAuthModalOpen,
      authenticateWithAdminPassword,
      logout,
    };
  }, [role, isHydrated, openAuthModal, closeAuthModal, isAuthModalOpen, authenticateWithAdminPassword, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

