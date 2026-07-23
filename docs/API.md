# Procurement API v1 (Next Route Handlers)

Base local:

- `/api/auth/login`
- `/api/auth/me`
- `/api/auth/logout`
- `/api/procurement/state`
- `/api/procurement/admin/seed`
- `/api/procurement/audit`
- `/api/procurement/kanban/move`
- `/api/procurement/setores`
- `/api/procurement/setores/:id`
- `/api/procurement/fornecedores`
- `/api/procurement/fornecedores/:id`
- `/api/procurement/sc`
- `/api/procurement/sc/:id`
- `/api/procurement/oc`
- `/api/procurement/oc/:id`

## Authentication

### POST `/api/auth/login`
Body:

```json
{
  "email": "admin@cyberproc.local",
  "senha": "Admin@123"
}
```

Response:

```json
{
  "user": {
    "nome": "Administrador",
    "email": "admin@cyberproc.local",
    "role": "ADMINISTRADOR"
  }
}
```

## Authentication and permissions

- Login retorna cookie de sessao HTTP-only assinado (`cyberproc_session`).
- Rotas `/api/procurement/*` exigem sessao valida.
- Rotas de escrita validam perfil.

Roles with write access:

- `ADMINISTRADOR`
- `COMPRAS`
- `GESTOR`

## Aggregated state

### GET `/api/procurement/state`
Optional query params:

- `periodoInicio`
- `periodoFim`
- `ano`
- `mes`
- `setorId`
- `fornecedorId`
- `status`
- `responsavel`
- `sc`
- `oc`

Returns raw state, filtered datasets and dashboard blocks (KPIs, series, ranking, alerts).

Also returns persistence metadata:

```json
{
  "persistence": {
    "driver": "memory|supabase",
    "hydrated": true
  }
}
```

Persistence note:

- Source of truth in Supabase: `sectors`, `suppliers`, `purchase_requests`, `purchase_orders`, `audit_logs`.

## Pagination pattern

List endpoints accept:

- `page` (default 1)
- `pageSize` (default 20, max 200)

Common response format:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

Additional filters:

- `setores`: `search`, `ativo`
- `fornecedores`: `search`, `status`, `categoria`
- `sc`: `search`, `status`, `setorId`, `fornecedorId`, `responsavel`, `ano`, `mes`
- `oc`: `search`, `status`, `setorId`, `fornecedorId`, `responsavel`, `ano`, `mes`
- `audit`: `entidade`, `acao`, `usuario`

## Kanban move

### POST `/api/procurement/kanban/move`
Body:

```json
{
  "entity": "SC",
  "id": "sc-1",
  "targetStatus": "APROVADA"
}
```

## Admin seed

### POST `/api/procurement/admin/seed`

- Reaplica os dados mock oficiais no banco relacional Supabase.
- Requer sessao autenticada com role `ADMINISTRADOR`.

Response:

```json
{
  "message": "Seed aplicado com sucesso no estado relacional.",
  "totals": {
    "setores": 3,
    "fornecedores": 3,
    "scs": 4,
    "ocs": 3,
    "auditoria": 1
  }
}
```

## CRUD summary

- `GET /api/procurement/setores`
- `POST /api/procurement/setores`
- `PATCH /api/procurement/setores/:id`
- `DELETE /api/procurement/setores/:id` (soft delete)

- `GET /api/procurement/fornecedores`
- `POST /api/procurement/fornecedores`
- `PATCH /api/procurement/fornecedores/:id`
- `DELETE /api/procurement/fornecedores/:id` (soft delete)

- `GET /api/procurement/sc`
- `POST /api/procurement/sc`
- `PATCH /api/procurement/sc/:id` (includes status transitions)
- `DELETE /api/procurement/sc/:id` (soft delete)

- `GET /api/procurement/oc`
- `POST /api/procurement/oc`
- `PATCH /api/procurement/oc/:id`
- `DELETE /api/procurement/oc/:id` (soft delete)

## Notes

- Current persistence is in-memory server store for bootstrap phase.
- Same contracts should be preserved when switching internals to Supabase/PostgreSQL.
- Middleware protege chamadas de API sem sessao.
- Driver de persistencia pode ser comutado por `PROCUREMENT_PERSISTENCE_DRIVER` (`memory` ou `supabase`).
