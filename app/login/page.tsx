"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Lock } from "lucide-react";

// ======================================================
// SUPABASE CONFIG
// ======================================================

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// ======================================================
// REDIRECT HELPER
// ======================================================

function getRedirectTo(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  try {
    const params = new URLSearchParams(
      window.location.search
    );

    return params.get("next") || "/";
  } catch {
    return "/";
  }
}

// ======================================================
// COMPONENT
// ======================================================

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState<string>("");

  const [password, setPassword] =
    useState<string>("");

  const [loading, setLoading] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string | null>(null);

  // ======================================================
  // LOGIN
  // ======================================================

  async function onSubmit(
    e: FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // ======================================================
      // VALIDATE SUPABASE
      // ======================================================

      if (!supabase) {
        setError(
          "Supabase não configurado. Configure as variáveis de ambiente."
        );

        setLoading(false);
        return;
      }

      // ======================================================
      // LOGIN
      // ======================================================

      const {
        data,
        error: authError,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      // ======================================================
      // LOGIN ERROR
      // ======================================================

      if (authError) {
        setError(authError.message);

        setLoading(false);
        return;
      }

      // ======================================================
      // USER VALIDATION
      // ======================================================

      if (!data.user) {
        setError("Falha ao autenticar");

        setLoading(false);
        return;
      }

      // ======================================================
      // SAVE SESSION
      // ======================================================

      localStorage.setItem(
        "isAuthenticated",
        "true"
      );

      localStorage.setItem(
        "userEmail",
        data.user.email || ""
      );

      // ======================================================
      // REDIRECT
      // ======================================================

      router.push(getRedirectTo());
    } catch (err) {
      console.error(err);

      setError(
        "Erro interno ao realizar login."
      );
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl border border-gray-200 bg-white shadow-xl">
        <div className="p-8">

          {/* HEADER */}

          <div className="flex items-center gap-3 mb-6">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "rgba(20,184,166,0.12)",
                border:
                  "1px solid rgba(20,184,166,0.25)",
              }}
            >
              <Lock
                className="h-6 w-6"
                style={{
                  color: "#14B8A6",
                }}
              />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Acesso Premium
              </h1>

              <p className="text-sm text-gray-600">
                Gestão de Centros de Custo
              </p>
            </div>
          </div>

          {/* FORM */}

          <form
            onSubmit={onSubmit}
            className="space-y-5"
          >
            {/* EMAIL */}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Email
              </label>

              <Input
                type="email"
                value={email}
                onChange={(
                  e: ChangeEvent<HTMLInputElement>
                ) =>
                  setEmail(e.target.value)
                }
                placeholder="seu@email.com"
                required
                className="h-11 rounded-xl border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>

            {/* PASSWORD */}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Senha
              </label>

              <Input
                type="password"
                value={password}
                onChange={(
                  e: ChangeEvent<HTMLInputElement>
                ) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••"
                required
                className="h-11 rounded-xl border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>

            {/* ERROR */}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* BUTTON */}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-lg transition-all"
            >
              {loading
                ? "Entrando..."
                : "Entrar"}
            </Button>
          </form>

          {/* FOOTER */}

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs leading-relaxed text-gray-600">
              Apenas usuários autorizados podem
              realizar alterações no sistema.
              Usuários VIEWER possuem acesso
              somente leitura.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
