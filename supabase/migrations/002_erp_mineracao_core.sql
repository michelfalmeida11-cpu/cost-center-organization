-- ERP Mineração - Core transacional, analytics e segurança

create extension if not exists pgcrypto;

-- =========================
-- Tipos
-- =========================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'erp_equipment_status') then
    create type public.erp_equipment_status as enum ('ATIVO', 'MANUTENCAO', 'PARADO', 'INATIVO');
  end if;

  if not exists (select 1 from pg_type where typname = 'erp_entry_source') then
    create type public.erp_entry_source as enum ('CUSTO_OPERACIONAL', 'DIESEL', 'PERFURACAO', 'DESMONTE', 'LOGISTICA', 'MANUAL');
  end if;
end $$;

-- =========================
-- Administração e cadastros mestres
-- =========================

create table if not exists public.erp_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  legal_name text,
  tax_id text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_profiles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_permissions (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  action_key text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (module_key, action_key)
);

create table if not exists public.erp_profile_permissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.erp_profiles(id) on delete cascade,
  permission_id uuid not null references public.erp_permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, permission_id)
);

create table if not exists public.erp_users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.erp_companies(id) on delete set null,
  full_name text not null,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.erp_users(id) on delete cascade,
  profile_id uuid not null references public.erp_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, profile_id)
);

create table if not exists public.erp_cost_centers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.erp_companies(id) on delete cascade,
  code text not null,
  name text not null,
  sector text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);

