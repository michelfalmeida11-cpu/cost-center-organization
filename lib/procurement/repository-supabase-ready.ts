import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppState } from "@/lib/procurement/types";

export type PersistenceDriver = "memory" | "supabase";
type AnySupabaseClient = SupabaseClient<any, any, any, any, any>;

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getSupabaseConfig() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return { url, key };
}

function getSupabaseClient(): AnySupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  if (!isValidHttpUrl(url)) {
    console.warn("Invalid SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL. Falling back to memory persistence.");
    return null;
  }

  try {
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    }) as AnySupabaseClient;
  } catch {
    console.warn("Failed to initialize Supabase client. Falling back to memory persistence.");
    return null;
  }
}

export function isSupabaseAvailable() {
  const client = getSupabaseClient();
  return !!client;
}

export function getConfiguredDriver(): PersistenceDriver {
  if (process.env.PROCUREMENT_PERSISTENCE_DRIVER !== "supabase") return "memory";
  return isSupabaseAvailable() ? "supabase" : "memory";
}

export async function loadStateFromSupabase(): Promise<AppState | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  return loadStateFromRelationalTables(client);
}

export async function saveStateToSupabase(state: AppState): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  return saveStateToRelationalTables(client, state);
}

function toText(value: string | null | undefined) {
  return value ?? null;
}

function toJsonArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value;
}

async function loadStateFromRelationalTables(client: AnySupabaseClient): Promise<AppState | null> {
  const [setoresRes, fornecedoresRes, scRes, ocRes, auditRes] = await Promise.all([
    client.from("sectors").select("*"),
    client.from("suppliers").select("*"),
    client.from("purchase_requests").select("*"),
    client.from("purchase_orders").select("*"),
    client.from("audit_logs").select("*"),
  ]);

  if (setoresRes.error || fornecedoresRes.error || scRes.error || ocRes.error || auditRes.error) {
    return null;
  }

  const setores = (setoresRes.data ?? []).map((r) => ({
    id: String(r.id),
    nome: String(r.nome ?? ""),
    descricao: String(r.descricao ?? ""),
    ativo: Boolean(r.ativo),
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
    deletedAt: toText(r.deleted_at as string | null),
  }));

  const fornecedores = (fornecedoresRes.data ?? []).map((r) => ({
    id: String(r.id),
    codigo: String(r.codigo ?? ""),
    razaoSocial: String(r.razao_social ?? ""),
    nomeFantasia: String(r.nome_fantasia ?? ""),
    cnpj: String(r.cnpj ?? ""),
    contato: String(r.contato ?? ""),
    telefone: String(r.telefone ?? ""),
    email: String(r.email ?? ""),
    cidade: String(r.cidade ?? ""),
    estado: String(r.estado ?? ""),
    categoria: String(r.categoria ?? ""),
    status: (String(r.status ?? "ATIVO") as "ATIVO" | "INATIVO" | "BLOQUEADO"),
    observacoes: String(r.observacoes ?? ""),
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
    deletedAt: toText(r.deleted_at as string | null),
  }));

  const scs = (scRes.data ?? []).map((r) => ({
    id: String(r.id),
    numeroSC: String(r.numero_sc ?? ""),
    dataCriacao: String(r.data_criacao ?? ""),
    solicitante: String(r.solicitante ?? ""),
    setorId: String(r.setor_id ?? ""),
    descricao: String(r.descricao ?? ""),
    categoria: String(r.categoria ?? ""),
    prioridade: (String(r.prioridade ?? "MEDIA") as "BAIXA" | "MEDIA" | "ALTA" | "CRITICA"),
    valorEstimado: Number(r.valor_estimado ?? 0),
    fornecedorSugeridoId: toText(r.fornecedor_sugerido_id as string | null),
    justificativa: String(r.justificativa ?? ""),
    status: (String(r.status ?? "EM_ANALISE") as "EM_ANALISE" | "APROVADA" | "REPROVADA" | "LANCADA"),
    responsavel: String(r.responsavel ?? ""),
    dataAprovacao: toText(r.data_aprovacao as string | null),
    dataReprovacao: toText(r.data_reprovacao as string | null),
    motivoReprovacao: toText(r.motivo_reprovacao as string | null),
    dataLancamento: toText(r.data_lancamento as string | null),
    numeroOCRelacionada: toText(r.numero_oc_relacionada as string | null),
    observacoes: String(r.observacoes ?? ""),
    anexos: toJsonArray(r.anexos),
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
    deletedAt: toText(r.deleted_at as string | null),
  }));

  const ocs = (ocRes.data ?? []).map((r) => ({
    id: String(r.id),
    numeroOC: String(r.numero_oc ?? ""),
    scId: String(r.sc_id ?? ""),
    fornecedorId: String(r.fornecedor_id ?? ""),
    dataOC: String(r.data_oc ?? ""),
    dataEmissao: String(r.data_emissao ?? ""),
    dataPrevistaEntrega: String(r.data_prevista_entrega ?? ""),
    dataRealEntrega: toText(r.data_real_entrega as string | null),
    valorOC: Number(r.valor_oc ?? 0),
    setorId: String(r.setor_id ?? ""),
    responsavel: String(r.responsavel ?? ""),
    status: (String(r.status ?? "CRIADA") as "CRIADA" | "ENVIADA_FORNECEDOR" | "CONFIRMADA" | "EM_PRODUCAO" | "EM_TRANSPORTE" | "ENTREGUE" | "ATRASADA" | "CANCELADA"),
    condicaoPagamento: String(r.condicao_pagamento ?? ""),
    observacoes: String(r.observacoes ?? ""),
    anexos: toJsonArray(r.anexos),
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
    deletedAt: toText(r.deleted_at as string | null),
  }));

  const auditoria = (auditRes.data ?? []).map((r) => ({
    id: String(r.id),
    usuario: String(r.usuario ?? ""),
    role: String(r.role ?? "VISUALIZACAO") as "ADMINISTRADOR" | "COMPRAS" | "GESTOR" | "SOLICITANTE" | "VISUALIZACAO",
    acao: String(r.acao ?? ""),
    entidade: String(r.entidade ?? "SC") as "SC" | "OC" | "FORNECEDOR" | "SETOR",
    entidadeId: String(r.entidade_id ?? ""),
    antes: String(r.antes ?? ""),
    depois: String(r.depois ?? ""),
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
    deletedAt: toText(r.deleted_at as string | null),
  }));

  return { setores, fornecedores, scs, ocs, auditoria };
}

