"use client";

import React, { useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  LayoutDashboard,
  Activity,
  Fuel,
  Gauge,
  Wrench,
  Truck,
} from "lucide-react";

import { Card } from "../components/Card";
import { Sparkline } from "../components/Sparkline";
import { Badge } from "../components/Badge";
import { fioriColors } from "../theme";
import { getExecutiveDashboardMock } from "../mock-data/seed";
import type { ExecutiveDashboardMock, KPIBase, Trend } from "../mock-data/types";

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5" style={{ color: fioriColors.success }} />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5" style={{ color: fioriColors.danger }} />;
  return <Minus className="h-3.5 w-3.5" style={{ color: fioriColors.primary }} />;
}

function KpiCard({ kpi, icon: Icon }: { kpi: KPIBase; icon: React.ComponentType<any> }) {
  const tone = kpi.comparePct >= 0 ? fioriColors.success : fioriColors.danger;

  return (
    <Card tone="primary">
      <div style={{ padding: 20, height: "100%" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 14,
                border: `1px solid color-mix(in oklch, ${fioriColors.primary} 30%, transparent)`,
                background: `color-mix(in oklch, ${fioriColors.primary} 10%, transparent)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 28px rgba(0,184,255,0.10)",
              }}
            >
              <Icon className="h-4 w-4" style={{ color: fioriColors.primary }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "ui-monospace, monospace",
                  fontWeight: 900,
                  letterSpacing: 0.2,
                  color: "rgba(248,250,252,0.78)",
                }}
              >
                {kpi.label}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 20,
                  fontFamily: "ui-monospace, monospace",
                  fontWeight: 1000,
                  color: fioriColors.text,
                }}
              >
                {kpi.value}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 999,
                border: `1px solid color-mix(in oklch, ${tone} 28%, transparent)`,
                background: `color-mix(in oklch, ${tone} 12%, transparent)`,
              }}
            >
              <TrendIcon trend={kpi.trend} />
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "ui-monospace, monospace",
                  fontWeight: 1000,
                  color: tone,
                }}
              >
                {kpi.comparePct >= 0 ? "+" : ""}
                {kpi.comparePct.toFixed(1)}%
              </span>
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 10,
                fontFamily: "ui-monospace, monospace",
                color: "color-mix(in oklch, #F8FAFC 62%, transparent)",
              }}
            >
              {kpi.compareLabel}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <Sparkline data={kpi.sparkline} />
        </div>
      </div>
    </Card>
  );
}

function SectionSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: 18,
        border: `1px solid ${fioriColors.border}`,
        background: fioriColors.cards,
      }}
    />
  );
}

export function ExecutiveDashboard() {
  const data = useMemo<ExecutiveDashboardMock>(() => getExecutiveDashboardMock(), []);

  const kpiIcons = [DollarSign, Truck, Fuel, Activity, Gauge, Wrench, TrendingUp, TrendingDown];

  return (
    <div style={{ background: fioriColors.background, minHeight: "calc(100vh - 72px)", padding: 28 }}>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
            marginBottom: 22,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontFamily: "ui-monospace, monospace",
                letterSpacing: 3,
                fontWeight: 1000,
                color: "color-mix(in oklch, #F8FAFC 78%, transparent)",
              }}
            >
              DASHBOARD EXECUTIVO
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 18,
                fontFamily: "ui-monospace, monospace",
                fontWeight: 1100,
                color: fioriColors.text,
              }}
            >
              Controle de Custos Operacionais — Mina do Brumado
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 999,
                border: `1px solid color-mix(in oklch, ${fioriColors.primary} 28%, transparent)`,
                background: `color-mix(in oklch, ${fioriColors.primary} 10%, transparent)`,
              }}
            >
              <LayoutDashboard className="h-4 w-4" style={{ color: fioriColors.primary }} />
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "ui-monospace, monospace",
                  fontWeight: 1000,
                  color: fioriColors.text,
                }}
              >
                Visão Geral
              </span>
            </div>
          </div>
        </div>

        <section aria-label="KPIs Principais">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-14" style={{ gap: 14 }}>
            {data.kpis.slice(0, 8).map((kpi, idx) => {
              const Icon = kpiIcons[idx] ?? DollarSign;
              return <KpiCard key={kpi.id} kpi={kpi} icon={Icon} />;
            })}
          </div>
        </section>

        <section aria-label="Cards de Participação dos Custos" style={{ marginTop: 16 }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-14" style={{ gap: 14 }}>
            {data.costParticipation.map((c) => (
              <Card key={c.id}>
                <div style={{ padding: 18 }}>
                  <div className="flex items-start justify-between gap-12">
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontFamily: "ui-monospace, monospace",
                          fontWeight: 1000,
                          color: "color-mix(in oklch, #F8FAFC 78%, transparent)",
                        }}
                      >
                        {c.label}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 16,
                          fontFamily: "ui-monospace, monospace",
                          fontWeight: 1100,
                          color: fioriColors.text,
                        }}
                      >
                        {c.total}
                      </div>
                    </div>
                    <div>
                      <Badge tone={c.badge.tone}>
                        {c.badge.label}
                      </Badge>
                    </div>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: "ui-monospace, monospace",
                        fontWeight: 1100,
                        color: "color-mix(in oklch, #F8FAFC 92%, transparent)",
                      }}
                    >
                      {c.participationPct.toFixed(1)}% de participação
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <Sparkline data={c.sparkline} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section aria-label="Gráficos Principais" style={{ marginTop: 16 }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-14" style={{ gap: 14 }}>
            <Card>
              <div style={{ padding: 18 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: "ui-monospace, monospace",
                    fontWeight: 1000,
                    letterSpacing: 2,
                    color: "color-mix(in oklch, #F8FAFC 78%, transparent)",
                  }}
                >
                  Participação dos Custos
                </div>
                <div style={{ marginTop: 10 }}>
                  <SectionSkeleton height={200} />
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ padding: 18 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: "ui-monospace, monospace",
                    fontWeight: 1000,
                    letterSpacing: 2,
                    color: "color-mix(in oklch, #F8FAFC 78%, transparent)",
                  }}
                >
                  Evolução Mensal
                </div>
                <div style={{ marginTop: 10 }}>
                  <SectionSkeleton height={200} />
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ padding: 18 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: "ui-monospace, monospace",
                    fontWeight: 1000,
                    letterSpacing: 2,
                    color: "color-mix(in oklch, #F8FAFC 78%, transparent)",
                  }}
                >
                  Top 10 Maiores Gastos
                </div>
                <div style={{ marginTop: 10 }}>
                  <SectionSkeleton height={200} />
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section aria-label="Indicadores Operacionais" style={{ marginTop: 16 }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-14" style={{ gap: 14 }}>
            {data.operationalIndicators.map((op) => (
              <Card key={op.id}>
                <div style={{ padding: 18 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "ui-monospace, monospace",
                      fontWeight: 1000,
                      color: "color-mix(in oklch, #F8FAFC 78%, transparent)",
                    }}
                  >
                    {op.label}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 26,
                      fontFamily: "ui-monospace, monospace",
                      fontWeight: 1100,
                      color: fioriColors.text,
                    }}
                  >
                    {op.realized.toLocaleString("pt-BR")}
                    {op.unit}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    Meta: <span style={{ color: fioriColors.primary, fontWeight: 1100 }}>{op.meta.toLocaleString("pt-BR")}{op.unit}</span>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <SectionSkeleton height={120} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section aria-label="Tabela de Ranking" style={{ marginTop: 16 }}>
          <Card>
            <div style={{ padding: 18 }}>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "ui-monospace, monospace",
                  fontWeight: 1000,
                  letterSpacing: 2,
                  color: "color-mix(in oklch, #F8FAFC 78%, transparent)",
                }}
              >
                Ranking de Equipamentos
              </div>
              <div style={{ marginTop: 12 }}>
                <SectionSkeleton height={220} />
              </div>
            </div>
          </Card>
        </section>

        <section aria-label="Alertas" style={{ marginTop: 16 }}>
          <Card>
            <div style={{ padding: 18 }}>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "ui-monospace, monospace",
                  fontWeight: 1000,
                  letterSpacing: 2,
                  color: "color-mix(in oklch, #F8FAFC 78%, transparent)",
                }}
              >
                Alertas
              </div>
              <div style={{ marginTop: 12 }}>
                <SectionSkeleton height={170} />
              </div>
            </div>
          </Card>
        </section>

        <section aria-label="Ações Rápidas" style={{ marginTop: 16 }}>
          <Card>
            <div style={{ padding: 18 }}>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "ui-monospace, monospace",
                  fontWeight: 1000,
                  letterSpacing: 2,
                  color: "color-mix(in oklch, #F8FAFC 78%, transparent)",
                }}
              >
                Ações Rápidas
              </div>
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
                {["Novo Custo","Novo Equipamento","Novo Abastecimento","Nova Perfuração","Novo Desmonte","Novo Relatório"].map((label) => (
                  <div
                    key={label}
                    style={{
                      width: 190,
                      height: 44,
                      borderRadius: 16,
                      border: `1px solid color-mix(in oklch, ${fioriColors.border} 80%, transparent)`,
                      background: "color-mix(in oklch, #0E1A2B 55%, transparent)",
                    }}
                  />
                ))}
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

