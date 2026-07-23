import {
  AppState,
  GlobalFilters,
  KpiSnapshot,
  OCStatus,
  PurchaseOrder,
  PurchaseRequest,
  Role,
  SCStatus,
  AlertItem,
} from "./types";

const now = new Date();

export const SC_STATUS_LABEL: Record<SCStatus, string> = {
  EM_ANALISE: "Em Analise",
  APROVADA: "Aprovada",
  REPROVADA: "Reprovada",
  LANCADA: "Lancada",
};

export const OC_STATUS_LABEL: Record<OCStatus, string> = {
  CRIADA: "Criada",
  ENVIADA_FORNECEDOR: "Enviada ao Fornecedor",
  CONFIRMADA: "Confirmada",
  EM_PRODUCAO: "Em Producao",
  EM_TRANSPORTE: "Em Transporte",
  ENTREGUE: "Entregue",
  ATRASADA: "Atrasada",
  CANCELADA: "Cancelada",
};

export const SC_STATUS_FLOW: SCStatus[] = ["EM_ANALISE", "APROVADA", "REPROVADA", "LANCADA"];

export const OC_STATUS_FLOW: OCStatus[] = [
  "CRIADA",
  "ENVIADA_FORNECEDOR",
  "CONFIRMADA",
  "EM_PRODUCAO",
  "EM_TRANSPORTE",
  "ENTREGUE",
  "ATRASADA",
  "CANCELADA",
];

export const APP_MENU = [
  "DASHBOARD",
  "SC",
  "OC",
  "FORNECEDORES",
  "SETORES",
  "ACOMPANHAMENTO",
  "KPIS_ANALYTICS",
  "RELATORIOS",
  "EXCEL",
  "CONFIGURACOES",
] as const;

export type AppModule = (typeof APP_MENU)[number];

export const EMPTY_FILTERS: GlobalFilters = {
  periodoInicio: "",
  periodoFim: "",
  ano: "",
  mes: "",
  setorId: "",
  fornecedorId: "",
  status: "",
  responsavel: "",
  sc: "",
  oc: "",
};

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(start: string, end: string) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

export const MOCK_USERS: Array<{ email: string; senha: string; role: Role; nome: string }> = [
  { email: "admin@cyberproc.local", senha: "Admin@123", role: "ADMINISTRADOR", nome: "Administrador" },
  { email: "compras@cyberproc.local", senha: "Compras@123", role: "COMPRAS", nome: "Analista Compras" },
  { email: "gestor@cyberproc.local", senha: "Gestor@123", role: "GESTOR", nome: "Gestor Operacional" },
  { email: "solicitante@cyberproc.local", senha: "Solicitante@123", role: "SOLICITANTE", nome: "Solicitante" },
  { email: "viewer@cyberproc.local", senha: "Viewer@123", role: "VISUALIZACAO", nome: "Visualizacao" },
];

