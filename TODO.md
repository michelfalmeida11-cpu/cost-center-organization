# TODO — Estrutura visual Fiori/Fusion (sem Dashboard/CRUD/páginas)

- [ ] Passo 1: Criar módulo `components/fiori/**` com tokens/utilidades (paleta + tipografia + bordas + sombras)
- [ ] Passo 2: Criar design system base em `components/fiori/components/ui/**`
  - [ ] Button, Input, Select, DatePicker
  - [ ] Card, MetricCard, InfoCard, StatusCard, ChartCard
  - [ ] Section, Tabs, Accordion, Badge, Progress
  - [ ] Tooltip, Popover, Dropdown
  - [ ] Table, Loading, Skeleton, EmptyState/ErrorState
- [ ] Passo 3: Implementar layout visual no módulo
  - [ ] `FioriSidebar` (fixa 280px, colapso, tooltips, scroll independente, menu ativo destacado, separadores, rodapé)
  - [ ] `FioriHeader` (fixo 72px, blur, breadcrumb, search + filtros + atualizar/exportar + notificações + theme toggle + avatar dropdown)
  - [ ] `FioriFooter` (versão/usuário/banco/ambiente/ano)
  - [ ] `FioriShell` (montagem completa)
- [ ] Passo 4: Adicionar animações (framer-motion) nos componentes principais e estados
- [ ] Passo 5: Revisão final: TypeScript, imports, responsividade, performance (lazy/dynamic), acessibilidade
- [ ] Passo 6: Rodar `npm run lint` e `npm run build`
- [ ] Passo 7: Listar arquivos criados e explicar rapidamente cada componente

