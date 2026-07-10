export const ADMIN_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "operacao", label: "Operação" },
  { key: "suprimentos", label: "Suprimentos" },
  { key: "administracao", label: "Administração" },
  { key: "usuarios", label: "Usuários" },
  { key: "perfis", label: "Perfis" },
  { key: "permissoes", label: "Permissões" },
  { key: "auditoria", label: "Auditoria" },
  { key: "configuracoes", label: "Configurações" },
  { key: "logs", label: "Logs" },
  { key: "backup", label: "Backup" },
] as const;

export const ADMIN_PROFILES = [
  "Administrador",
  "Diretoria",
  "Gerente",
  "Supervisor",
  "Operador",
  "Consulta",
] as const;

export const USER_STATUS_LABELS = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  BLOQUEADO: "Bloqueado",
  FERIAS: "Férias",
  AFASTADO: "Afastado",
} as const;
