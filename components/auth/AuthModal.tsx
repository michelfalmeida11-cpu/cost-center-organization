"use client";

import React, { useMemo, useState } from "react";
import { X, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authenticateWithAdminPassword, role } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isAdmin = role === "ADMIN";

  const title = useMemo(() => (isAdmin ? "Administrador" : "Acesso de Edição"), [isAdmin]);

  if (!isAuthModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(2,6,18,0.75)", backdropFilter: "blur(8px)" }}
      onClick={closeAuthModal}
      role="dialog"
      aria-modal="true"
      aria-label="Autenticação"
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card className="rounded-2xl p-6 border" style={{ background: "oklch(0.98 0.01 240)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: "oklch(0.75 0.20 185 / 0.10)", border: "1px solid oklch(0.75 0.20 185 / 0.25)" }}>
              <Lock className="h-5 w-5" style={{ color: "oklch(0.75 0.20 185)" }} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-700">Digite a senha administrativa para habilitar o modo de edição.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={closeAuthModal} className="h-9 w-9 p-0" aria-label="Fechar">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-xs font-semibold text-gray-700">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="••••••••"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const ok = authenticateWithAdminPassword(password);
                  if (!ok) setError("Senha incorreta.");
                  if (ok) setPassword("");
                }
              }}
            />
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <Button
              onClick={() => {
                const ok = authenticateWithAdminPassword(password);
                if (!ok) setError("Senha incorreta.");
                if (ok) setPassword("");
              }}
              className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-lg"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Habilitar Edição
            </Button>
            <Button variant="outline" className="flex-1 rounded-xl" onClick={closeAuthModal}>
              Cancelar
            </Button>
          </div>

          <p className="mt-4 text-xs text-gray-600">
            Dica: somente administradores podem criar/editar/excluir e alterar orçado/realizado.
          </p>
        </Card>
      </div>
    </div>
  );
}

