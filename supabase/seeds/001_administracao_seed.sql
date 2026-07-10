-- Seed inicial do módulo Administração (Supabase/PostgreSQL)

insert into public.adm_profiles (code, name, description)
values
  ('ADMINISTRADOR', 'Administrador', 'Acesso total ao sistema'),
  ('DIRETORIA', 'Diretoria', 'Acesso executivo e estratégico'),
  ('GERENTE', 'Gerente', 'Gestão de equipes e processos'),
  ('SUPERVISOR', 'Supervisor', 'Supervisão operacional'),
  ('OPERADOR', 'Operador', 'Operação diária com permissões limitadas'),
  ('CONSULTA', 'Consulta', 'Somente leitura')
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description;

with modules as (
  select unnest(array[
    'DASHBOARD',
    'SUPRIMENTOS',
    'OPERACAO',
    'ADMINISTRACAO',
    'USUARIOS',
    'PERFIS',
    'PERMISSOES',
    'AUDITORIA',
    'CONFIGURACOES',
    'LOGS',
    'BACKUP'
  ]) as module_key
),
actions as (
  select unnest(array[
    'VISUALIZAR',
    'CADASTRAR',
    'EDITAR',
    'EXCLUIR',
    'EXPORTAR',
    'IMPORTAR',
    'CONFIGURAR',
    'AUDITAR',
    'ADMINISTRAR'
  ]) as permission_key
)
insert into public.adm_permissions (module_key, permission_key, description)
select
  m.module_key,
  a.permission_key,
  m.module_key || ' - ' || a.permission_key
from modules m
cross join actions a
on conflict (module_key, permission_key) do nothing;

insert into public.adm_system_settings (
  company_name,
  system_name,
  theme,
  language,
  currency,
  date_format,
  notification_email,
  database_name,
  integrations
)
values (
  'Grupo AVG',
  'ERP Mina do Brumado',
  'light',
  'pt-BR',
  'BRL',
  'DD/MM/YYYY',
  'admin@avg.local',
  'supabase-postgres',
  '{}'::jsonb
)
on conflict do nothing;
