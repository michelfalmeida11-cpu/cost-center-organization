# CyberProc Enterprise Architecture

## Current implementation in this repository

- Frontend: Next.js 14 + TypeScript + Tailwind + Recharts
- Single source of truth: `context/ProcurementContext.tsx`
- Data flow: state -> filters -> KPIs/charts/reports/excel
- Soft delete enabled in all entities (`deletedAt`)
- Audit trail enabled in client state (`auditoria`)
- Role-based permissions: ADMINISTRADOR, COMPRAS, GESTOR, SOLICITANTE, VISUALIZACAO
- Excel import/export with validation and duplicate detection
- Persistence driver readiness: `lib/procurement/repository-supabase-ready.ts` (memory default, supabase fallback-aware)

Environment variables for Supabase persistence:

- `PROCUREMENT_PERSISTENCE_DRIVER=supabase`
- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` (recommended server-side) or `SUPABASE_ANON_KEY`

Behavior:

- Backend hydrates state from Supabase relational tables on first request.
- Every mutation persists asynchronously to relational tables.
- `GET /api/procurement/state` exposes `{ persistence: { driver, hydrated } }`.
- `POST /api/procurement/admin/seed` reaplica o dataset mock para bootstrap controlado.

## Production target architecture

- Frontend: current Next.js app (App Router)
- Backend API: Next route handlers (`app/api/*`) or standalone Node.js service
- Auth: secure password hashing + JWT/session + RBAC middleware
- Database: Supabase PostgreSQL (`supabase/schema.sql`)
- Audit: persisted `AuditLog` table for all mutable operations
- Performance:
  - pagination in list endpoints
  - indexed queries in Supabase/Postgres schema
  - backend filtering
  - optional cache for dashboard snapshots

## Recommended rollout order

1. Configure PostgreSQL and `DATABASE_URL`
2. Provision Supabase project and apply `supabase/schema.sql`
3. Implement auth endpoints with hashed passwords
4. Move CRUD operations from local state to Supabase-backed endpoints
5. Preserve same domain contracts to keep UI stable
6. Add integration tests for SC -> OC -> delivery workflow