export const MOCK_STATE: AppState = {
  setores: [
    {
      id: "setor-manutencao",
      nome: "Manutencao",
      descricao: "Infra e manutencao industrial",
      ativo: true,
      createdAt: toIso(addDays(now, -400)),
      updatedAt: toIso(addDays(now, -3)),
      deletedAt: null,
    },
    {
      id: "setor-projeto",
      nome: "Projeto",
      descricao: "Projetos especiais e engenharia",
      ativo: true,
      createdAt: toIso(addDays(now, -390)),
      updatedAt: toIso(addDays(now, -12)),
      deletedAt: null,
    },
    {
      id: "setor-operacao",
      nome: "Operacao",
      descricao: "Operacao de mina e planta",
      ativo: true,
      createdAt: toIso(addDays(now, -380)),
      updatedAt: toIso(addDays(now, -8)),
      deletedAt: null,
    },
  ],
  fornecedores: [
    {
      id: "forn-1",
      codigo: "F001",
      razaoSocial: "NeoSteel Components LTDA",
      nomeFantasia: "NeoSteel",
      cnpj: "12.345.678/0001-90",
      contato: "Carla Dias",
      telefone: "(31) 99999-1001",
      email: "contato@neosteel.com.br",
      cidade: "Belo Horizonte",
      estado: "MG",
      categoria: "Estruturas",
      status: "ATIVO",
      observacoes: "Fornecedor estrategico",
      createdAt: toIso(addDays(now, -450)),
      updatedAt: toIso(addDays(now, -7)),
      deletedAt: null,
    },
    {
      id: "forn-2",
      codigo: "F002",
      razaoSocial: "Quantum Logistica SA",
      nomeFantasia: "Quantum",
      cnpj: "21.987.654/0001-11",
      contato: "Rafael Martins",
      telefone: "(31) 98888-2002",
      email: "atendimento@quantumlog.com",
      cidade: "Contagem",
      estado: "MG",
      categoria: "Logistica",
      status: "ATIVO",
      observacoes: "Especialista em transporte pesado",
      createdAt: toIso(addDays(now, -420)),
      updatedAt: toIso(addDays(now, -20)),
      deletedAt: null,
    },
    {
      id: "forn-3",
      codigo: "F003",
      razaoSocial: "HyperDrill Equipamentos",
      nomeFantasia: "HyperDrill",
      cnpj: "44.111.222/0001-33",
      contato: "Livia Rocha",
      telefone: "(31) 97777-3003",
      email: "comercial@hyperdrill.com",
      cidade: "Nova Lima",
      estado: "MG",
      categoria: "Equipamentos",
      status: "ATIVO",
      observacoes: "Contrato anual",
      createdAt: toIso(addDays(now, -380)),
      updatedAt: toIso(addDays(now, -15)),
      deletedAt: null,
    },
  ],
  scs: [
    {
      id: "sc-1",
      numeroSC: "SC-2026-0001",
      dataCriacao: toIso(addDays(now, -65)),
      solicitante: "Bruno Lima",
      setorId: "setor-manutencao",
      descricao: "Compra de rolamentos de alta durabilidade",
      categoria: "Pecas",
      prioridade: "ALTA",
      valorEstimado: 125000,
      fornecedorSugeridoId: "forn-1",
      justificativa: "Reposicao de estoque critico",
      status: "LANCADA",
      responsavel: "Equipe Compras",
      dataAprovacao: toIso(addDays(now, -60)),
      dataReprovacao: null,
      motivoReprovacao: null,
      dataLancamento: toIso(addDays(now, -58)),
      numeroOCRelacionada: "OC-2026-0098",
      observacoes: "Prioridade para parada de manutencao",
      anexos: ["escopo-tecnico.pdf"],
      createdAt: toIso(addDays(now, -65)),
      updatedAt: toIso(addDays(now, -56)),
      deletedAt: null,
    },
    {
      id: "sc-2",
      numeroSC: "SC-2026-0002",
      dataCriacao: toIso(addDays(now, -40)),
      solicitante: "Paula Mota",
      setorId: "setor-projeto",
      descricao: "Sensores IoT para monitoramento de vibracao",
      categoria: "Automacao",
      prioridade: "CRITICA",
      valorEstimado: 248000,
      fornecedorSugeridoId: "forn-3",
      justificativa: "Projeto de preditiva",
      status: "APROVADA",
      responsavel: "Marcelo Sena",
      dataAprovacao: toIso(addDays(now, -33)),
      dataReprovacao: null,
      motivoReprovacao: null,
      dataLancamento: null,
      numeroOCRelacionada: null,
      observacoes: "Aguardando fechamento de escopo",
      anexos: [],
      createdAt: toIso(addDays(now, -40)),
      updatedAt: toIso(addDays(now, -30)),
      deletedAt: null,
    },
    {
      id: "sc-3",
      numeroSC: "SC-2026-0003",
      dataCriacao: toIso(addDays(now, -15)),
      solicitante: "Renata Alves",
      setorId: "setor-operacao",
      descricao: "Contratacao de transporte para minerio",
      categoria: "Logistica",
      prioridade: "MEDIA",
      valorEstimado: 89000,
      fornecedorSugeridoId: "forn-2",
      justificativa: "Aumento sazonal de demanda",
      status: "EM_ANALISE",
      responsavel: "Equipe Compras",
      dataAprovacao: null,
      dataReprovacao: null,
      motivoReprovacao: null,
      dataLancamento: null,
      numeroOCRelacionada: null,
      observacoes: "Revisar SLA de entrega",
      anexos: ["cotacoes.xlsx"],
      createdAt: toIso(addDays(now, -15)),
      updatedAt: toIso(addDays(now, -3)),
      deletedAt: null,
    },
    {
      id: "sc-4",
      numeroSC: "SC-2026-0004",
      dataCriacao: toIso(addDays(now, -9)),
      solicitante: "Diego Prado",
      setorId: "setor-manutencao",
      descricao: "Lubrificantes especiais",
      categoria: "Consumiveis",
      prioridade: "BAIXA",
      valorEstimado: 22000,
      fornecedorSugeridoId: "forn-1",
      justificativa: "Manutencao preventiva",
      status: "REPROVADA",
      responsavel: "Marcelo Sena",
      dataAprovacao: null,
      dataReprovacao: toIso(addDays(now, -6)),
      motivoReprovacao: "Orcamento acima da media historica",
      dataLancamento: null,
      numeroOCRelacionada: null,
      observacoes: "Solicitacao replanejada para proximo trimestre",
      anexos: [],
      createdAt: toIso(addDays(now, -9)),
      updatedAt: toIso(addDays(now, -6)),
      deletedAt: null,
    },
  ],
  ocs: [
    {
      id: "oc-1",
      numeroOC: "OC-2026-0098",
      scId: "sc-1",
      fornecedorId: "forn-1",
      dataOC: toIso(addDays(now, -58)),
      dataEmissao: toIso(addDays(now, -57)),
      dataPrevistaEntrega: toIso(addDays(now, -20)),
      dataRealEntrega: toIso(addDays(now, -18)),
      valorOC: 123900,
      setorId: "setor-manutencao",
      responsavel: "Equipe Compras",
      status: "ENTREGUE",
      condicaoPagamento: "30/60",
      observacoes: "Entregue conforme planejamento",
      anexos: ["oc-0098.pdf"],
      createdAt: toIso(addDays(now, -58)),
      updatedAt: toIso(addDays(now, -18)),
      deletedAt: null,
    },
    {
      id: "oc-2",
      numeroOC: "OC-2026-0102",
      scId: "sc-2",
      fornecedorId: "forn-3",
      dataOC: toIso(addDays(now, -27)),
      dataEmissao: toIso(addDays(now, -26)),
      dataPrevistaEntrega: toIso(addDays(now, 8)),
      dataRealEntrega: null,
      valorOC: 241000,
      setorId: "setor-projeto",
      responsavel: "Marcelo Sena",
      status: "EM_PRODUCAO",
      condicaoPagamento: "45 dias",
      observacoes: "Fase de producao em andamento",
      anexos: [],
      createdAt: toIso(addDays(now, -27)),
      updatedAt: toIso(addDays(now, -2)),
      deletedAt: null,
    },
    {
      id: "oc-3",
      numeroOC: "OC-2026-0106",
      scId: "sc-3",
      fornecedorId: "forn-2",
      dataOC: toIso(addDays(now, -13)),
      dataEmissao: toIso(addDays(now, -12)),
      dataPrevistaEntrega: toIso(addDays(now, -1)),
      dataRealEntrega: null,
      valorOC: 88000,
      setorId: "setor-operacao",
      responsavel: "Equipe Compras",
      status: "EM_TRANSPORTE",
      condicaoPagamento: "28 dias",
      observacoes: "Carga aguardando janela de descarga",
      anexos: ["romaneio.pdf"],
      createdAt: toIso(addDays(now, -13)),
      updatedAt: toIso(addDays(now, -1)),
      deletedAt: null,
    },
  ],
  auditoria: [],
};

