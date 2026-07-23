import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { ok } from "@/lib/procurement/api-helpers";

export async function POST() {
  const response = ok({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
