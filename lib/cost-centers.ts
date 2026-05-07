// ============================================================
//  AVG — Sistema de Gestão de Centro de Custo
//  Mina do Brumado — Operações de Mineração
//  Versão 4.0.0 — Hierarquia: Processo > Grupo > Subgrupo
// ============================================================

export type ProcessCode =
  | "LM"   // Lavra
  | "BEN"  // Beneficiamento
  | "INS"  // Insumos
  | "MA"   // Meio Ambiente
  | "ADM"  // Administrativos
  | "LOG"  // Logística
  | "DEP"  // Depreciação
  | "MAN"; // Manutenção

// ── Subgrupo (nível mais granular, editável) ─────────────────
export interface SubGroup {
  id: string;
  code: string;
  name: string;
  description: string;
  budgeted: number;
  realized: number;
  unit: string;
}

// ── Grupo (agrupa subgrupos) ─────────────────────────────────
export interface Group {
  id: string;
  code: string;
  name: string;
  subGroups: SubGroup[];
}

// ── Processo (nível raiz) ────────────────────────────────────
export interface Process {
  id: ProcessCode;
  code: string;
  name: string;
  acronym: string;
  color: string;
  icon: string;
  groups: Group[];
}

// ---------------------------------------------------------------
//  Dados mestres — Processos > Grupos > Subgrupos
// ---------------------------------------------------------------
export const PROCESSES: Process[] = [

  // ── 1. LAVRA ─────────────────────────────────────────────────
  {
    id: "LM",
    code: "CC-100",
    name: "Lavra",
    acronym: "LM",
    color: "cyan",
    icon: "mountain-snow",
    groups: [
      {
        id: "LM-G1",
        code: "CC-110",
        name: "Perfuração e Desmonte",
        subGroups: [
          { id: "LM-G1-S1", code: "CC-111", name: "Perfuração", description: "Custo de perfuração de bancadas e furos de sondagem", budgeted: 480000, realized: 421500, unit: "R$/m" },
          { id: "LM-G1-S2", code: "CC-112", name: "Desmonte", description: "Explosivos, acessórios e serviços de desmonte de rocha", budgeted: 620000, realized: 589000, unit: "R$/ton" },
        ],
      },
      {
        id: "LM-G2",
        code: "CC-120",
        name: "Equipamentos e Contratos",
        subGroups: [
          { id: "LM-G2-S1", code: "CC-121", name: "Contratação de Equipamentos — Movimentação de Mina", description: "Aluguel de escavadeiras, motoniveladoras, caminhões fora-de-estrada e pushers", budgeted: 1250000, realized: 1183400, unit: "R$/h" },
          { id: "LM-G2-S2", code: "CC-122", name: "Fast Mine", description: "Módulo de operação acelerada — fast-track mining contract", budgeted: 350000, realized: 362800, unit: "R$" },
          { id: "LM-G2-S3", code: "CC-123", name: "Outros Contratos", description: "Serviços contratados não enquadrados nas subcategorias acima", budgeted: 190000, realized: 144200, unit: "R$" },
        ],
      },
      {
        id: "LM-G3",
        code: "CC-130",
        name: "Manutenção",
        subGroups: [
          { id: "LM-G3-S1", code: "CC-131", name: "Material / Manutenção", description: "Insumos, peças e serviços de manutenção de equipamentos de perfuração", budgeted: 310000, realized: 298700, unit: "R$" },
          { id: "LM-G3-S2", code: "CC-132", name: "Manutenção Preventiva", description: "Planos de manutenção periódica e inspeções programadas", budgeted: 420000, realized: 398700, unit: "R$" },
          { id: "LM-G3-S3", code: "CC-133", name: "Manutenção Corretiva", description: "Reparos não planejados e paradas emergenciais", budgeted: 280000, realized: 341200, unit: "R$" },
        ],
      },
      {
        id: "LM-G4",
        code: "CC-140",
        name: "Tecnologia e Planejamento",
        subGroups: [
          { id: "LM-G4-S1", code: "CC-141", name: "Deswik", description: "Licenciamento e suporte do software de planejamento de lavra Deswik", budgeted: 85000, realized: 85000, unit: "R$" },
          { id: "LM-G4-S2", code: "CC-142", name: "Geomil", description: "Serviços especializados de geomecânica e instrumentação de mina", budgeted: 120000, realized: 97600, unit: "R$" },
        ],
      },
      {
        id: "LM-G5",
        code: "CC-150",
        name: "Medições",
        subGroups: [
          { id: "LM-G5-S1", code: "CC-151", name: "Locomp", description: "Serviços de medição e controle topográfico — Locomp", budgeted: 95000, realized: 88400, unit: "R$" },
          { id: "LM-G5-S2", code: "CC-152", name: "Minexx", description: "Medições e levantamentos de volumes de lavra — Minexx", budgeted: 78000, realized: 81200, unit: "R$" },
          { id: "LM-G5-S3", code: "CC-153", name: "TSL", description: "Serviços técnicos de levantamento e sondagem — TSL", budgeted: 64000, realized: 59700, unit: "R$" },
          { id: "LM-G5-S4", code: "CC-154", name: "Prisma", description: "Monitoramento geodésico e topografia de precisão — Prisma", budgeted: 52000, realized: 48900, unit: "R$" },
          { id: "LM-G5-S5", code: "CC-155", name: "Lenarge", description: "Levantamentos e ensaios de resistência de materiais — Lenarge", budgeted: 41000, realized: 39500, unit: "R$" },
          { id: "LM-G5-S6", code: "CC-156", name: "WM", description: "Serviços de pesagem e controle de massa — WM", budgeted: 35000, realized: 32800, unit: "R$" },
          { id: "LM-G5-S7", code: "CC-157", name: "Francisco de Cassia", description: "Serviços de medição e consultoria técnica especializada", budgeted: 28000, realized: 26100, unit: "R$" },
          { id: "LM-G5-S8", code: "CC-158", name: "A Preventiva", description: "Inspeções preventivas e medições de conformidade", budgeted: 33000, realized: 31400, unit: "R$" },
        ],
      },
    ],
  },

  // ── 2. BENEFICIAMENTO ────────────────────────────────────────
  {
    id: "BEN",
    code: "CC-200",
    name: "Beneficiamento",
    acronym: "BEN",
    color: "green",
    icon: "factory",
    groups: [
      {
        id: "BEN-G1",
        code: "CC-210",
        name: "Britagem",
        subGroups: [
          { id: "BEN-G1-S1", code: "CC-211", name: "Britagem — Sistema a Seco", description: "Operação e manutenção das britagens primária, secundária e terciária via circuito seco", budgeted: 890000, realized: 843200, unit: "R$/ton" },
          { id: "BEN-G1-S2", code: "CC-212", name: "Britagem — Implantação / Expansão", description: "CAPEX de implantação ou expansão do circuito de britagem", budgeted: 3200000, realized: 2978500, unit: "R$" },
        ],
      },
      {
        id: "BEN-G2",
        code: "CC-220",
        name: "Processamento Mineral",
        subGroups: [
          { id: "BEN-G2-S1", code: "CC-221", name: "Separação Magnética", description: "Projeto e instalação de separadores magnéticos de alta intensidade", budgeted: 1450000, realized: 1122000, unit: "R$" },
          { id: "BEN-G2-S2", code: "CC-222", name: "Filtragem", description: "Implantação de filtros de disco e prensa-filtro para desaguamento de concentrado", budgeted: 980000, realized: 754300, unit: "R$" },
          { id: "BEN-G2-S3", code: "CC-223", name: "Espessadores", description: "Instalação de espessadores de alta taxa para polpa de minério", budgeted: 1100000, realized: 880000, unit: "R$" },
        ],
      },
      {
        id: "BEN-G3",
        code: "CC-230",
        name: "Manutenção e Contratos",
        subGroups: [
          { id: "BEN-G3-S1", code: "CC-231", name: "Manutenção — Contrato + Material", description: "Contratos de manutenção preventiva/corretiva e materiais de reposição da UTM", budgeted: 540000, realized: 512900, unit: "R$" },
          { id: "BEN-G3-S2", code: "CC-232", name: "Contrato de Equipamentos — Manejo + Munck", description: "Aluguel de empilhadeiras, muncks e equipamentos de manejo de produto acabado", budgeted: 310000, realized: 287400, unit: "R$/h" },
        ],
      },
      {
        id: "BEN-G4",
        code: "CC-240",
        name: "Obras Civis e Infraestrutura",
        subGroups: [
          { id: "BEN-G4-S1", code: "CC-241", name: "Civil", description: "Obras civis — fundações, prédios industriais, acessos e infraestrutura", budgeted: 2400000, realized: 2189000, unit: "R$" },
          { id: "BEN-G4-S2", code: "CC-242", name: "Mecânica", description: "Fornecimento e montagem de equipamentos mecânicos industriais", budgeted: 1700000, realized: 1543200, unit: "R$" },
          { id: "BEN-G4-S3", code: "CC-243", name: "Elétrica", description: "Subestação, SDMT, instrumentação, automação e instalações elétricas industriais", budgeted: 1350000, realized: 1198700, unit: "R$" },
        ],
      },
    ],
  },

  // ── 3. INSUMOS ───────────────────────────────────────────────
  {
    id: "INS",
    code: "CC-300",
    name: "Insumos",
    acronym: "INS",
    color: "orange",
    icon: "zap",
    groups: [
      {
        id: "INS-G1",
        code: "CC-310",
        name: "Energia",
        subGroups: [
          { id: "INS-G1-S1", code: "CC-311", name: "Combustível", description: "Diesel S-10 e gasolina para frota própria e equipamentos de mina", budgeted: 2100000, realized: 2234800, unit: "R$/L" },
          { id: "INS-G1-S2", code: "CC-312", name: "Energia Elétrica", description: "Consumo de energia elétrica da planta de beneficiamento e infraestrutura de mina", budgeted: 780000, realized: 741200, unit: "R$/MWh" },
        ],
      },
      {
        id: "INS-G2",
        code: "CC-320",
        name: "Materiais e Insumos Operacionais",
        subGroups: [
          { id: "INS-G2-S1", code: "CC-321", name: "Explosivos e Acessórios", description: "ANFO, emulsão, cordel detonante e acessórios para desmonte", budgeted: 380000, realized: 352100, unit: "R$" },
          { id: "INS-G2-S2", code: "CC-322", name: "Lubrificantes e Fluidos", description: "Óleos lubrificantes, graxas, fluidos hidráulicos e refrigerantes", budgeted: 145000, realized: 138400, unit: "R$" },
        ],
      },
    ],
  },

  // ── 4. MEIO AMBIENTE ─────────────────────────────────────────
  {
    id: "MA",
    code: "CC-400",
    name: "Meio Ambiente",
    acronym: "MA",
    color: "emerald",
    icon: "leaf",
    groups: [
      {
        id: "MA-G1",
        code: "CC-410",
        name: "Licenciamento e Taxas",
        subGroups: [
          { id: "MA-G1-S1", code: "CC-411", name: "Licenciamento", description: "Taxas e serviços relacionados a licenças ambientais (LI, LO, LP) junto a SEMA/IBAMA", budgeted: 95000, realized: 88200, unit: "R$" },
          { id: "MA-G1-S2", code: "CC-412", name: "Taxas Ambientais", description: "TFRM, CFEM sobre faturamento e demais taxas ambientais e minerárias", budgeted: 320000, realized: 312700, unit: "R$" },
          { id: "MA-G1-S3", code: "CC-413", name: "Royalties (CFEM)", description: "Compensação Financeira pela Exploração Mineral — CFEM paga ao DNPM/ANM", budgeted: 450000, realized: 467900, unit: "% Receita" },
        ],
      },
      {
        id: "MA-G2",
        code: "CC-420",
        name: "Monitoramento Ambiental",
        subGroups: [
          { id: "MA-G2-S1", code: "CC-421", name: "Monitoramento de Água", description: "Coleta e análise de parâmetros físico-químicos e biológicos de corpos hídricos", budgeted: 98000, realized: 87300, unit: "R$" },
          { id: "MA-G2-S2", code: "CC-422", name: "Monitoramento de Ar e Solo", description: "Análise de poeira, gases, ruído e qualidade do solo nas áreas de influência", budgeted: 82000, realized: 75100, unit: "R$" },
        ],
      },
    ],
  },

  // ── 5. ADMINISTRATIVOS ───────────────────────────────────────
  {
    id: "ADM",
    code: "CC-500",
    name: "Administrativos",
    acronym: "ADM",
    color: "violet",
    icon: "building2",
    groups: [
      {
        id: "ADM-G1",
        code: "CC-510",
        name: "Mão de Obra",
        subGroups: [
          { id: "ADM-G1-S1", code: "CC-511", name: "Salários — Custos + Encargos Trabalhistas", description: "Folha de pagamento, 13º, férias, FGTS, INSS e encargos da equipe administrativa", budgeted: 390000, realized: 388500, unit: "R$" },
          { id: "ADM-G1-S2", code: "CC-512", name: "Treinamento + Capacitação", description: "Cursos, certificações e programas de capacitação da equipe", budgeted: 45000, realized: 28700, unit: "R$" },
        ],
      },
      {
        id: "ADM-G2",
        code: "CC-520",
        name: "Infraestrutura e TI",
        subGroups: [
          { id: "ADM-G2-S1", code: "CC-521", name: "Sistemas e Softwares", description: "Licenças de ERP, sistemas de gestão e ferramentas de TI", budgeted: 85000, realized: 79200, unit: "R$" },
          { id: "ADM-G2-S2", code: "CC-522", name: "Comunicações", description: "Internet, telefonia, rádio comunicação e infraestrutura de rede", budgeted: 42000, realized: 40800, unit: "R$" },
        ],
      },
      {
        id: "ADM-G3",
        code: "CC-530",
        name: "Segurança e Saúde",
        subGroups: [
          { id: "ADM-G3-S1", code: "CC-531", name: "Segurança do Trabalho", description: "EPIs, sinalização, treinamentos de segurança e gestão de riscos", budgeted: 120000, realized: 113400, unit: "R$" },
          { id: "ADM-G3-S2", code: "CC-532", name: "Medicina Ocupacional", description: "Exames admissionais, periódicos, ASOs e programas de saúde", budgeted: 68000, realized: 64100, unit: "R$" },
        ],
      },
    ],
  },

  // ── 6. LOGÍSTICA ─────────────────────────────────────────────
  {
    id: "LOG",
    code: "CC-600",
    name: "Logística",
    acronym: "LOG",
    color: "amber",
    icon: "truck",
    groups: [
      {
        id: "LOG-G1",
        code: "CC-610",
        name: "Transporte",
        subGroups: [
          { id: "LOG-G1-S1", code: "CC-611", name: "Transporte Externo — R$/T + Frete", description: "Custo de transporte rodoviário do produto acabado por tonelada mais frete contratado", budgeted: 1800000, realized: 1765300, unit: "R$/ton" },
          { id: "LOG-G1-S2", code: "CC-612", name: "Transporte Interno", description: "Movimentação interna de material entre frentes de lavra e planta", budgeted: 320000, realized: 298700, unit: "R$" },
        ],
      },
      {
        id: "LOG-G2",
        code: "CC-620",
        name: "Mão de Obra Logística",
        subGroups: [
          { id: "LOG-G2-S1", code: "CC-621", name: "Mão de Obra Operacional", description: "Pessoal alocado nas operações logísticas internas (portaria, pesagem, expedição)", budgeted: 240000, realized: 228100, unit: "R$" },
          { id: "LOG-G2-S2", code: "CC-622", name: "Salários + Encargos — Logística", description: "Folha de pagamento completa da equipe de logística incluindo encargos", budgeted: 180000, realized: 175400, unit: "R$" },
        ],
      },
    ],
  },

  // ── 7. DEPRECIAÇÃO ───────────────────────────────────────────
  {
    id: "DEP",
    code: "CC-700",
    name: "Depreciação",
    acronym: "DEP",
    color: "slate",
    icon: "bar-chart-2",
    groups: [
      {
        id: "DEP-G1",
        code: "CC-710",
        name: "Depreciação de Equipamentos",
        subGroups: [
          { id: "DEP-G1-S1", code: "CC-711", name: "Equipamentos de Lavra", description: "Depreciação de escavadeiras, tratores, perfuratrizes e equipamentos de mina", budgeted: 520000, realized: 520000, unit: "R$" },
          { id: "DEP-G1-S2", code: "CC-712", name: "Equipamentos de Beneficiamento", description: "Depreciação de britadores, peneiras, correias e equipamentos da UTM", budgeted: 380000, realized: 380000, unit: "R$" },
          { id: "DEP-G1-S3", code: "CC-713", name: "Frota de Transporte", description: "Depreciação de caminhões, pás-carregadeiras e veículos leves", budgeted: 210000, realized: 210000, unit: "R$" },
        ],
      },
      {
        id: "DEP-G2",
        code: "CC-720",
        name: "Depreciação de Infraestrutura",
        subGroups: [
          { id: "DEP-G2-S1", code: "CC-721", name: "Edificações e Obras Civis", description: "Depreciação de galpões industriais, escritórios e obras de infraestrutura", budgeted: 145000, realized: 145000, unit: "R$" },
          { id: "DEP-G2-S2", code: "CC-722", name: "Instalações Elétricas e Automação", description: "Depreciação de subestações, painéis de controle e sistemas de automação", budgeted: 95000, realized: 95000, unit: "R$" },
        ],
      },
    ],
  },
  // ── 8. MANUTENÇÃO ─────────────────────────────────────────────
  {
    id: "MAN",
    code: "CC-800",
    name: "Manutenção",
    acronym: "MAN",
    color: "yellow",
    icon: "wrench",
    groups: [
      {
        id: "MAN-G1",
        code: "CC-810",
        name: "Manutenção Preventiva",
        subGroups: [
          { id: "MAN-G1-S1", code: "CC-811", name: "Planejada - Equipamentos", description: "Manutenção preventiva programada em equipamentos de mina e planta", budgeted: 450000, realized: 412000, unit: "R$" },
        ],
      },
      {
        id: "MAN-G2",
        code: "CC-820",
        name: "Manutenção Corretiva",
        subGroups: [
          { id: "MAN-G2-S1", code: "CC-821", name: "Paradas Emergenciais", description: "Reparos não planejados e paradas imprevistas", budgeted: 320000, realized: 385000, unit: "R$" },
        ],
      },
      {
        id: "MAN-G3",
        code: "CC-830",
        name: "Materiais e Peças",
        subGroups: [
          { id: "MAN-G3-S1", code: "CC-831", name: "Estoque de Reposição", description: "Peças de reposição, lubrificantes e insumos de manutenção", budgeted: 280000, realized: 265000, unit: "R$" },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------
export function getProcessBudgeted(p: Process): number {
  return p.groups.reduce((a, g) => a + g.subGroups.reduce((b, s) => b + s.budgeted, 0), 0);
}

export function getProcessRealized(p: Process): number {
  return p.groups.reduce((a, g) => a + g.subGroups.reduce((b, s) => b + s.realized, 0), 0);
}

export function getGroupBudgeted(g: Group): number {
  return g.subGroups.reduce((a, s) => a + s.budgeted, 0);
}

export function getGroupRealized(g: Group): number {
  return g.subGroups.reduce((a, s) => a + s.realized, 0);
}

export function getVariancePct(budgeted: number, realized: number): number {
  if (budgeted === 0) return 0;
  return ((realized - budgeted) / budgeted) * 100;
}

export function getSubVariancePct(sub: SubGroup): number {
  if (sub.budgeted === 0) return 0;
  return ((sub.realized - sub.budgeted) / sub.budgeted) * 100;
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getGrandTotals() {
  const budgeted = PROCESSES.reduce((a, p) => a + getProcessBudgeted(p), 0);
  const realized = PROCESSES.reduce((a, p) => a + getProcessRealized(p), 0);
  return { budgeted, realized, variance: realized - budgeted };
}

// Legacy aliases so existing chart components don't break
export const COST_CENTERS = PROCESSES.map((p) => ({
  id: p.id,
  code: p.code,
  name: p.name,
  acronym: p.acronym,
  color: p.color,
  icon: p.icon,
  subAreas: p.groups.flatMap((g) =>
    g.subGroups.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      description: s.description,
      budgeted: s.budgeted,
      realized: s.realized,
      unit: s.unit,
    }))
  ),
}));

export function getTotalBudgeted(c: { subAreas: { budgeted: number }[] }): number {
  return c.subAreas.reduce((a, s) => a + s.budgeted, 0);
}

export function getTotalRealized(c: { subAreas: { realized: number }[] }): number {
  return c.subAreas.reduce((a, s) => a + s.realized, 0);
}
