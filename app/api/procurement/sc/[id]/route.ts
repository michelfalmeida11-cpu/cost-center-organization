import { canWrite, fail, ok, requireActor } from "@/lib/procurement/api-helpers";
import { changeSCStatus, deleteSC, ensureStoreHydrated, getPersistenceInfo, persistNow, restoreStateFromSnapshot, snapshotState, updateSC } from "@/lib/procurement/server-store";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await ensureStoreHydrated();
  const auth = await requireActor(req);
  if ("error" in auth) return auth.error;
  const actor = auth.actor;
  if (!canWrite(actor.role)) return fail("Sem permissao de edicao.", 403);

  const body = (await req.json()) as {
    status?: "EM_ANALISE" | "APROVADA" | "REPROVADA" | "LANCADA";
    motivoReprovacao?: string;
    [key: string]: unknown;
  };

  if (body.status) {
    const snapshot = snapshotState();
    const item = changeSCStatus(params.id, body.status, actor, body.motivoReprovacao);
    if (!item) return fail("SC nao encontrada.", 404);
    const persisted = await persistNow();
    if (!persisted) {
      restoreStateFromSnapshot(snapshot);
      const details = getPersistenceInfo().supabase?.lastPersistenceError;
      return fail(`Falha ao salvar no Supabase. Nenhuma alteracao foi aplicada.${details ? ` Detalhes: ${details}` : ""}`, 503);
    }
    return ok({ item });
  }

  const snapshot = snapshotState();
  const item = updateSC(params.id, body, actor);
  if (!item) return fail("SC nao encontrada.", 404);

  const persisted = await persistNow();
  if (!persisted) {
    restoreStateFromSnapshot(snapshot);
    const details = getPersistenceInfo().supabase?.lastPersistenceError;
    return fail(`Falha ao salvar no Supabase. Nenhuma alteracao foi aplicada.${details ? ` Detalhes: ${details}` : ""}`, 503);
  }

  return ok({ item });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await ensureStoreHydrated();
  const auth = await requireActor(req);
  if ("error" in auth) return auth.error;
  const actor = auth.actor;
  if (!canWrite(actor.role)) return fail("Sem permissao de edicao.", 403);

  const snapshot = snapshotState();
  const item = deleteSC(params.id, actor);
  if (!item) return fail("SC nao encontrada.", 404);

  const persisted = await persistNow();
  if (!persisted) {
    restoreStateFromSnapshot(snapshot);
    const details = getPersistenceInfo().supabase?.lastPersistenceError;
    return fail(`Falha ao salvar no Supabase. Nenhuma alteracao foi aplicada.${details ? ` Detalhes: ${details}` : ""}`, 503);
  }

  return ok({ item });
}
