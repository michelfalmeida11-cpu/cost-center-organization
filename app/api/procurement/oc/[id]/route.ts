import { canWrite, fail, ok, requireActor } from "@/lib/procurement/api-helpers";
import { deleteOC, ensureStoreHydrated, updateOC } from "@/lib/procurement/server-store";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await ensureStoreHydrated();
  const auth = await requireActor(req);
  if ("error" in auth) return auth.error;
  const actor = auth.actor;
  if (!canWrite(actor.role)) return fail("Sem permissao de edicao.", 403);

  const body = (await req.json()) as Record<string, unknown>;
  const item = updateOC(params.id, body, actor);
  if (!item) return fail("OC nao encontrada.", 404);

  return ok({ item });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await ensureStoreHydrated();
  const auth = await requireActor(req);
  if ("error" in auth) return auth.error;
  const actor = auth.actor;
  if (!canWrite(actor.role)) return fail("Sem permissao de edicao.", 403);

  const item = deleteOC(params.id, actor);
  if (!item) return fail("OC nao encontrada.", 404);

  return ok({ item });
}
