import { canWrite, fail, ok, requireActor } from "@/lib/procurement/api-helpers";
import { createFornecedor, ensureStoreHydrated, listFornecedores, persistNow } from "@/lib/procurement/server-store";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureStoreHydrated();
  const params = req.nextUrl.searchParams;
  const result = listFornecedores({
    page: Number(params.get("page") ?? 1),
    pageSize: Number(params.get("pageSize") ?? 20),
    search: params.get("search") ?? "",
    status: (params.get("status") as "ATIVO" | "INATIVO" | "BLOQUEADO" | null) ?? undefined,
    categoria: params.get("categoria") ?? "",
  });
  return ok(result);
}

export async function POST(req: NextRequest) {
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

  if (!body.codigo || !body.nomeFantasia || !body.razaoSocial || !body.cnpj) {
    return fail("codigo, razaoSocial, nomeFantasia e cnpj sao obrigatorios.", 422);
  }

  const item = createFornecedor(
    {
      codigo: body.codigo,
      razaoSocial: body.razaoSocial,
      nomeFantasia: body.nomeFantasia,
      cnpj: body.cnpj,
      contato: body.contato ?? "",
      telefone: body.telefone ?? "",
      email: body.email ?? "",
      cidade: body.cidade ?? "",
      estado: body.estado ?? "",
      categoria: body.categoria ?? "Geral",
      status: body.status ?? "ATIVO",
      observacoes: body.observacoes ?? "",
    },
    actor,
  );

  const persisted = await persistNow();
  if (!persisted) return fail("Falha ao persistir dados.", 500);

  return ok({ item }, 201);
}
