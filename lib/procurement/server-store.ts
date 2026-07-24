import { MOCK_STATE, MOCK_USERS, applyAutomaticOcStatus, buildAlerts, computeKpis, filterData, monthlySeries, sectorSeries, statusSeries, supplierRanking } from "@/lib/procurement/data";
import { AppState, AuditLog, EntityType, OCStatus, PurchaseOrder, PurchaseRequest, Role, SCStatus, Sector, Supplier } from "@/lib/procurement/types";
import { getConfiguredDriver, loadStateFromSupabase, saveStateToSupabase } from "@/lib/procurement/repository-supabase-ready";

const GLOBAL_KEY = "__cyberproc_store__";

type Store = {
  state: AppState;
};

let hydrationPromise: Promise<void> | null = null;
let isHydrated = false;

function normalizedState(state: AppState): AppState {
  return {
    ...state,
    ocs: state.ocs.map(applyAutomaticOcStatus),
  };
}

type PageQuery = {
  page?: number;
  pageSize?: number;
};

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

function paginate<T>(items: T[], query?: PageQuery): Paginated<T> {
  const page = Math.max(1, query?.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, query?.pageSize ?? 20));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

function nowDateTime() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getStore(): Store {
  const globalAny = globalThis as typeof globalThis & { [GLOBAL_KEY]?: Store };
  if (!globalAny[GLOBAL_KEY]) {
    globalAny[GLOBAL_KEY] = {
      state: {
        ...MOCK_STATE,
        ocs: MOCK_STATE.ocs.map(applyAutomaticOcStatus),
      },
    };
  }
  return globalAny[GLOBAL_KEY] as Store;
}

function persistAsync() {
  if (getConfiguredDriver() !== "supabase") return;
  const snapshot = getStore().state;
  void saveStateToSupabase(snapshot);
}

export async function persistNow() {
  if (getConfiguredDriver() !== "supabase") return true;
  return saveStateToSupabase(getStore().state);
}

export async function ensureStoreHydrated() {
  if (isHydrated) return;
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      if (getConfiguredDriver() === "supabase") {
        const loaded = await loadStateFromSupabase();
        if (loaded) {
          getStore().state = normalizedState(loaded);
        }
      }
      isHydrated = true;
    })();
  }
  await hydrationPromise;
}

export function getPersistenceInfo() {
  return {
    driver: getConfiguredDriver(),
    hydrated: isHydrated,
  };
}

function audit(role: Role, usuario: string, entidade: EntityType, entidadeId: string, acao: string, antes: unknown, depois: unknown) {
  const log: AuditLog = {
    id: makeId("audit"),
    usuario,
    role,
    acao,
    entidade,
    entidadeId,
    antes: JSON.stringify(antes),
    depois: JSON.stringify(depois),
    createdAt: nowDateTime(),
    updatedAt: nowDateTime(),
    deletedAt: null,
  };
  getStore().state.auditoria = [log, ...getStore().state.auditoria];
}

export function login(email: string, senha: string) {
  const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) return null;
  if (user.senha !== senha) return null;
  return {
    nome: user.nome,
    email: user.email,
    role: user.role,
  };
}

export function listState() {
  return getStore().state;
}

export function listDashboard() {
  const state = getStore().state;
  const empty = {
    periodoInicio: "",
    periodoFim: "",
    ano: "",
    mes: "",
    setorId: "",
    fornecedorId: "",
    status: "",
    responsavel: "",
    sc: "",
    oc: "",
  };
  return {
    kpis: computeKpis(state, empty),
    monthly: monthlySeries(state, empty),
    sectors: sectorSeries(state, empty),
    statuses: statusSeries(state, empty),
    ranking: supplierRanking(state, empty),
    alerts: buildAlerts(state, empty),
  };
}

export function listSetores(query?: PageQuery & { search?: string; ativo?: string }) {
  const filtered = getStore().state.setores.filter((x) => {
    if (x.deletedAt) return false;
    if (query?.search && !x.nome.toLowerCase().includes(query.search.toLowerCase())) return false;
    if (query?.ativo === "true" && !x.ativo) return false;
    if (query?.ativo === "false" && x.ativo) return false;
    return true;
  });
  return paginate(filtered, query);
}

export function createSetor(payload: Omit<Sector, "id" | "createdAt" | "updatedAt" | "deletedAt">, actor: { nome: string; role: Role }) {
  const item: Sector = {
    ...payload,
    id: makeId("setor"),
    createdAt: nowDate(),
    updatedAt: nowDate(),
    deletedAt: null,
  };
  getStore().state.setores = [item, ...getStore().state.setores];
  audit(actor.role, actor.nome, "SETOR", item.id, "CREATE", null, item);
  return item;
}

export function updateSetor(id: string, payload: Partial<Sector>, actor: { nome: string; role: Role }) {
  const state = getStore().state;
  const before = state.setores.find((x) => x.id === id);
  if (!before) return null;
  const after = { ...before, ...payload, updatedAt: nowDate() };
  state.setores = state.setores.map((x) => (x.id === id ? after : x));
  audit(actor.role, actor.nome, "SETOR", id, "UPDATE", before, after);
  return after;
}

