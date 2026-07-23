import { Role } from "@/lib/procurement/types";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export type Actor = {
  nome: string;
  role: Role;
};

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getActor(req: NextRequest): Promise<Actor | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  return {
    nome: session.nome,
    role: session.role,
  };
}

export async function requireActor(req: NextRequest): Promise<{ actor: Actor } | { error: NextResponse }> {
  const actor = await getActor(req);
  if (!actor) return { error: fail("Nao autenticado.", 401) };
  return { actor };
}

export function canWrite(role: Role) {
  return role === "ADMINISTRADOR" || role === "COMPRAS" || role === "GESTOR";
}

export function canAdmin(role: Role) {
  return role === "ADMINISTRADOR";
}