export function applyAutomaticOcStatus(oc: PurchaseOrder): PurchaseOrder {
  const today = toIso(new Date());
  if (oc.deletedAt) return oc;
  if (oc.status === "ENTREGUE" || oc.status === "CANCELADA") return oc;
  if (oc.dataRealEntrega && oc.dataRealEntrega <= today) {
    return { ...oc, status: "ENTREGUE" };
  }
  if (oc.dataPrevistaEntrega < today) {
    return { ...oc, status: "ATRASADA" };
  }
  return oc;
}

export function enrichOcMetrics(oc: PurchaseOrder) {
  const statusAjustado = applyAutomaticOcStatus(oc);
  const fim = statusAjustado.dataRealEntrega ?? toIso(new Date());
  const diasEmAberto = diffDays(statusAjustado.dataEmissao, fim);
  const diasParaEntrega = Math.max(0, diffDays(toIso(new Date()), statusAjustado.dataPrevistaEntrega));
  const diasAtraso = statusAjustado.status === "ATRASADA" || (statusAjustado.dataRealEntrega && statusAjustado.dataRealEntrega > statusAjustado.dataPrevistaEntrega)
    ? diffDays(statusAjustado.dataPrevistaEntrega, statusAjustado.dataRealEntrega ?? toIso(new Date()))
    : 0;
  const leadTime = diffDays(statusAjustado.dataOC, statusAjustado.dataRealEntrega ?? toIso(new Date()));

  return {
    ...statusAjustado,
    diasEmAberto,
    diasParaEntrega,
    diasAtraso,
    percentualAtraso: statusAjustado.valorOC > 0 && diasAtraso > 0 ? Number(((diasAtraso / Math.max(1, leadTime)) * 100).toFixed(2)) : 0,
    leadTime,
  };
}

