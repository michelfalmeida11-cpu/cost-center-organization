import { canWrite, fail, ok, requireActor } from "@/lib/procurement/api-helpers";
import { deleteFornecedor, ensureStoreHydrated, updateFornecedor } from "@/lib/procurement/server-store";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await ensureStoreHydrated();
  const auth = await requireActor(req);
  if ("error" in auth) return auth.error;
  const actor = auth.actor;
  if (!canWrite(actor.role)) return fail("Sem permissao de edicao.", 403);

  const body = (await req.json()) as {
    codigo?: string;
    razaoSocial?: string;
    nomeFantasia?: string;
    cnpj?: string;
    contato?: string;
    telefone?: string;
    email?: string;
    cidade?: string;
    estado?: string;
    categoria?: string;
    status?: "ATIVO" | "INATIVO" | "BLOQUEADO";
    observacoes?: string;
  };

  const item = updateFornecedor(params.id, body, actor);
  if (!item) return fail("Fornecedor nao encontrado.", 404);

  return ok({ item });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await ensureStoreHydrated();
  const auth = await requireActor(req);
  if ("error" in auth) return auth.error;
  const actor = auth.actor;
  if (!canWrite(actor.role)) return fail("Sem permissao de edicao.", 403);

  const item = deleteFornecedor(params.id, actor);
  if (!item) return fail("Fornecedor nao encontrado.", 404);

  return ok({ item });
}
