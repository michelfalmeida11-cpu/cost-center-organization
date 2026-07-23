-- Supabase schema for CyberProc Control Center

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Relational tables (source of truth)
create table if not exists sectors (
  id text primary key,
  nome text not null,
  descricao text not null default '',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists suppliers (
  id text primary key,
  codigo text not null unique,
  razao_social text not null,
  nome_fantasia text not null,
  cnpj text not null unique,
  contato text not null default '',
  telefone text not null default '',
  email text not null default '',
  cidade text not null default '',
  estado text not null default '',
  categoria text not null default 'Geral',
  status text not null check (status in ('ATIVO', 'INATIVO', 'BLOQUEADO')),
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists purchase_requests (
  id text primary key,
  numero_sc text not null unique,
  data_criacao text not null,
  solicitante text not null,
  setor_id text not null references sectors(id),
  descricao text not null,
  categoria text not null default '',
  prioridade text not null check (prioridade in ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')),
  valor_estimado numeric(16,2) not null default 0,
  fornecedor_sugerido_id text references suppliers(id),
  justificativa text not null default '',
  status text not null check (status in ('EM_ANALISE', 'APROVADA', 'REPROVADA', 'LANCADA')),
  responsavel text not null default '',
  data_aprovacao text,
  data_reprovacao text,
  motivo_reprovacao text,
  data_lancamento text,
  numero_oc_relacionada text,
  observacoes text not null default '',
  anexos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists purchase_orders (
  id text primary key,
  numero_oc text not null unique,
  sc_id text not null references purchase_requests(id),
  fornecedor_id text not null references suppliers(id),
  data_oc text not null,
  data_emissao text not null,
  data_prevista_entrega text not null,
  data_real_entrega text,
  valor_oc numeric(16,2) not null default 0,
  setor_id text not null references sectors(id),
  responsavel text not null default '',
  status text not null check (status in ('CRIADA','ENVIADA_FORNECEDOR','CONFIRMADA','EM_PRODUCAO','EM_TRANSPORTE','ENTREGUE','ATRASADA','CANCELADA')),
  condicao_pagamento text not null default '',
  observacoes text not null default '',
  anexos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists audit_logs (
  id text primary key,
  usuario text not null,
  role text not null check (role in ('ADMINISTRADOR','COMPRAS','GESTOR','SOLICITANTE','VISUALIZACAO')),
  acao text not null,
  entidade text not null check (entidade in ('SC','OC','FORNECEDOR','SETOR')),
  entidade_id text not null,
  antes text not null,
  depois text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists purchase_requests_status_idx on purchase_requests(status);
create index if not exists purchase_requests_setor_idx on purchase_requests(setor_id);
create index if not exists purchase_orders_status_idx on purchase_orders(status);
create index if not exists purchase_orders_setor_idx on purchase_orders(setor_id);
create index if not exists purchase_orders_fornecedor_idx on purchase_orders(fornecedor_id);
create index if not exists audit_logs_created_at_idx on audit_logs(created_at desc);

drop trigger if exists trg_sectors_updated_at on sectors;
create trigger trg_sectors_updated_at before update on sectors for each row execute function set_updated_at();

drop trigger if exists trg_suppliers_updated_at on suppliers;
create trigger trg_suppliers_updated_at before update on suppliers for each row execute function set_updated_at();

drop trigger if exists trg_purchase_requests_updated_at on purchase_requests;
create trigger trg_purchase_requests_updated_at before update on purchase_requests for each row execute function set_updated_at();

drop trigger if exists trg_purchase_orders_updated_at on purchase_orders;
create trigger trg_purchase_orders_updated_at before update on purchase_orders for each row execute function set_updated_at();

drop trigger if exists trg_audit_logs_updated_at on audit_logs;
create trigger trg_audit_logs_updated_at before update on audit_logs for each row execute function set_updated_at();