export function filterData(state: AppState, filters: GlobalFilters) {
  const setoresAtivos = state.setores.filter((s) => !s.deletedAt);
  const fornecedoresAtivos = state.fornecedores.filter((f) => !f.deletedAt);
  const scsAtivas = state.scs.filter((sc) => !sc.deletedAt);
  const ocsAtivas = state.ocs.map(enrichOcMetrics).filter((oc) => !oc.deletedAt);

  const scFiltered = scsAtivas.filter((sc) => {
    if (filters.setorId && sc.setorId !== filters.setorId) return false;
    if (filters.fornecedorId && sc.fornecedorSugeridoId !== filters.fornecedorId) return false;
    if (filters.status && sc.status !== filters.status) return false;
    if (filters.responsavel && !sc.responsavel.toLowerCase().includes(filters.responsavel.toLowerCase())) return false;
    if (filters.sc && !sc.numeroSC.toLowerCase().includes(filters.sc.toLowerCase())) return false;
    if (filters.ano && !sc.dataCriacao.startsWith(filters.ano)) return false;
    if (filters.mes) {
      const month = sc.dataCriacao.slice(5, 7);
      if (month !== filters.mes.padStart(2, "0")) return false;
    }
    if (filters.periodoInicio && sc.dataCriacao < filters.periodoInicio) return false;
    if (filters.periodoFim && sc.dataCriacao > filters.periodoFim) return false;
    return true;
  });

  const ocFiltered = ocsAtivas.filter((oc) => {
    if (filters.setorId && oc.setorId !== filters.setorId) return false;
    if (filters.fornecedorId && oc.fornecedorId !== filters.fornecedorId) return false;
    if (filters.status && oc.status !== filters.status) return false;
    if (filters.responsavel && !oc.responsavel.toLowerCase().includes(filters.responsavel.toLowerCase())) return false;
    if (filters.oc && !oc.numeroOC.toLowerCase().includes(filters.oc.toLowerCase())) return false;
    if (filters.ano && !oc.dataOC.startsWith(filters.ano)) return false;
    if (filters.mes) {
      const month = oc.dataOC.slice(5, 7);
      if (month !== filters.mes.padStart(2, "0")) return false;
    }
    if (filters.periodoInicio && oc.dataOC < filters.periodoInicio) return false;
    if (filters.periodoFim && oc.dataOC > filters.periodoFim) return false;
    return true;
  });

  return {
    setoresAtivos,
    fornecedoresAtivos,
    scFiltered,
    ocFiltered,
  };
}

