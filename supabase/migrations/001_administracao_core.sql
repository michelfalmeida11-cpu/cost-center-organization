-- Módulo Administração - Core Schema (Supabase/PostgreSQL)
-- Observação: mantém compatibilidade com arquitetura existente, sem alterar UI global.

create extension if not exists "pgcrypto";

create table if not exists public.adm_users (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  cpf text not null unique,
  email text not null unique,
  phone text,
  role_title text,
  department text,
  cost_center text,
  project text,
  employee_code text,
  photo_url text,
  password_hash text not null,
  status text not null check (status in ('ATIVO', 'INATIVO', 'BLOQUEADO', 'FERIAS', 'AFASTADO')) default 'ATIVO',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  notes text
);

create table if not exists public.adm_profiles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.adm_permissions (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  permission_key text not null check (permission_key in ('VISUALIZAR', 'CADASTRAR', 'EDITAR', 'EXCLUIR', 'EXPORTAR', 'IMPORTAR', 'CONFIGURAR', 'AUDITAR', 'ADMINISTRAR')),
  description text,
  created_at timestamptz not null default now(),
  unique (module_key, permission_key)
);

create table if not exists public.adm_profile_permissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.adm_profiles(id) on delete cascade,
  permission_id uuid not null references public.adm_permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, permission_id)
);

create table if not exists public.adm_user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.adm_users(id) on delete cascade,
  profile_id uuid not null references public.adm_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, profile_id)
);

create table if not exists public.adm_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.adm_users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  ip text,
  device text,
  module text not null,
  screen text not null,
  action text not null,
  old_value jsonb,
  new_value jsonb
);

create table if not exists public.adm_system_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.adm_users(id) on delete set null,
  event_type text not null check (event_type in ('LOGIN', 'LOGOUT', 'TENTATIVA', 'FALHA', 'ERRO', 'EXCECAO')),
  level text not null check (level in ('INFO', 'WARN', 'ERROR', 'CRITICAL')) default 'INFO',
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.adm_backup_jobs (
  id uuid primary key default gen_random_uuid(),
  backup_type text not null check (backup_type in ('MANUAL', 'AUTOMATICO')),
  status text not null check (status in ('PENDENTE', 'EM_EXECUCAO', 'CONCLUIDO', 'FALHOU')) default 'PENDENTE',
  file_url text,
  executed_by uuid references public.adm_users(id) on delete set null,
  started_at timestamptz,
  finished_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.adm_system_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  system_name text,
  logo_url text,
  theme text,
  language text,
  currency text,
  date_format text,
  smtp_host text,
  smtp_port integer,
  smtp_user text,
  smtp_password text,
  notification_email text,
  database_name text,
  integrations jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_adm_users_status on public.adm_users(status);
create index if not exists idx_adm_users_email on public.adm_users(email);
create index if not exists idx_adm_permissions_module on public.adm_permissions(module_key);
create index if not exists idx_adm_audit_logs_occurred_at on public.adm_audit_logs(occurred_at desc);
create index if not exists idx_adm_system_logs_created_at on public.adm_system_logs(created_at desc);
create index if not exists idx_adm_backup_jobs_created_at on public.adm_backup_jobs(created_at desc);
