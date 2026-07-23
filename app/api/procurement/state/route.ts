import { ensureStoreHydrated, getPersistenceInfo, queryState, replaceState } from "@/lib/procurement/server-store";
import { fail, ok, canWrite, requireActor } from "@/lib/procurement/api-helpers";
import { AppState } from "@/lib/procurement/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  await ensureStoreHydrated();
  return ok({
    ...queryState(req.nextUrl.searchParams),
    persistence: getPersistenceInfo(),
  });
}

export async function POST(req: NextRequest) {
  await ensureStoreHydrated();
  const auth = await requireActor(req);
  if ("error" in auth) return auth.error;
  const actor = auth.actor;
  if (!canWrite(actor.role)) return fail("Sem permissao de edicao.", 403);

  const body = (await req.json()) as { state?: AppState };
  if (!body.state) return fail("Objeto state e obrigatorio.", 422);

  const state = replaceState(body.state, actor);
  return ok({ state });
}