export function computeKpis(state: AppState, filters: GlobalFilters): KpiSnapshot {
  const { fornecedoresAtivos, scFiltered, ocFiltered } = filterData(state, filters);

  const aprovadas = scFiltered.filter((s) => s.status === "APROVADA").length;
  const emAnalise = scFiltered.filter((s) => s.status === "EM_ANALISE").length;
  const reprovadas = scFiltered.filter((s) => s.status === "REPROVADA").length;
  const lancadas = scFiltered.filter((s) => s.status === "LANCADA").length;
  const entregues = ocFiltered.filter((o) => o.status === "ENTREGUE").length;
  const atrasadas = ocFiltered.filter((o) => o.status === "ATRASADA").length;

  const tempoAprovacao = scFiltered
    .filter((s) => s.dataAprovacao)
    .map((s) => diffDays(s.dataCriacao, s.dataAprovacao as string));

  const tempoSCtoOC = ocFiltered
    .map((oc) => {
      const sc = scFiltered.find((s) => s.id === oc.scId);
      if (!sc) return 0;
      return diffDays(sc.dataCriacao, oc.dataOC);
    })
    .filter((n) => n > 0);

  const leadTimes = ocFiltered.map((oc) => diffDays(oc.dataOC, oc.dataRealEntrega ?? toIso(new Date())));

  const entregas = ocFiltered
    .filter((oc) => oc.status === "ENTREGUE")
    .map((oc) => diffDays(oc.dataEmissao, oc.dataRealEntrega as string));

  const noPrazo = ocFiltered.filter((oc) => oc.status === "ENTREGUE" && (oc.dataRealEntrega as string) <= oc.dataPrevistaEntrega).length;
  const taxaEntregaNoPrazo = ocFiltered.length ? Number(((noPrazo / ocFiltered.length) * 100).toFixed(2)) : 0;

  const avg = (values: number[]) => (values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : 0);

  return {
    totalSC: scFiltered.length,
    totalOC: ocFiltered.length,
    valorTotalSC: scFiltered.reduce((sum, item) => sum + item.valorEstimado, 0),
    valorTotalOC: ocFiltered.reduce((sum, item) => sum + item.valorOC, 0),
    fornecedoresAtivos: fornecedoresAtivos.filter((f) => f.status === "ATIVO").length,
    entregasPendentes: ocFiltered.filter((o) => o.status !== "ENTREGUE" && o.status !== "CANCELADA").length,
    entregasAtrasadas: atrasadas,
    emAnalise,
    aprovadas,
    reprovadas,
    lancadas,
    entregues,
    tempoMedioAprovacaoDias: avg(tempoAprovacao),
    tempoMedioSCparaOCDias: avg(tempoSCtoOC),
    leadTimeMedioDias: avg(leadTimes),
    tempoMedioEntregaDias: avg(entregas),
    taxaEntregaNoPrazo,
  };
}

export function monthlySeries(state: AppState, filters: GlobalFilters) {
  const { scFiltered, ocFiltered } = filterData(state, filters);

  const buckets = new Map<string, { mes: string; totalSC: number; totalOC: number; valorOC: number }>();

  const add = (key: string) => {
    if (!buckets.has(key)) buckets.set(key, { mes: key, totalSC: 0, totalOC: 0, valorOC: 0 });
    return buckets.get(key)!;
  };

  scFiltered.forEach((sc) => {
    const key = sc.dataCriacao.slice(0, 7);
    add(key).totalSC += 1;
  });

  ocFiltered.forEach((oc) => {
    const key = oc.dataOC.slice(0, 7);
    const b = add(key);
    b.totalOC += 1;
    b.valorOC += oc.valorOC;
  });

  return Array.from(buckets.values()).sort((a, b) => a.mes.localeCompare(b.mes));
}

export function statusSeries(state: AppState, filters: GlobalFilters) {
  const { scFiltered, ocFiltered } = filterData(state, filters);

  const scByStatus = SC_STATUS_FLOW.map((status) => ({ status: SC_STATUS_LABEL[status], total: scFiltered.filter((s) => s.status === status).length }));
  const ocByStatus = OC_STATUS_FLOW.map((status) => ({ status: OC_STATUS_LABEL[status], total: ocFiltered.filter((o) => o.status === status).length }));

  return { scByStatus, ocByStatus };
}

export function sectorSeries(state: AppState, filters: GlobalFilters) {
  const { scFiltered, ocFiltered, setoresAtivos } = filterData(state, filters);
  return setoresAtivos.map((setor) => ({
    setor: setor.nome,
    totalSC: scFiltered.filter((sc) => sc.setorId === setor.id).length,
    totalOC: ocFiltered.filter((oc) => oc.setorId === setor.id).length,
    valorSC: scFiltered.filter((sc) => sc.setorId === setor.id).reduce((sum, item) => sum + item.valorEstimado, 0),
    valorOC: ocFiltered.filter((oc) => oc.setorId === setor.id).reduce((sum, item) => sum + item.valorOC, 0),
  }));
}

