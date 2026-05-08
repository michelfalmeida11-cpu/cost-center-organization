"use client";

import React, {
  useState,
  useMemo,
} from "react";

import { useRouter } from "next/navigation";

import {
  createClient,
  SupabaseClient,
} from "@supabase/supabase-js";

import { Lock } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ======================================================
// SUPABASE
// ======================================================

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ======================================================
// COMPONENT
// ======================================================

export default function LoginPage() {
  const router = useRouter();

  // ======================================================
  // STATES
  // ======================================================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ======================================================
  // SUPABASE CLIENT SAFE
  // ======================================================

  const supabase: SupabaseClient | null =
    useMemo(() => {
      if (
        !supabaseUrl ||
        !supabaseAnonKey
      ) {
        return null;
      }

      return createClient(
        supabaseUrl,
        supabaseAnonKey
      );
    }, []);

  // ======================================================
  // REDIRECT
  // ======================================================

  const getRedirectTo = () => {
    if (typeof window === "undefined") {
      return "/";
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    return params.get("next") || "/";
  };

  // ======================================================
  // LOGIN
  // ======================================================

  async function onSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // ======================================================
      // SUPABASE VALIDATION
      // ======================================================

      if (!supabase) {
        setError(
          "Supabase não configurado."
        );

        return;
      }

      // ======================================================
      // LOGIN
      // ======================================================

      const {
        data,
        error: authError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password,
          }
        );

      // ======================================================
      // AUTH ERROR
      // ======================================================

      if (authError) {
        setError(authError.message);
        return;
      }

      // ======================================================
      // USER VALIDATION
      // ======================================================

      if (!data?.user) {
        setError(
          "Falha ao autenticar."
        );

        return;
      }

      // ======================================================
      // SAVE AUTH
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="p-8">

          {/* HEADER */}

          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50">
              <Lock className="h-6 w-6 text-teal-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Acesso Premium
              </h1>

              <p className="text-sm text-slate-500">
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
              <label className="text-sm font-semibold text-slate-700">
                Email
              </label>

              <Input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="h-12 rounded-xl border-slate-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>

            {/* PASSWORD */}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Senha
              </label>

              <Input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-12 rounded-xl border-slate-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>

            {/* ERROR */}

            {!!error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* BUTTON */}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-2xl bg-teal-600 text-white shadow-lg transition-all hover:bg-teal-500"
            >
              {loading
                ? "Entrando..."
                : "Entrar"}
            </Button>
          </form>

          {/* FOOTER */}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs leading-relaxed text-slate-600">
              Apenas usuários autorizados
              podem alterar informações do
              sistema. Usuários VIEWER possuem
              acesso somente leitura.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}