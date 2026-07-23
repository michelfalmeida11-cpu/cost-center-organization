import { canWrite, fail, ok, requireActor } from "@/lib/procurement/api-helpers";
import { createSetor, ensureStoreHydrated, listSetores } from "@/lib/procurement/server-store";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  await ensureStoreHydrated();
  const params = req.nextUrl.searchParams;
  const result = listSetores({
    page: Number(params.get("page") ?? 1),
    pageSize: Number(params.get("pageSize") ?? 20),
    search: params.get("search") ?? "",
    ativo: params.get("ativo") ?? "",
  });
  return ok(result);
}

export async function POST(req: NextRequest) {
  await ensureStoreHydrated();
  const auth = await requireActor(req);
  if ("error" in auth) return auth.error;
  const actor = auth.actor;
  if (!canWrite(actor.role)) return fail("Sem permissao de edicao.", 403);

  const body = (await req.json()) as { nome?: string; descricao?: string; ativo?: boolean };
  if (!body.nome) return fail("Campo nome e obrigatorio.", 422);

  const item = createSetor(
    {
      nome: body.nome,
      descricao: body.descricao ?? "",
      ativo: body.ativo ?? true,
    },
    actor,
  );

  return ok({ item }, 201);
}
