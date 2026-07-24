import { canWrite, fail, ok, requireActor } from "@/lib/procurement/api-helpers";
import { deleteSetor, ensureStoreHydrated, persistNow, updateSetor } from "@/lib/procurement/server-store";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await ensureStoreHydrated();
  const auth = await requireActor(req);
  if ("error" in auth) return auth.error;
  const actor = auth.actor;
  if (!canWrite(actor.role)) return fail("Sem permissao de edicao.", 403);

  const body = (await req.json()) as { nome?: string; descricao?: string; ativo?: boolean };
  const item = updateSetor(params.id, body, actor);
  if (!item) return fail("Setor nao encontrado.", 404);

  const persisted = await persistNow();
  if (!persisted) {
    return ok({ item, persisted: false, warning: "Dados atualizados em memoria. Persistencia Supabase indisponivel no momento." }, 202);
  }

  return ok({ item });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await ensureStoreHydrated();
  const auth = await requireActor(req);
  if ("error" in auth) return auth.error;
  const actor = auth.actor;
  if (!canWrite(actor.role)) return fail("Sem permissao de edicao.", 403);

  const item = deleteSetor(params.id, actor);
  if (!item) return fail("Setor nao encontrado.", 404);

  const persisted = await persistNow();
  if (!persisted) {
    return ok({ item, persisted: false, warning: "Dados atualizados em memoria. Persistencia Supabase indisponivel no momento." }, 202);
  }

  return ok({ item });
}
