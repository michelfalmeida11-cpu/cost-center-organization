# TODO — ERP Infraestrutura v1 (Supabase SQL)

## Restrições obrigatórias
- [ ] Nunca remover funcionalidades existentes
- [ ] Nunca alterar Layout
- [ ] Nunca alterar Sidebar
- [ ] Nunca alterar Header
- [ ] Nunca alterar Dashboard
- [ ] Sempre reutilizar código existente
- [ ] Manter SOLID + Clean Code
- [ ] TypeScript em todo código novo

## Milestone 1 — Banco enterprise com Supabase (PostgreSQL)
- [x] Dependências base instaladas (`react-hook-form`, `zod`, `@hookform/resolvers`, `@supabase/supabase-js`)
- [x] Cliente Supabase existente (`lib/supabase.ts`) identificado e reutilizado
- [ ] Criar migrations SQL em `supabase/migrations`:
  - [ ] `001_administracao_core.sql` (users, profiles, permissions, profile_permissions, user_profiles, audit_logs, system_logs, backup_jobs, system_settings)
- [ ] Criar seed SQL em `supabase/seeds`:
  - [ ] `001_administracao_seed.sql` (perfis, permissões e dados iniciais)
- [ ] Executar scripts no projeto Supabase e validar estrutura

## Milestone 2 — Arquitetura backend (Clean + SOLID)
- [ ] Estruturar camadas em `modules/administracao`:
  - [ ] `types/`
  - [ ] `schemas/` (Zod)
  - [ ] `repositories/` (Supabase)
  - [ ] `services/`
- [ ] Padronizar contratos de erro/resposta

## Milestone 3 — REST APIs Administração
- [ ] Criar APIs em `app/api/administracao/**/route.ts`:
  - [ ] Usuários (CRUD completo)
  - [ ] Perfis
  - [ ] Permissões (RBAC)
  - [ ] Auditoria
  - [ ] Logs
  - [ ] Backup
  - [ ] Configurações
- [ ] Validar entradas com Zod

## Milestone 4 — UI Administração (sem tocar globais)
- [ ] Criar página `/administracao` com abas internas:
  - [ ] Usuários
  - [ ] Perfis
  - [ ] Permissões
  - [ ] Auditoria
  - [ ] Configurações
  - [ ] Logs
  - [ ] Backup
- [ ] Reutilizar componentes existentes (`DashboardHeader`, `Tabs`, `Card`, `Button`, `Input`)
- [ ] Formulários com React Hook Form + Zod

## Milestone 5 — Testes e validação
- [ ] Backend:
  - [ ] Testar endpoints principais (happy path + erro)
  - [ ] Verificar RBAC básico
  - [ ] Verificar logs/auditoria
- [ ] Qualidade:
  - [ ] `npm run build`
  - [ ] `npm run lint`
  - [ ] TypeScript sem erros
  - [ ] Imports válidos
- [ ] Frontend:
  - [ ] Responsividade desktop/notebook/tablet/mobile
  - [ ] Acessibilidade básica
