import { canWrite, fail, ok, requireActor } from "@/lib/procurement/api-helpers";
import { createOC, ensureStoreHydrated, listOC, persistNow } from "@/lib/procurement/server-store";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureStoreHydrated();
  const params = req.nextUrl.searchParams;
  const result = listOC({
    page: Number(params.get("page") ?? 1),
    pageSize: Number(params.get("pageSize") ?? 20),
    search: params.get("search") ?? "",
    status: (params.get("status") as "CRIADA" | "ENVIADA_FORNECEDOR" | "CONFIRMADA" | "EM_PRODUCAO" | "EM_TRANSPORTE" | "ENTREGUE" | "ATRASADA" | "CANCELADA" | null) ?? undefined,
    setorId: params.get("setorId") ?? "",
    fornecedorId: params.get("fornecedorId") ?? "",
    responsavel: params.get("responsavel") ?? "",
    ano: params.get("ano") ?? "",
    mes: params.get("mes") ?? "",
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
    numeroOC?: string;
    scId?: string;
    fornecedorId?: string;
    dataOC?: string;
    dataEmissao?: string;
    dataPrevistaEntrega?: string;
    dataRealEntrega?: string | null;
    valorOC?: number;
    setorId?: string;
    responsavel?: string;
    status?: "CRIADA" | "ENVIADA_FORNECEDOR" | "CONFIRMADA" | "EM_PRODUCAO" | "EM_TRANSPORTE" | "ENTREGUE" | "ATRASADA" | "CANCELADA";
    condicaoPagamento?: string;
    observacoes?: string;
    anexos?: string[];
  };

  if (!body.numeroOC || !body.scId || !body.fornecedorId || !body.setorId || !body.dataPrevistaEntrega) {
    return fail("numeroOC, scId, fornecedorId, setorId e dataPrevistaEntrega sao obrigatorios.", 422);
  }

  const today = new Date().toISOString().slice(0, 10);
  const item = createOC(
    {
      numeroOC: body.numeroOC,
      scId: body.scId,
      fornecedorId: body.fornecedorId,
      dataOC: body.dataOC ?? today,
      dataEmissao: body.dataEmissao ?? today,
      dataPrevistaEntrega: body.dataPrevistaEntrega,
      dataRealEntrega: body.dataRealEntrega ?? null,
      valorOC: body.valorOC ?? 0,
      setorId: body.setorId,
      responsavel: body.responsavel ?? "",
      status: body.status ?? "CRIADA",
      condicaoPagamento: body.condicaoPagamento ?? "",
      observacoes: body.observacoes ?? "",
      anexos: body.anexos ?? [],
    },
    actor,
  );

  const persisted = await persistNow();
  if (!persisted) {
    return ok({ item, persisted: false, warning: "Dados atualizados em memoria. Persistencia Supabase indisponivel no momento." }, 202);
  }

  return ok({ item }, 201);
}