async function saveStateToRelationalTables(client: AnySupabaseClient, state: AppState): Promise<boolean> {
  const sectorsRows = state.setores.map((s) => ({
    id: s.id,
    nome: s.nome,
    descricao: s.descricao,
    ativo: s.ativo,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    deleted_at: s.deletedAt,
  }));

  const suppliersRows = state.fornecedores.map((s) => ({
    id: s.id,
    codigo: s.codigo,
    razao_social: s.razaoSocial,
    nome_fantasia: s.nomeFantasia,
    cnpj: s.cnpj,
    contato: s.contato,
    telefone: s.telefone,
    email: s.email,
    cidade: s.cidade,
    estado: s.estado,
    categoria: s.categoria,
    status: s.status,
    observacoes: s.observacoes,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    deleted_at: s.deletedAt,
  }));

  const scRows = state.scs.map((s) => ({
    id: s.id,
    numero_sc: s.numeroSC,
    data_criacao: s.dataCriacao,
    solicitante: s.solicitante,
    setor_id: s.setorId,
    descricao: s.descricao,
    categoria: s.categoria,
    prioridade: s.prioridade,
    valor_estimado: s.valorEstimado,
    fornecedor_sugerido_id: s.fornecedorSugeridoId,
    justificativa: s.justificativa,
    status: s.status,
    responsavel: s.responsavel,
    data_aprovacao: s.dataAprovacao,
    data_reprovacao: s.dataReprovacao,
    motivo_reprovacao: s.motivoReprovacao,
    data_lancamento: s.dataLancamento,
    numero_oc_relacionada: s.numeroOCRelacionada,
    observacoes: s.observacoes,
    anexos: s.anexos,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    deleted_at: s.deletedAt,
  }));

  const ocRows = state.ocs.map((o) => ({
    id: o.id,
    numero_oc: o.numeroOC,
    sc_id: o.scId,
    fornecedor_id: o.fornecedorId,
    data_oc: o.dataOC,
    data_emissao: o.dataEmissao,
    data_prevista_entrega: o.dataPrevistaEntrega,
    data_real_entrega: o.dataRealEntrega,
    valor_oc: o.valorOC,
    setor_id: o.setorId,
    responsavel: o.responsavel,
    status: o.status,
    condicao_pagamento: o.condicaoPagamento,
    observacoes: o.observacoes,
    anexos: o.anexos,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    deleted_at: o.deletedAt,
  }));

  const auditRows = state.auditoria.map((a) => ({
    id: a.id,
    usuario: a.usuario,
    role: a.role,
    acao: a.acao,
    entidade: a.entidade,
    entidade_id: a.entidadeId,
    antes: a.antes,
    depois: a.depois,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
    deleted_at: a.deletedAt,
  }));

  const [r1, r2, r3, r4, r5] = await Promise.all([
    client.from("sectors").upsert(sectorsRows, { onConflict: "id" }),
    client.from("suppliers").upsert(suppliersRows, { onConflict: "id" }),
    client.from("purchase_requests").upsert(scRows, { onConflict: "id" }),
    client.from("purchase_orders").upsert(ocRows, { onConflict: "id" }),
    client.from("audit_logs").upsert(auditRows, { onConflict: "id" }),
  ]);

  return !r1.error && !r2.error && !r3.error && !r4.error && !r5.error;
}
