-- ERP Mineração - RLS estrito por tenant e perfil

-- Helper: empresa do usuário logado
create or replace function public.erp_current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.company_id
  from public.erp_users u
  where u.id = auth.uid()
  limit 1;
$$;

-- Helper: usuário com perfil administrador
create or replace function public.erp_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.erp_user_profiles up
    join public.erp_profiles p on p.id = up.profile_id
    where up.user_id = auth.uid()
      and (p.code = 'ADMIN' or p.code = 'ADMINISTRADOR')
      and p.is_active = true
  );
$$;

revoke all on function public.erp_current_company_id() from public;
grant execute on function public.erp_current_company_id() to authenticated;

revoke all on function public.erp_is_admin() from public;
grant execute on function public.erp_is_admin() to authenticated;

-- Remoção de políticas amplas da migração anterior
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
  end loop;
end $$;

-- Tabelas globais de segurança (somente admin)
create policy erp_profiles_admin_all on public.erp_profiles
for all
using (public.erp_is_admin())
with check (public.erp_is_admin());

create policy erp_permissions_admin_all on public.erp_permissions
for all
using (public.erp_is_admin())
with check (public.erp_is_admin());

create policy erp_profile_permissions_admin_all on public.erp_profile_permissions
for all
using (public.erp_is_admin())
with check (public.erp_is_admin());

-- Empresas: leitura no tenant ou admin; escrita admin
create policy erp_companies_select_tenant on public.erp_companies
for select
using (id = public.erp_current_company_id() or public.erp_is_admin());

create policy erp_companies_mutate_admin on public.erp_companies
for all
using (public.erp_is_admin())
with check (public.erp_is_admin());

-- Usuários: admin gerencia tenant; usuário pode ver/editar próprio registro básico
create policy erp_users_select_tenant on public.erp_users
for select
using (
  company_id = public.erp_current_company_id()
  or id = auth.uid()
  or public.erp_is_admin()
);

create policy erp_users_update_self on public.erp_users
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy erp_users_admin_all on public.erp_users
for all
using (public.erp_is_admin())
with check (public.erp_is_admin());

create policy erp_user_profiles_admin_all on public.erp_user_profiles
for all
using (public.erp_is_admin())
with check (public.erp_is_admin());

-- Cadastros mestre por empresa
create policy erp_cost_centers_tenant_all on public.erp_cost_centers
for all
using (company_id = public.erp_current_company_id() or public.erp_is_admin())
with check (company_id = public.erp_current_company_id() or public.erp_is_admin());

create policy erp_suppliers_tenant_all on public.erp_suppliers
for all
using (company_id = public.erp_current_company_id() or public.erp_is_admin())
with check (company_id = public.erp_current_company_id() or public.erp_is_admin());

create policy erp_cost_categories_tenant_all on public.erp_cost_categories
for all
using (company_id = public.erp_current_company_id() or public.erp_is_admin())
with check (company_id = public.erp_current_company_id() or public.erp_is_admin());

create policy erp_cost_types_tenant_all on public.erp_cost_types
for all
using (company_id = public.erp_current_company_id() or public.erp_is_admin())
with check (company_id = public.erp_current_company_id() or public.erp_is_admin());

-- Operação por empresa
create policy erp_equipments_tenant_all on public.erp_equipments
for all
using (company_id = public.erp_current_company_id() or public.erp_is_admin())
with check (company_id = public.erp_current_company_id() or public.erp_is_admin());

create policy erp_operational_costs_tenant_all on public.erp_operational_costs
for all
using (company_id = public.erp_current_company_id() or public.erp_is_admin())
with check (company_id = public.erp_current_company_id() or public.erp_is_admin());

create policy erp_diesel_entries_tenant_all on public.erp_diesel_entries
for all
using (company_id = public.erp_current_company_id() or public.erp_is_admin())
with check (company_id = public.erp_current_company_id() or public.erp_is_admin());

create policy erp_drilling_entries_tenant_all on public.erp_drilling_entries
for all
using (company_id = public.erp_current_company_id() or public.erp_is_admin())
with check (company_id = public.erp_current_company_id() or public.erp_is_admin());

create policy erp_blasting_entries_tenant_all on public.erp_blasting_entries
for all
using (company_id = public.erp_current_company_id() or public.erp_is_admin())
with check (company_id = public.erp_current_company_id() or public.erp_is_admin());

create policy erp_logistics_entries_tenant_all on public.erp_logistics_entries
for all
using (company_id = public.erp_current_company_id() or public.erp_is_admin())
with check (company_id = public.erp_current_company_id() or public.erp_is_admin());

create policy erp_settings_tenant_all on public.erp_settings
for all
using (company_id = public.erp_current_company_id() or public.erp_is_admin())
with check (company_id = public.erp_current_company_id() or public.erp_is_admin());

-- Histórico: leitura apenas admin
create policy erp_change_history_select_admin on public.erp_change_history
for select
using (public.erp_is_admin());

-- Garante que usuários comuns não escrevam histórico direto
create policy erp_change_history_no_mutation on public.erp_change_history
for all
using (public.erp_is_admin())
with check (public.erp_is_admin());
