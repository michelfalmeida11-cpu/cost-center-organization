import { fail, ok, canWrite, requireActor } from "@/lib/procurement/api-helpers";
import { ensureStoreHydrated, moveKanban, persistNow } from "@/lib/procurement/server-store";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  await ensureStoreHydrated();
  const auth = await requireActor(req);
  if ("error" in auth) return auth.error;
  const actor = auth.actor;
  if (!canWrite(actor.role)) return fail("Sem permissao de edicao.", 403);

  const body = (await req.json()) as { entity?: "SC" | "OC"; id?: string; targetStatus?: string };
  if (!body.entity || !body.id || !body.targetStatus) return fail("entity, id e targetStatus sao obrigatorios.", 422);

  const item = moveKanban(body.entity, body.id, body.targetStatus, actor);
  if (!item) return fail("Item nao encontrado.", 404);

  const persisted = await persistNow();
  if (!persisted) return fail("Falha ao persistir dados.", 500);

  return ok({ item });
}
