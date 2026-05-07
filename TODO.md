# TODO — Rework premium (Next.js + Supabase)

## Fase 1 — Base enterprise + Auth/Rotas (ADMIN/VIEWER)
- [ ] Criar arquitetura de pastas enterprise (ui, auth, database, services, dashboard, charts)
- [ ] Implementar Supabase Auth (login premium)
- [ ] Criar `profiles` com role `ADMIN | VIEWER`
- [ ] Aplicar RLS policies (SELECT liberado, mutações apenas ADMIN)
- [ ] Criar middleware para proteger rotas do dashboard
- [ ] Criar helpers server/client para sessão Supabase

## Fase 2 — Persistência real (remover localStorage como fonte de verdade)
- [ ] Criar schema normalizado: processes, groups, subgroups (com relacionamentos)
- [ ] Implementar queries (hierarquia) e agregaçōes (totais/KPIs) server-side
- [ ] Remover `localStorage` do fluxo principal (manter apenas cache UI, se necessário)
- [ ] Garantir autosave via mutações no banco
- [ ] (Se viável) integrar realtime para atualizar dashboard em tempo real

## Fase 3 — CRUD dinâmico seguro
- [ ] Rebuild do painel CRUD (`CostCenterPanel`) baseado em dados do DB
- [ ] Bloquear visual e tecnicamente ações de ADMIN vs VIEWER
- [ ] CRUD: processos, grupos, subgrupos, budgeted/realized, delete
- [ ] Importar/exportar (ADMIN) usando endpoints protegidos

## Fase 4 — Dashboard premium + gráficos futuristas
- [ ] Rework da paleta e layout premium global (contraste perfeito)
- [ ] KPI cards premium (com tooltips e animações leves)
- [ ] Implementar gráficos pedidos:
  - [ ] Pizza 3D futurista
  - [ ] Barras animadas
  - [ ] Área comparativa
  - [ ] Evolução de custos (série temporal)
  - [ ] Orçado vs realizado
  - [ ] Distribuição por processo
- [ ] Ajustar responsividade total (mobile/tablet/desktop)

## Fase 5 — Novo processo MANUTENÇÃO
- [ ] Garantir que MANUTENÇÃO (MAN) aparece automaticamente via seed/DB
- [ ] Cor/ícone/kpis/gráficos/refletem no dashboard

## Fase 6 — Performance + deploy Vercel
- [ ] Remover riscos de hydration/SSR
- [ ] Otimizar re-renders (memo, suspense, isolating charts)
- [ ] Validar `next build` sem erros
- [ ] Ajustar env + vercel config