export function deleteSetor(id: string, actor: { nome: string; role: Role }) {
  return updateSetor(id, { deletedAt: nowDate() }, actor);
}

export function listFornecedores(query?: PageQuery & { search?: string; status?: Supplier["status"]; categoria?: string }) {
  const filtered = getStore().state.fornecedores.filter((x) => {
    if (x.deletedAt) return false;
    if (query?.search) {
      const q = query.search.toLowerCase();
      if (![x.codigo, x.nomeFantasia, x.razaoSocial, x.cnpj].some((f) => f.toLowerCase().includes(q))) return false;
    }
    if (query?.status && x.status !== query.status) return false;
    if (query?.categoria && !x.categoria.toLowerCase().includes(query.categoria.toLowerCase())) return false;
    return true;
  });
  return paginate(filtered, query);
}

export function createFornecedor(payload: Omit<Supplier, "id" | "createdAt" | "updatedAt" | "deletedAt">, actor: { nome: string; role: Role }) {
  const item: Supplier = {
    ...payload,
    id: makeId("forn"),
    createdAt: nowDate(),
    updatedAt: nowDate(),
    deletedAt: null,
  };
  getStore().state.fornecedores = [item, ...getStore().state.fornecedores];
  audit(actor.role, actor.nome, "FORNECEDOR", item.id, "CREATE", null, item);
  return item;
}

export function updateFornecedor(id: string, payload: Partial<Supplier>, actor: { nome: string; role: Role }) {
  const state = getStore().state;
  const before = state.fornecedores.find((x) => x.id === id);
  if (!before) return null;
  const after = { ...before, ...payload, updatedAt: nowDate() };
  state.fornecedores = state.fornecedores.map((x) => (x.id === id ? after : x));
  audit(actor.role, actor.nome, "FORNECEDOR", id, "UPDATE", before, after);
  return after;
}

export function deleteFornecedor(id: string, actor: { nome: string; role: Role }) {
  return updateFornecedor(id, { deletedAt: nowDate() }, actor);
}

export function listSC(query?: PageQuery & { search?: string; status?: SCStatus; setorId?: string; fornecedorId?: string; responsavel?: string; ano?: string; mes?: string }) {
  const filtered = getStore().state.scs.filter((x) => {
    if (x.deletedAt) return false;
    if (query?.search) {
      const q = query.search.toLowerCase();
      if (![x.numeroSC, x.descricao, x.solicitante, x.categoria].some((f) => f.toLowerCase().includes(q))) return false;
    }
    if (query?.status && x.status !== query.status) return false;
    if (query?.setorId && x.setorId !== query.setorId) return false;
    if (query?.fornecedorId && x.fornecedorSugeridoId !== query.fornecedorId) return false;
    if (query?.responsavel && !x.responsavel.toLowerCase().includes(query.responsavel.toLowerCase())) return false;
    if (query?.ano && !x.dataCriacao.startsWith(query.ano)) return false;
    if (query?.mes && x.dataCriacao.slice(5, 7) !== query.mes.padStart(2, "0")) return false;
    return true;
  });
  return paginate(filtered, query);
}

export function createSC(payload: Omit<PurchaseRequest, "id" | "createdAt" | "updatedAt" | "deletedAt">, actor: { nome: string; role: Role }) {
  const item: PurchaseRequest = {
    ...payload,
    id: makeId("sc"),
    createdAt: nowDate(),
    updatedAt: nowDate(),
    deletedAt: null,
  };
  getStore().state.scs = [item, ...getStore().state.scs];
  audit(actor.role, actor.nome, "SC", item.id, "CREATE", null, item);
  return item;
}

export function updateSC(id: string, payload: Partial<PurchaseRequest>, actor: { nome: string; role: Role }) {
  const state = getStore().state;
  const before = state.scs.find((x) => x.id === id);
  if (!before) return null;
  const after = { ...before, ...payload, updatedAt: nowDate() };
  state.scs = state.scs.map((x) => (x.id === id ? after : x));
  audit(actor.role, actor.nome, "SC", id, "UPDATE", before, after);
  return after;
}

export function deleteSC(id: string, actor: { nome: string; role: Role }) {
  return updateSC(id, { deletedAt: nowDate() }, actor);
}

export function changeSCStatus(id: string, status: SCStatus, actor: { nome: string; role: Role }, motivo?: string) {
  const state = getStore().state;
  const before = state.scs.find((x) => x.id === id);
  if (!before) return null;
  const after: PurchaseRequest = { ...before, status, updatedAt: nowDate() };
  if (status === "APROVADA") after.dataAprovacao = nowDate();
  if (status === "REPROVADA") {
    after.dataReprovacao = nowDate();
    after.motivoReprovacao = motivo ?? "Sem motivo informado";
  }
  if (status === "LANCADA") after.dataLancamento = nowDate();
  state.scs = state.scs.map((x) => (x.id === id ? after : x));
  audit(actor.role, actor.nome, "SC", id, "STATUS_CHANGE", before, after);
  return after;
}