create table if not exists public.erp_suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.erp_companies(id) on delete cascade,
  name text not null,
  document text,
  email text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_cost_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.erp_companies(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.erp_cost_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.erp_companies(id) on delete cascade,
  name text not null,
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

-- =========================
-- Operação
-- =========================

create table if not exists public.erp_equipments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.erp_companies(id) on delete cascade,
  cost_center_id uuid references public.erp_cost_centers(id) on delete set null,
  name text not null,
  model text,
  manufacturer text,
  year integer,
  hourmeter numeric(14,2) not null default 0,
  worked_hours numeric(14,2) not null default 0,
  downtime_hours numeric(14,2) not null default 0,
  status public.erp_equipment_status not null default 'ATIVO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_operational_costs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.erp_companies(id) on delete cascade,
  occurred_at date not null,
  cost_center_id uuid references public.erp_cost_centers(id) on delete set null,
  equipment_id uuid references public.erp_equipments(id) on delete set null,
  category_id uuid references public.erp_cost_categories(id) on delete set null,
  cost_type_id uuid references public.erp_cost_types(id) on delete set null,
  quantity numeric(18,4) not null default 0,
  unit text,
  unit_value numeric(18,4) not null default 0,
  total_value numeric(18,2) generated always as (round((quantity * unit_value)::numeric, 2)) stored,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_diesel_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.erp_companies(id) on delete cascade,
  occurred_at date not null,
  equipment_id uuid not null references public.erp_equipments(id) on delete cascade,
  driver_name text,
  liters numeric(18,3) not null,
  value_per_liter numeric(18,4) not null,
  total_value numeric(18,2) generated always as (round((liters * value_per_liter)::numeric, 2)) stored,
  hourmeter numeric(14,2),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_drilling_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.erp_companies(id) on delete cascade,
  occurred_at date not null,
  equipment_id uuid not null references public.erp_equipments(id) on delete cascade,
  operator_name text,
  drilled_meters numeric(18,2) not null default 0,
  holes_count integer not null default 0,
  worked_time_hours numeric(18,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_blasting_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.erp_companies(id) on delete cascade,
  occurred_at date not null,
  bench text,
  explosive text,
  quantity numeric(18,3) not null default 0,
  volume numeric(18,2) not null default 0,
  cost_value numeric(18,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_logistics_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.erp_companies(id) on delete cascade,
  occurred_at date not null,
  truck text,
  driver_name text,
  trips integer not null default 0,
  distance_km numeric(18,2) not null default 0,
  tons numeric(18,2) not null default 0,
  transport_cost numeric(18,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- Relatórios e configurações
-- =========================

create table if not exists public.erp_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.erp_companies(id) on delete cascade,
  theme text default 'dark-premium',
  logo_url text,
  preferences jsonb not null default '{}'::jsonb,
  integrations jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_change_history (
  id bigserial primary key,
  table_name text not null,
  record_id text not null,
  operation text not null,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

-- =========================
-- Índices
-- =========================

create index if not exists idx_erp_costs_company_date on public.erp_operational_costs(company_id, occurred_at desc);
create index if not exists idx_erp_diesel_company_date on public.erp_diesel_entries(company_id, occurred_at desc);
create index if not exists idx_erp_drilling_company_date on public.erp_drilling_entries(company_id, occurred_at desc);
create index if not exists idx_erp_blasting_company_date on public.erp_blasting_entries(company_id, occurred_at desc);
create index if not exists idx_erp_logistics_company_date on public.erp_logistics_entries(company_id, occurred_at desc);
create index if not exists idx_erp_equipment_company on public.erp_equipments(company_id);
create index if not exists idx_erp_cost_center_company on public.erp_cost_centers(company_id);

-- =========================
-- Funções utilitárias
-- =========================

create or replace function public.erp_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.erp_track_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec_id text;
begin
  rec_id := coalesce((case when tg_op = 'DELETE' then old.id::text else new.id::text end), 'sem-id');

  insert into public.erp_change_history (table_name, record_id, operation, old_data, new_data, changed_by)
  values (
    tg_table_name,
    rec_id,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    auth.uid()
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

-- =========================
-- Triggers updated_at
-- =========================

drop trigger if exists trg_erp_companies_updated_at on public.erp_companies;
create trigger trg_erp_companies_updated_at before update on public.erp_companies
for each row execute function public.erp_set_updated_at();

drop trigger if exists trg_erp_profiles_updated_at on public.erp_profiles;
create trigger trg_erp_profiles_updated_at before update on public.erp_profiles
for each row execute function public.erp_set_updated_at();

drop trigger if exists trg_erp_users_updated_at on public.erp_users;
create trigger trg_erp_users_updated_at before update on public.erp_users
for each row execute function public.erp_set_updated_at();

drop trigger if exists trg_erp_cost_centers_updated_at on public.erp_cost_centers;
create trigger trg_erp_cost_centers_updated_at before update on public.erp_cost_centers
for each row execute function public.erp_set_updated_at();

drop trigger if exists trg_erp_suppliers_updated_at on public.erp_suppliers;
create trigger trg_erp_suppliers_updated_at before update on public.erp_suppliers
for each row execute function public.erp_set_updated_at();

drop trigger if exists trg_erp_cost_categories_updated_at on public.erp_cost_categories;
create trigger trg_erp_cost_categories_updated_at before update on public.erp_cost_categories
for each row execute function public.erp_set_updated_at();

drop trigger if exists trg_erp_cost_types_updated_at on public.erp_cost_types;
create trigger trg_erp_cost_types_updated_at before update on public.erp_cost_types
for each row execute function public.erp_set_updated_at();

drop trigger if exists trg_erp_equipments_updated_at on public.erp_equipments;
create trigger trg_erp_equipments_updated_at before update on public.erp_equipments
for each row execute function public.erp_set_updated_at();

drop trigger if exists trg_erp_operational_costs_updated_at on public.erp_operational_costs;
create trigger trg_erp_operational_costs_updated_at before update on public.erp_operational_costs
for each row execute function public.erp_set_updated_at();

drop trigger if exists trg_erp_diesel_entries_updated_at on public.erp_diesel_entries;
create trigger trg_erp_diesel_entries_updated_at before update on public.erp_diesel_entries
for each row execute function public.erp_set_updated_at();

drop trigger if exists trg_erp_drilling_entries_updated_at on public.erp_drilling_entries;
create trigger trg_erp_drilling_entries_updated_at before update on public.erp_drilling_entries
for each row execute function public.erp_set_updated_at();

drop trigger if exists trg_erp_blasting_entries_updated_at on public.erp_blasting_entries;
create trigger trg_erp_blasting_entries_updated_at before update on public.erp_blasting_entries
for each row execute function public.erp_set_updated_at();

drop trigger if exists trg_erp_logistics_entries_updated_at on public.erp_logistics_entries;
create trigger trg_erp_logistics_entries_updated_at before update on public.erp_logistics_entries
for each row execute function public.erp_set_updated_at();

drop trigger if exists trg_erp_settings_updated_at on public.erp_settings;
create trigger trg_erp_settings_updated_at before update on public.erp_settings
for each row execute function public.erp_set_updated_at();

-- =========================
-- Triggers de auditoria
-- =========================

drop trigger if exists trg_hist_erp_companies on public.erp_companies;
create trigger trg_hist_erp_companies after insert or update or delete on public.erp_companies
for each row execute function public.erp_track_changes();

drop trigger if exists trg_hist_erp_users on public.erp_users;
create trigger trg_hist_erp_users after insert or update or delete on public.erp_users
for each row execute function public.erp_track_changes();

drop trigger if exists trg_hist_erp_equipments on public.erp_equipments;
create trigger trg_hist_erp_equipments after insert or update or delete on public.erp_equipments
for each row execute function public.erp_track_changes();

drop trigger if exists trg_hist_erp_operational_costs on public.erp_operational_costs;
create trigger trg_hist_erp_operational_costs after insert or update or delete on public.erp_operational_costs
for each row execute function public.erp_track_changes();

drop trigger if exists trg_hist_erp_diesel_entries on public.erp_diesel_entries;
create trigger trg_hist_erp_diesel_entries after insert or update or delete on public.erp_diesel_entries
for each row execute function public.erp_track_changes();

drop trigger if exists trg_hist_erp_drilling_entries on public.erp_drilling_entries;
create trigger trg_hist_erp_drilling_entries after insert or update or delete on public.erp_drilling_entries
for each row execute function public.erp_track_changes();

drop trigger if exists trg_hist_erp_blasting_entries on public.erp_blasting_entries;
create trigger trg_hist_erp_blasting_entries after insert or update or delete on public.erp_blasting_entries
for each row execute function public.erp_track_changes();

drop trigger if exists trg_hist_erp_logistics_entries on public.erp_logistics_entries;
create trigger trg_hist_erp_logistics_entries after insert or update or delete on public.erp_logistics_entries
for each row execute function public.erp_track_changes();

-- =========================
-- View consolidada para dashboards
-- =========================

create or replace view public.erp_v_fact_costs as
select
  oc.id,
  oc.company_id,
  oc.occurred_at,
  oc.cost_center_id,
  oc.equipment_id,
  cc.sector,
  'CUSTO_OPERACIONAL'::public.erp_entry_source as source,
  oc.total_value as amount,
  null::numeric as tons,
  null::numeric as drilled_meters,
  null::integer as holes_count,
  null::numeric as liters,
  null::numeric as worked_hours,
  null::numeric as downtime_hours
from public.erp_operational_costs oc
left join public.erp_cost_centers cc on cc.id = oc.cost_center_id

union all

select
  de.id,
  de.company_id,
  de.occurred_at,
  eq.cost_center_id,
  de.equipment_id,
  cc.sector,
  'DIESEL'::public.erp_entry_source as source,
  de.total_value as amount,
  null::numeric as tons,
  null::numeric as drilled_meters,
  null::integer as holes_count,
  de.liters,
  eq.worked_hours,
  eq.downtime_hours
from public.erp_diesel_entries de
join public.erp_equipments eq on eq.id = de.equipment_id
left join public.erp_cost_centers cc on cc.id = eq.cost_center_id

union all

select
  dr.id,
  dr.company_id,
  dr.occurred_at,
  eq.cost_center_id,
  dr.equipment_id,
  cc.sector,
  'PERFURACAO'::public.erp_entry_source as source,
  0::numeric as amount,
  null::numeric as tons,
  dr.drilled_meters,
  dr.holes_count,
  null::numeric as liters,
  eq.worked_hours,
  eq.downtime_hours
from public.erp_drilling_entries dr
join public.erp_equipments eq on eq.id = dr.equipment_id
left join public.erp_cost_centers cc on cc.id = eq.cost_center_id

union all

select
  bl.id,
  bl.company_id,
  bl.occurred_at,
  null::uuid as cost_center_id,
  null::uuid as equipment_id,
  null::text as sector,
  'DESMONTE'::public.erp_entry_source as source,
  bl.cost_value as amount,
  bl.volume as tons,
  null::numeric as drilled_meters,
  null::integer as holes_count,
  null::numeric as liters,
  null::numeric as worked_hours,
  null::numeric as downtime_hours
from public.erp_blasting_entries bl

union all

select
  lo.id,
  lo.company_id,
  lo.occurred_at,
  null::uuid as cost_center_id,
  null::uuid as equipment_id,
  null::text as sector,
  'LOGISTICA'::public.erp_entry_source as source,
  lo.transport_cost as amount,
  lo.tons,
  null::numeric as drilled_meters,
  null::integer as holes_count,
  null::numeric as liters,
  null::numeric as worked_hours,
  null::numeric as downtime_hours
from public.erp_logistics_entries lo;

-- =========================
-- Função de KPIs
-- =========================

create or replace function public.erp_dashboard_kpis(
  p_company uuid default null,
  p_start date default null,
  p_end date default null,
  p_cost_center uuid default null,
  p_equipment uuid default null,
  p_sector text default null
)
returns table (
  custo_operacional_total numeric,
  custo_por_tonelada numeric,
  custo_por_metro_perfurado numeric,
  custo_por_furo numeric,
  consumo_diesel numeric,
  disponibilidade_fisica numeric
)
language sql
stable
as $$
with base as (
  select *
  from public.erp_v_fact_costs v
  where (p_company is null or v.company_id = p_company)
    and (p_start is null or v.occurred_at >= p_start)
    and (p_end is null or v.occurred_at <= p_end)
    and (p_cost_center is null or v.cost_center_id = p_cost_center)
    and (p_equipment is null or v.equipment_id = p_equipment)
    and (p_sector is null or v.sector = p_sector)
), agg as (
  select
    coalesce(sum(amount), 0) as custo_total,
    coalesce(sum(tons), 0) as total_tons,
    coalesce(sum(drilled_meters), 0) as total_meters,
    coalesce(sum(holes_count), 0) as total_holes,
    coalesce(sum(liters), 0) as total_liters,
    coalesce(sum(worked_hours), 0) as total_worked,
    coalesce(sum(downtime_hours), 0) as total_downtime
  from base
)
select
  agg.custo_total as custo_operacional_total,
  case when agg.total_tons > 0 then round((agg.custo_total / agg.total_tons)::numeric, 4) else 0 end as custo_por_tonelada,
  case when agg.total_meters > 0 then round((agg.custo_total / agg.total_meters)::numeric, 4) else 0 end as custo_por_metro_perfurado,
  case when agg.total_holes > 0 then round((agg.custo_total / agg.total_holes)::numeric, 4) else 0 end as custo_por_furo,
  agg.total_liters as consumo_diesel,
  case when (agg.total_worked + agg.total_downtime) > 0
    then round((agg.total_worked / (agg.total_worked + agg.total_downtime) * 100)::numeric, 2)
    else 0
  end as disponibilidade_fisica
from agg;
$$;

-- =========================
-- Segurança - RLS
-- =========================

alter table public.erp_companies enable row level security;
alter table public.erp_profiles enable row level security;
alter table public.erp_permissions enable row level security;
alter table public.erp_profile_permissions enable row level security;
alter table public.erp_users enable row level security;
alter table public.erp_user_profiles enable row level security;
alter table public.erp_cost_centers enable row level security;
alter table public.erp_suppliers enable row level security;
alter table public.erp_cost_categories enable row level security;
alter table public.erp_cost_types enable row level security;
alter table public.erp_equipments enable row level security;
alter table public.erp_operational_costs enable row level security;
alter table public.erp_diesel_entries enable row level security;
alter table public.erp_drilling_entries enable row level security;
alter table public.erp_blasting_entries enable row level security;
alter table public.erp_logistics_entries enable row level security;
alter table public.erp_settings enable row level security;
alter table public.erp_change_history enable row level security;

create or replace function public.erp_is_authenticated()
returns boolean
language sql
stable
as $$
  select auth.uid() is not null;
$$;

-- Políticas padrão: usuário autenticado pode operar.
-- Para produção multi-tenant estrita, substituir por checagem de company_id por usuário.

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'erp_companies','erp_profiles','erp_permissions','erp_profile_permissions','erp_users','erp_user_profiles',
    'erp_cost_centers','erp_suppliers','erp_cost_categories','erp_cost_types','erp_equipments','erp_operational_costs',
    'erp_diesel_entries','erp_drilling_entries','erp_blasting_entries','erp_logistics_entries','erp_settings','erp_change_history'
  ]
  loop
    execute format('drop policy if exists %I_authenticated_all on public.%I', tbl, tbl);
    execute format(
      'create policy %I_authenticated_all on public.%I for all using (public.erp_is_authenticated()) with check (public.erp_is_authenticated())',
      tbl,
      tbl
    );
  end loop;
end $$;

-- A view herda RLS das tabelas base. Garantia de acesso apenas autenticado via grants.
grant select on public.erp_v_fact_costs to authenticated;
grant execute on function public.erp_dashboard_kpis(uuid, date, date, uuid, uuid, text) to authenticated;
