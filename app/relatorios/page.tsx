"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DashboardHeader } from "@/components/dashboard-header";
import { listFactRows } from "@/lib/erp/service";
import type { ReportRow } from "@/lib/erp/types";

export default function RelatoriosPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const refresh = useCallback(async () => {
    const now = new Date();
    const start = new Date(now);

    if (period === "weekly") start.setDate(now.getDate() - 7);
    if (period === "monthly") start.setDate(now.getDate() - 30);

    const startDate = start.toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);

    const result = await listFactRows({ startDate, endDate }, 500);
    setRows(result);
  }, [period]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += row.amount;
        acc.tons += row.tons;
        acc.liters += row.liters;
        return acc;
      },
      { total: 0, tons: 0, liters: 0 }
    );
  }, [rows]);

  function exportExcel() {
    const excelRows = rows.map((row) => ({
      Data: row.occurred_at,
      Fonte: row.source,
      Valor: row.amount,
      Toneladas: row.tons,
      Metros: row.drilled_meters,
      Furos: row.holes_count,
      Litros: row.liters,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");
    XLSX.writeFile(workbook, `relatorio-${period}.xlsx`);
  }

  function exportPdf() {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Relatorio ERP Mineracao", 40, 40);
    doc.setFontSize(10);
    doc.text(`Periodo: ${period}`, 40, 58);

    autoTable(doc, {
      startY: 72,
      head: [["Data", "Fonte", "Valor", "Toneladas", "Metros", "Furos", "Litros"]],
      body: rows.map((row) => [
        row.occurred_at,
        row.source,
        row.amount.toFixed(2),
        row.tons.toFixed(2),
        row.drilled_meters.toFixed(2),
        String(row.holes_count),
        row.liters.toFixed(3),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    doc.save(`relatorio-${period}.pdf`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DashboardHeader />
      <main className="mx-auto max-w-screen-2xl space-y-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h1 className="text-xl font-semibold">Relatórios</h1>
          <p className="text-sm text-slate-400">Diário, semanal, mensal, financeiro e por centro de custo (dados reais do Supabase).</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-lg border border-white/10 px-3 py-2 text-sm" onClick={() => setPeriod("daily")}>Diário</button>
            <button className="rounded-lg border border-white/10 px-3 py-2 text-sm" onClick={() => setPeriod("weekly")}>Semanal</button>
            <button className="rounded-lg border border-white/10 px-3 py-2 text-sm" onClick={() => setPeriod("monthly")}>Mensal</button>
            <button className="rounded-lg bg-cyan-500 px-3 py-2 text-sm text-slate-950" onClick={exportExcel}>Exportar Excel (XLSX)</button>
            <button className="rounded-lg bg-violet-500 px-3 py-2 text-sm text-white" onClick={exportPdf}>Exportar PDF</button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-slate-900/70 p-4"><p className="text-xs text-slate-400">Total Financeiro</p><p className="text-xl font-semibold">R$ {summary.total.toFixed(2)}</p></article>
          <article className="rounded-xl border border-white/10 bg-slate-900/70 p-4"><p className="text-xs text-slate-400">Toneladas</p><p className="text-xl font-semibold">{summary.tons.toFixed(2)} t</p></article>
          <article className="rounded-xl border border-white/10 bg-slate-900/70 p-4"><p className="text-xs text-slate-400">Litros Diesel</p><p className="text-xl font-semibold">{summary.liters.toFixed(3)} L</p></article>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="overflow-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Fonte</th>
                  <th className="px-3 py-2">Valor</th>
                  <th className="px-3 py-2">Toneladas</th>
                  <th className="px-3 py-2">Metros</th>
                  <th className="px-3 py-2">Furos</th>
                  <th className="px-3 py-2">Litros</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.occurred_at}-${row.source}-${index}`} className="border-t border-white/5">
                    <td className="px-3 py-2">{row.occurred_at}</td>
                    <td className="px-3 py-2">{row.source}</td>
                    <td className="px-3 py-2">{row.amount.toFixed(2)}</td>
                    <td className="px-3 py-2">{row.tons.toFixed(2)}</td>
                    <td className="px-3 py-2">{row.drilled_meters.toFixed(2)}</td>
                    <td className="px-3 py-2">{row.holes_count}</td>
                    <td className="px-3 py-2">{row.liters.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
