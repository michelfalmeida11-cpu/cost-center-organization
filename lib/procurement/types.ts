export type Role = "ADMINISTRADOR" | "COMPRAS" | "GESTOR" | "SOLICITANTE" | "VISUALIZACAO";

export type Priority = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export type AlertLevel = "NORMAL" | "ATENCAO" | "CRITICO";

export type SCStatus = "EM_ANALISE" | "APROVADA" | "REPROVADA" | "LANCADA";

export type OCStatus =
  | "CRIADA"
  | "ENVIADA_FORNECEDOR"
  | "CONFIRMADA"
  | "EM_PRODUCAO"
  | "EM_TRANSPORTE"
  | "ENTREGUE"
  | "ATRASADA"
  | "CANCELADA";

export type EntityType = "SC" | "OC" | "FORNECEDOR" | "SETOR";

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Sector extends BaseEntity {
  nome: string;
  descricao: string;
  ativo: boolean;
}

export interface Supplier extends BaseEntity {
  codigo: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  contato: string;
  telefone: string;
  email: string;
  cidade: string;
  estado: string;
  categoria: string;
  status: "ATIVO" | "INATIVO" | "BLOQUEADO";
  observacoes: string;
}

export interface PurchaseRequest extends BaseEntity {
  numeroSC: string;
  dataCriacao: string;
  solicitante: string;
  setorId: string;
  descricao: string;
  categoria: string;
  prioridade: Priority;
  valorEstimado: number;
  fornecedorSugeridoId: string | null;
  justificativa: string;
  status: SCStatus;
  responsavel: string;
  dataAprovacao: string | null;
  dataReprovacao: string | null;
  motivoReprovacao: string | null;
  dataLancamento: string | null;
  numeroOCRelacionada: string | null;
  observacoes: string;
  anexos: string[];
}

export interface PurchaseOrder extends BaseEntity {
  numeroOC: string;
  scId: string;
  fornecedorId: string;
  dataOC: string;
  dataEmissao: string;
  dataPrevistaEntrega: string;
  dataRealEntrega: string | null;
  valorOC: number;
  setorId: string;
  responsavel: string;
  status: OCStatus;
  condicaoPagamento: string;
  observacoes: string;
  anexos: string[];
}

export interface AuditLog extends BaseEntity {
  usuario: string;
  role: Role;
  acao: string;
  entidade: EntityType;
  entidadeId: string;
  antes: string;
  depois: string;
}

export interface GlobalFilters {
  periodoInicio: string;
  periodoFim: string;
  ano: string;
  mes: string;
  setorId: string;
  fornecedorId: string;
  status: string;
  responsavel: string;
  sc: string;
  oc: string;
}

export interface KpiSnapshot {
  totalSC: number;
  totalOC: number;
  valorTotalSC: number;
  valorTotalOC: number;
  fornecedoresAtivos: number;
  entregasPendentes: number;
  entregasAtrasadas: number;
  emAnalise: number;
  aprovadas: number;
  reprovadas: number;
  lancadas: number;
  entregues: number;
  tempoMedioAprovacaoDias: number;
  tempoMedioSCparaOCDias: number;
  leadTimeMedioDias: number;
  tempoMedioEntregaDias: number;
  taxaEntregaNoPrazo: number;
}

export interface AlertItem {
  id: string;
  nivel: AlertLevel;
  tipo: string;
  mensagem: string;
  referencia: string;
}

export interface CurrentUser {
  nome: string;
  email: string;
  role: Role;
}

export interface AppState {
  setores: Sector[];
  fornecedores: Supplier[];
  scs: PurchaseRequest[];
  ocs: PurchaseOrder[];
  auditoria: AuditLog[];
}
