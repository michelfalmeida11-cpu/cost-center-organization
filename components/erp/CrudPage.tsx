"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { useRealtimeRefresh } from "@/components/erp/useRealtimeRefresh";

type FieldType = "text" | "number" | "date" | "textarea";

export type CrudField = {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
};

type CrudPageProps = {
  title: string;
  description: string;
  table: string;
  fields: CrudField[];
  defaultValues: Record<string, string | number>;
  orderBy?: string;
  realtimeTables?: string[];
};

function toInputType(type: FieldType): "text" | "number" | "date" {
  if (type === "number") return "number";
  if (type === "date") return "date";
  return "text";
}

export function CrudPage({
  title,
  description,
  table,
  fields,
  defaultValues,
  orderBy = "created_at",
  realtimeTables,
}: CrudPageProps) {
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    if (field.type === "number") {
      schemaShape[field.key] = field.required
        ? z.coerce.number().refine((value) => Number.isFinite(value), `${field.label} e obrigatorio`)
        : z.coerce.number().optional();
    } else {
      schemaShape[field.key] = field.required
        ? z.string().min(1, `${field.label} e obrigatorio`)
        : z.string().optional();
    }
  }

  const formSchema = z.object(schemaShape);
  type FormValues = z.infer<typeof formSchema>;

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as FormValues,
  });

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const query = supabase.from(table).select("*").order(orderBy, { ascending: false }).limit(400);
    const { data, error } = await query;
    setLoading(false);

    if (error) {
      console.error(error);
      return;
    }

    setRows((data as Record<string, unknown>[]) ?? []);
  }, [orderBy, table]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useRealtimeRefresh(fetchRows, realtimeTables ?? [table]);

  const filteredRows = useMemo(() => {
    const text = search.toLowerCase().trim();
    if (!text) return rows;

    return rows.filter((row) => {
      const line = fields.map((field) => String(row[field.key] ?? "")).join(" ").toLowerCase();
      return line.includes(text);
    });
  }, [rows, search, fields]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  async function onSubmit(values: FormValues) {
    setSaving(true);

    const payload: Record<string, unknown> = { ...values };

    const { error } = selectedId
      ? await supabase.from(table).update(payload).eq("id", selectedId)
      : await supabase.from(table).insert(payload);

    setSaving(false);

    if (error) {
      console.error(error);
      alert(`Erro ao salvar: ${error.message}`);
      return;
    }

    form.reset(defaultValues as FormValues);
    setSelectedId(null);
    fetchRows();
  }

  function editRow(row: Record<string, unknown>) {
    const nextValues: Record<string, unknown> = {};
    for (const field of fields) {
      nextValues[field.key] = row[field.key] ?? defaultValues[field.key] ?? "";
    }
    form.reset(nextValues as FormValues);
    setSelectedId(String(row.id));
  }

  async function removeRow(id: string) {
    const confirmed = window.confirm("Deseja realmente excluir este registro?");
    if (!confirmed) return;

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      alert(`Erro ao excluir: ${error.message}`);
      return;
    }

    if (selectedId === id) {
      form.reset(defaultValues as FormValues);
      setSelectedId(null);
    }

    fetchRows();
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <p className="text-sm text-slate-400">{description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 space-y-4">
          {fields.map((field) => {
            const type = field.type ?? "text";
            const errorMessage = form.formState.errors[field.key]?.message as string | undefined;

            return (
              <label key={field.key} className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-300">{field.label}</span>
                {type === "textarea" ? (
                  <textarea
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                    rows={3}
                    {...form.register(field.key as keyof FormValues)}
                  />
                ) : (
                  <input
                    type={toInputType(type)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                    {...form.register(field.key as keyof FormValues)}
                  />
                )}
                {errorMessage ? <span className="text-xs text-red-400">{errorMessage}</span> : null}
              </label>
            );
          })}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
            >
              {selectedId ? "Atualizar" : "Salvar"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white"
              onClick={() => {
                setSelectedId(null);
                form.reset(defaultValues as FormValues);
              }}
            >
              Limpar
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Pesquisar registros"
              className="w-full max-w-sm rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            />
            <span className="text-xs text-slate-400">{loading ? "Carregando..." : `${filteredRows.length} registros`}</span>
          </div>

          <div className="overflow-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wide text-slate-300">
                <tr>
                  {fields.map((field) => (
                    <th key={field.key} className="px-3 py-2">{field.label}</th>
                  ))}
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, index) => (
                  <tr key={String(row.id ?? index)} className="border-t border-white/5 text-slate-100">
                    {fields.map((field) => (
                      <td key={field.key} className="px-3 py-2 whitespace-nowrap">{String(row[field.key] ?? "")}</td>
                    ))}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button className="mr-2 text-cyan-300" type="button" onClick={() => editRow(row)}>Editar</button>
                      <button className="text-rose-300" type="button" onClick={() => removeRow(String(row.id))}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Página {page} de {pageCount}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded border border-white/10 px-2 py-1 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                className="rounded border border-white/10 px-2 py-1 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