export function listOC(query?: PageQuery & { search?: string; status?: OCStatus; setorId?: string; fornecedorId?: string; responsavel?: string; ano?: string; mes?: string }) {
  const state = getStore().state;
  state.ocs = state.ocs.map(applyAutomaticOcStatus);
  const filtered = state.ocs.filter((x) => {
    if (x.deletedAt) return false;
    if (query?.search) {
      const q = query.search.toLowerCase();
      if (![x.numeroOC, x.condicaoPagamento, x.observacoes, x.responsavel].some((f) => f.toLowerCase().includes(q))) return false;
    }
    if (query?.status && x.status !== query.status) return false;
    if (query?.setorId && x.setorId !== query.setorId) return false;
    if (query?.fornecedorId && x.fornecedorId !== query.fornecedorId) return false;
    if (query?.responsavel && !x.responsavel.toLowerCase().includes(query.responsavel.toLowerCase())) return false;
    if (query?.ano && !x.dataOC.startsWith(query.ano)) return false;
    if (query?.mes && x.dataOC.slice(5, 7) !== query.mes.padStart(2, "0")) return false;
    return true;
  });
  return paginate(filtered, query);
}

export function createOC(payload: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "deletedAt">, actor: { nome: string; role: Role }) {
  const item: PurchaseOrder = applyAutomaticOcStatus({
    ...payload,
    id: makeId("oc"),
    createdAt: nowDate(),
    updatedAt: nowDate(),
    deletedAt: null,
  });
  getStore().state.ocs = [item, ...getStore().state.ocs].map(applyAutomaticOcStatus);
  audit(actor.role, actor.nome, "OC", item.id, "CREATE", null, item);
  return item;
}

export function updateOC(id: string, payload: Partial<PurchaseOrder>, actor: { nome: string; role: Role }) {
  const state = getStore().state;
  const before = state.ocs.find((x) => x.id === id);
  if (!before) return null;
  const after = applyAutomaticOcStatus({ ...before, ...payload, updatedAt: nowDate() });
  state.ocs = state.ocs.map((x) => (x.id === id ? after : x)).map(applyAutomaticOcStatus);
  audit(actor.role, actor.nome, "OC", id, "UPDATE", before, after);
  return after;
}

export function deleteOC(id: string, actor: { nome: string; role: Role }) {
  return updateOC(id, { deletedAt: nowDate() }, actor);
}

export function moveKanban(entity: "SC" | "OC", id: string, targetStatus: string, actor: { nome: string; role: Role }) {
  if (entity === "SC") {
    return changeSCStatus(id, targetStatus as SCStatus, actor);
  }
  return updateOC(id, { status: targetStatus as OCStatus }, actor);
}

export function listAudit(query?: PageQuery & { entidade?: string; acao?: string; usuario?: string }) {
  const filtered = getStore().state.auditoria.filter((x) => {
    if (query?.entidade && x.entidade !== query.entidade) return false;
    if (query?.acao && x.acao !== query.acao) return false;
    if (query?.usuario && !x.usuario.toLowerCase().includes(query.usuario.toLowerCase())) return false;
    return true;
  });
  return paginate(filtered, query);
}

export function replaceState(payload: AppState, actor: { nome: string; role: Role }) {
  const before = getStore().state;
  getStore().state = {
    ...payload,
    ocs: payload.ocs.map(applyAutomaticOcStatus),
  };
  audit(actor.role, actor.nome, "SC", "bulk", "IMPORT", before, getStore().state);
  return getStore().state;
}

export async function seedMockState(actor: { nome: string; role: Role }) {
  const before = getStore().state;
  getStore().state = normalizedState(MOCK_STATE);
  audit(actor.role, actor.nome, "SC", "seed", "SEED", before, getStore().state);
  await persistNow();
  return getStore().state;
}

export function queryState(params: URLSearchParams) {
  const filters = {
    periodoInicio: params.get("periodoInicio") ?? "",
    periodoFim: params.get("periodoFim") ?? "",
    ano: params.get("ano") ?? "",
    mes: params.get("mes") ?? "",
    setorId: params.get("setorId") ?? "",
    fornecedorId: params.get("fornecedorId") ?? "",
    status: params.get("status") ?? "",
    responsavel: params.get("responsavel") ?? "",
    sc: params.get("sc") ?? "",
    oc: params.get("oc") ?? "",
  };

  const state = getStore().state;
  const filtered = filterData(state, filters);

  return {
    filters,
    state,
    filtered,
    dashboard: {
      kpis: computeKpis(state, filters),
      monthly: monthlySeries(state, filters),
      sectors: sectorSeries(state, filters),
      statuses: statusSeries(state, filters),
      ranking: supplierRanking(state, filters),
      alerts: buildAlerts(state, filters),
    },
  };
}
