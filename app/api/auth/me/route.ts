import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { fail, ok } from "@/lib/procurement/api-helpers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return fail("Nao autenticado.", 401);

  const session = await verifySessionToken(token);
  if (!session) return fail("Sessao invalida.", 401);

  return ok({
    user: {
      nome: session.nome,
      email: session.email,
      role: session.role,
    },
  });
}
