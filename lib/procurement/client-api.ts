import { AppState, CurrentUser, GlobalFilters, OCStatus, PurchaseOrder, PurchaseRequest, SCStatus, Sector, Supplier } from "@/lib/procurement/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const res = await fetch(url, {
    ...init,
    cache: method === "GET" ? "no-store" : init?.cache,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "Erro de requisicao");
  }

  const persistenceMeta = data as T & { persisted?: boolean; warning?: string };
  if (method !== "GET" && persistenceMeta.persisted === false) {
    throw new Error(persistenceMeta.warning || "Dados atualizados apenas em memoria. Persistencia indisponivel.");
  }

  return data;
}

function actorHeaders(user: CurrentUser | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!user) return headers;
  headers["x-user-name"] = user.nome;
  headers["x-user-role"] = user.role;
  return headers;
}

export async function apiLogin(email: string, senha: string) {
  return request<{ user: CurrentUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
}

export async function apiMe() {
  return request<{ user: CurrentUser }>("/api/auth/me");
}

export async function apiLogout() {
  return request<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function apiGetState(filters: GlobalFilters) {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  return request<{ state: AppState } & Record<string, unknown>>(`/api/procurement/state?${qs.toString()}`);
}

export async function apiReplaceState(state: AppState, user: CurrentUser | null) {
  return request<{ state: AppState }>("/api/procurement/state", {
    method: "POST",
    headers: actorHeaders(user),
    body: JSON.stringify({ state }),
  });
}

export async function apiCreateSector(payload: Omit<Sector, "id" | "createdAt" | "updatedAt" | "deletedAt">, user: CurrentUser | null) {
  return request<{ item: Sector }>("/api/procurement/setores", {
    method: "POST",
    headers: actorHeaders(user),
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateSector(id: string, payload: Partial<Sector>, user: CurrentUser | null) {
  return request<{ item: Sector }>(`/api/procurement/setores/${id}`, {
    method: "PATCH",
    headers: actorHeaders(user),
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteSector(id: string, user: CurrentUser | null) {
  return request<{ item: Sector }>(`/api/procurement/setores/${id}`, {
    method: "DELETE",
    headers: actorHeaders(user),
  });
}

export async function apiCreateSupplier(payload: Omit<Supplier, "id" | "createdAt" | "updatedAt" | "deletedAt">, user: CurrentUser | null) {
  return request<{ item: Supplier }>("/api/procurement/fornecedores", {
    method: "POST",
    headers: actorHeaders(user),
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateSupplier(id: string, payload: Partial<Supplier>, user: CurrentUser | null) {
  return request<{ item: Supplier }>(`/api/procurement/fornecedores/${id}`, {
    method: "PATCH",
    headers: actorHeaders(user),
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteSupplier(id: string, user: CurrentUser | null) {
  return request<{ item: Supplier }>(`/api/procurement/fornecedores/${id}`, {
    method: "DELETE",
    headers: actorHeaders(user),
  });
}

export async function apiCreateSC(payload: Omit<PurchaseRequest, "id" | "createdAt" | "updatedAt" | "deletedAt">, user: CurrentUser | null) {
  return request<{ item: PurchaseRequest }>("/api/procurement/sc", {
    method: "POST",
    headers: actorHeaders(user),
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateSC(id: string, payload: Partial<PurchaseRequest>, user: CurrentUser | null) {
  return request<{ item: PurchaseRequest }>(`/api/procurement/sc/${id}`, {
    method: "PATCH",
    headers: actorHeaders(user),
    body: JSON.stringify(payload),
  });
}

export async function apiChangeSCStatus(id: string, status: SCStatus, user: CurrentUser | null, motivoReprovacao?: string) {
  return request<{ item: PurchaseRequest }>(`/api/procurement/sc/${id}`, {
    method: "PATCH",
    headers: actorHeaders(user),
    body: JSON.stringify({ status, motivoReprovacao }),
  });
}

export async function apiDeleteSC(id: string, user: CurrentUser | null) {
  return request<{ item: PurchaseRequest }>(`/api/procurement/sc/${id}`, {
    method: "DELETE",
    headers: actorHeaders(user),
  });
}

export async function apiCreateOC(payload: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "deletedAt">, user: CurrentUser | null) {
  return request<{ item: PurchaseOrder }>("/api/procurement/oc", {
    method: "POST",
    headers: actorHeaders(user),
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateOC(id: string, payload: Partial<PurchaseOrder>, user: CurrentUser | null) {
  return request<{ item: PurchaseOrder }>(`/api/procurement/oc/${id}`, {
    method: "PATCH",
    headers: actorHeaders(user),
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteOC(id: string, user: CurrentUser | null) {
  return request<{ item: PurchaseOrder }>(`/api/procurement/oc/${id}`, {
    method: "DELETE",
    headers: actorHeaders(user),
  });
}

export async function apiMoveKanban(entity: "SC" | "OC", id: string, targetStatus: SCStatus | OCStatus, user: CurrentUser | null) {
  return request<{ item: PurchaseRequest | PurchaseOrder }>("/api/procurement/kanban/move", {
    method: "POST",
    headers: actorHeaders(user),
    body: JSON.stringify({ entity, id, targetStatus }),
  });
}
