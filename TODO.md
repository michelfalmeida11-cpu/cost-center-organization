# TODO - Plataforma Corporativa AVG (Next.js 14)

## Etapa 1 — Autenticação & bloqueio global
- [ ] Criar `AuthProvider` + hook `useAuth()`
- [ ] Modal elegante de senha (admin: **AVG12345**)
- [ ] Guardas: bloquear criação/edição/exclusão/alteração de orçamento/realizado/centro de custo/subgrupo/detalhamento
- [ ] Persistir sessão no `localStorage`
- [ ] Botão global “Modo Edição” + badge “Administrador” (verde) / “Somente leitura” (cinza)

## Etapa 2 — Estado global de dados editáveis + persistência real
- [ ] Criar `CostCentersProvider` (estado `processes`)
- [ ] Hidratação segura (não sobrescrever seed)
- [ ] Autosave inteligente (debounce) em localStorage e Supabase
- [ ] Sincronizar updates para todos os usuários (via persistência)

## Etapa 3 — Cálculos e atualização global automática
- [ ] Criar `lib/cost-calculations.ts` com cálculos puros (KPIs/totais/percentuais/rankings/distribuição)
- [ ] Atualizar `KpiSummary`, `BudgetChart`, `DistributionChart` para usar o estado do provider
- [ ] Remover dependência de `PROCESSES/COST_CENTERS` estáticos para cálculos reativos

## Etapa 4 — Gráficos premium (Recharts)
- [ ] Ajustar layout/altura e ocupação do card
- [ ] Melhorar tooltip, labels, gradientes e animações
- [ ] Aplicar innerRadius/outerRadius maiores e visual enterprise

## Etapa 5 — UX/UI corporativo e acessibilidade
- [ ] Trocar “Inline” por “Online” no projeto
- [ ] Padronizar contraste global: títulos 900, subtítulos 700, secundário 600
- [ ] Revisar cards/tabelas/inputs/menus/labels/gráficos

## Etapa 6 — Refatoração e performance
- [ ] Quebrar componentes grandes em subcomponentes/hook/cálculos
- [ ] `useMemo` para cálculos e props estáveis para reduzir rerenders

## Etapa 7 — Build & validação
- [ ] `npm run lint` e `npm run build`
- [ ] Testar cenários: não autenticado / autenticado / refresh / deploy

