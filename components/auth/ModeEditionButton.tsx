"use client";

import React from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ModeBadge } from "@/components/auth/ModeBadge";

export function ModeEditionButton() {
  const { canEdit, openAuthModal, role, isHydrated } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <ModeBadge />
      <Button
        onClick={() => {
          if (canEdit) return;
          openAuthModal();
        }}
        className="rounded-xl h-10 px-4"
        style={{
          background: canEdit ? "oklch(0.65 0.20 145 / 0.12)" : "oklch(0.12 0.018 240 / 0.06)",
          border: canEdit ? "1px solid oklch(0.65 0.20 145 / 0.25)" : "1px solid oklch(0.12 0.018 240 / 0.20)",
          color: canEdit ? "oklch(0.65 0.20 145)" : "oklch(0.45 0.03 220)",
          boxShadow: canEdit ? "0 0 18px oklch(0.65 0.20 145 / 0.20)" : "none",
        }}
      >
        <Pencil className="h-4 w-4 mr-2" />
        Modo Edição
      </Button>
      {!isHydrated && <span className="text-xs text-gray-600">...</span>}
      {isHydrated && role === "VIEWER" && (
        <span className="text-xs text-gray-600">(senha necessária)</span>
      )}
    </div>
  );
}

