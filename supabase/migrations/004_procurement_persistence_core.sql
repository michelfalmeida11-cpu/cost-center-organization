-- Core persistence tables used by lib/procurement/repository-supabase-ready.ts
-- Apply in Supabase SQL editor after existing migrations.

create table if not exists public.sectors (
  id text primary key,
  nome text not null,
  descricao text not null default '',
  ativo boolean not null default true,
  created_at text not null,
  updated_at text not null,
  deleted_at text
);

create table if not exists public.suppliers (
  id text primary key,
  codigo text not null,
  razao_social text not null,
  nome_fantasia text not null,
  cnpj text not null,
  contato text not null default '',
  telefone text not null default '',
  email text not null default '',
  cidade text not null default '',
  estado text not null default '',
  categoria text not null default '',
  status text not null default 'ATIVO',
  observacoes text not null default '',
  created_at text not null,
  updated_at text not null,
  deleted_at text
);

create table if not exists public.purchase_requests (
  id text primary key,
  numero_sc text not null,
  data_criacao text not null,
  solicitante text not null,
  setor_id text not null,
  descricao text not null,
  categoria text not null default '',
  prioridade text not null default 'MEDIA',
  valor_estimado numeric not null default 0,
  fornecedor_sugerido_id text,
  justificativa text not null default '',
  status text not null default 'EM_ANALISE',
  responsavel text not null default '',
  data_aprovacao text,
  data_reprovacao text,
  motivo_reprovacao text,
  data_lancamento text,
  numero_oc_relacionada text,
  observacoes text not null default '',
  anexos jsonb not null default '[]'::jsonb,
  created_at text not null,
  updated_at text not null,
  deleted_at text
);

create table if not exists public.purchase_orders (
  id text primary key,
  numero_oc text not null,
  sc_id text not null,
  fornecedor_id text not null,
  data_oc text not null,
  data_emissao text not null,
  data_prevista_entrega text not null,
  data_real_entrega text,
  valor_oc numeric not null default 0,
  setor_id text not null,
  responsavel text not null default '',
  status text not null default 'CRIADA',
  condicao_pagamento text not null default '',
  observacoes text not null default '',
  anexos jsonb not null default '[]'::jsonb,
  created_at text not null,
  updated_at text not null,
  deleted_at text
);

create table if not exists public.audit_logs (
  id text primary key,
  usuario text not null,
  role text not null,
  acao text not null,
  entidade text not null,
  entidade_id text not null,
  antes text not null default '',
  depois text not null default '',
  created_at text not null,
  updated_at text not null,
  deleted_at text
);

create index if not exists idx_purchase_requests_numero_sc on public.purchase_requests (numero_sc);
create index if not exists idx_purchase_orders_numero_oc on public.purchase_orders (numero_oc);
create index if not exists idx_purchase_orders_status on public.purchase_orders (status);
create index if not exists idx_purchase_requests_status on public.purchase_requests (status);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at);
