import { login } from "@/lib/procurement/server-store";
import { fail, ok } from "@/lib/procurement/api-helpers";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; senha?: string };
  if (!body.email || !body.senha) return fail("Email e senha sao obrigatorios.", 422);

  const user = login(body.email, body.senha);
  if (!user) return fail("Credenciais invalidas.", 401);

  const token = await createSessionToken(user);
  const response = ok({ user });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return response;
}
