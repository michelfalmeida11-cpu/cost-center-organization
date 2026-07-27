import { canWrite, fail, ok, requireActor } from "@/lib/procurement/api-helpers";
import { createSC, ensureStoreHydrated, getPersistenceInfo, listSC, persistNow, restoreStateFromSnapshot, snapshotState } from "@/lib/procurement/server-store";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureStoreHydrated();
  const params = req.nextUrl.searchParams;
  const result = listSC({
    page: Number(params.get("page") ?? 1),
    pageSize: Number(params.get("pageSize") ?? 20),
    search: params.get("search") ?? "",
    status: (params.get("status") as "EM_ANALISE" | "APROVADA" | "REPROVADA" | "LANCADA" | null) ?? undefined,
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
    numeroSC?: string;
    dataCriacao?: string;
    solicitante?: string;
    setorId?: string;
    descricao?: string;
    categoria?: string;
    prioridade?: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
    valorEstimado?: number;
    fornecedorSugeridoId?: string | null;
    justificativa?: string;
    status?: "EM_ANALISE" | "APROVADA" | "REPROVADA" | "LANCADA";
    responsavel?: string;
    dataAprovacao?: string | null;
    dataReprovacao?: string | null;
    motivoReprovacao?: string | null;
    dataLancamento?: string | null;
    numeroOCRelacionada?: string | null;
    observacoes?: string;
    anexos?: string[];
  };

  if (!body.numeroSC || !body.solicitante || !body.setorId || !body.descricao) {
    return fail("numeroSC, solicitante, setorId e descricao sao obrigatorios.", 422);
  }

  const snapshot = snapshotState();
  const item = createSC(
    {
      numeroSC: body.numeroSC,
      dataCriacao: body.dataCriacao ?? new Date().toISOString().slice(0, 10),
      solicitante: body.solicitante,
      setorId: body.setorId,
      descricao: body.descricao,
      categoria: body.categoria ?? "",
      prioridade: body.prioridade ?? "MEDIA",
      valorEstimado: body.valorEstimado ?? 0,
      fornecedorSugeridoId: body.fornecedorSugeridoId ?? null,
      justificativa: body.justificativa ?? "",
      status: body.status ?? "EM_ANALISE",
      responsavel: body.responsavel ?? "",
      dataAprovacao: body.dataAprovacao ?? null,
      dataReprovacao: body.dataReprovacao ?? null,
      motivoReprovacao: body.motivoReprovacao ?? null,
      dataLancamento: body.dataLancamento ?? null,
      numeroOCRelacionada: body.numeroOCRelacionada ?? null,
      observacoes: body.observacoes ?? "",
      anexos: body.anexos ?? [],
    },
    actor,
  );

  const persisted = await persistNow();
  if (!persisted) {
    restoreStateFromSnapshot(snapshot);
    const details = getPersistenceInfo().supabase?.lastPersistenceError;
    return fail(`Falha ao salvar no Supabase. Nenhuma alteracao foi aplicada.${details ? ` Detalhes: ${details}` : ""}`, 503);
  }

  return ok({ item }, 201);
}