export function supplierRanking(state: AppState, filters: GlobalFilters) {
  const { ocFiltered, fornecedoresAtivos } = filterData(state, filters);

  return fornecedoresAtivos
    .map((fornecedor) => {
      const ocs = ocFiltered.filter((oc) => oc.fornecedorId === fornecedor.id);
      const entregasAtrasadas = ocs.filter((oc) => oc.status === "ATRASADA").length;
      const entregasConcluidas = ocs.filter((oc) => oc.status === "ENTREGUE").length;
      const noPrazo = ocs.filter((oc) => oc.status === "ENTREGUE" && (oc.dataRealEntrega as string) <= oc.dataPrevistaEntrega).length;
      const taxa = entregasConcluidas ? Number(((noPrazo / entregasConcluidas) * 100).toFixed(2)) : 0;
      const lead = entregasConcluidas
        ? Number(
            (
              ocs
                .filter((oc) => oc.status === "ENTREGUE")
                .reduce((sum, item) => sum + diffDays(item.dataOC, item.dataRealEntrega as string), 0) / entregasConcluidas
            ).toFixed(2),
          )
        : 0;

      return {
        fornecedorId: fornecedor.id,
        fornecedor: fornecedor.nomeFantasia,
        totalOC: ocs.length,
        valorTotal: ocs.reduce((sum, item) => sum + item.valorOC, 0),
        atrasos: entregasAtrasadas,
        taxaPrazo: taxa,
        leadTimeMedio: lead,
      };
    })
    .sort((a, b) => b.valorTotal - a.valorTotal);
}

export function buildAlerts(state: AppState, filters: GlobalFilters): AlertItem[] {
  const { scFiltered, ocFiltered } = filterData(state, filters);
  const today = toIso(new Date());

  const alerts: AlertItem[] = [];

  scFiltered
    .filter((sc) => sc.status === "EM_ANALISE" && diffDays(sc.dataCriacao, today) > 10)
    .forEach((sc) => {
      alerts.push({
        id: `alert-sc-${sc.id}`,
        nivel: "ATENCAO",
        tipo: "SC parada em analise",
        mensagem: `${sc.numeroSC} parada ha ${diffDays(sc.dataCriacao, today)} dias`,
        referencia: sc.numeroSC,
      });
    });

  ocFiltered
    .filter((oc) => oc.status === "ATRASADA")
    .forEach((oc) => {
      alerts.push({
        id: `alert-oc-atrasada-${oc.id}`,
        nivel: "CRITICO",
        tipo: "OC atrasada",
        mensagem: `${oc.numeroOC} com prazo vencido`,
        referencia: oc.numeroOC,
      });
    });

  ocFiltered
    .filter((oc) => oc.status !== "ENTREGUE" && oc.status !== "CANCELADA" && diffDays(today, oc.dataPrevistaEntrega) <= 3)
    .forEach((oc) => {
      alerts.push({
        id: `alert-oc-vencimento-${oc.id}`,
        nivel: "ATENCAO",
        tipo: "OC proxima do vencimento",
        mensagem: `${oc.numeroOC} vence em ate 3 dias`,
        referencia: oc.numeroOC,
      });
    });

  const reprovadas = scFiltered.filter((sc) => sc.status === "REPROVADA");
  reprovadas.forEach((sc) => {
    alerts.push({
      id: `alert-sc-reprovada-${sc.id}`,
      nivel: "NORMAL",
      tipo: "SC reprovada",
      mensagem: `${sc.numeroSC} foi reprovada`,
      referencia: sc.numeroSC,
    });
  });

  return alerts;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

export function buildScTimeline(sc: PurchaseRequest, ocs: PurchaseOrder[]) {
  const related = ocs.find((oc) => oc.scId === sc.id);
  const events = [
    { etapa: "SC Criada", data: sc.dataCriacao, status: true },
    { etapa: "Em Analise", data: sc.dataCriacao, status: true },
    { etapa: "Aprovada", data: sc.dataAprovacao, status: !!sc.dataAprovacao },
    { etapa: "Reprovada", data: sc.dataReprovacao, status: !!sc.dataReprovacao },
    { etapa: "Lancada", data: sc.dataLancamento, status: !!sc.dataLancamento },
    { etapa: "OC Gerada", data: related?.dataOC ?? null, status: !!related },
    { etapa: "Entrega", data: related?.dataRealEntrega ?? null, status: !!related?.dataRealEntrega },
  ];

  if (sc.status === "REPROVADA") {
    return events.filter((e) => ["SC Criada", "Em Analise", "Reprovada"].includes(e.etapa));
  }

  return events.filter((e) => e.etapa !== "Reprovada");
}
