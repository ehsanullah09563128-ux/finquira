"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
import { deleteIncome, saveIncome } from "@/app/actions/income";
import { ConfirmDialog, Toolbar } from "@/components/confirm-dialog";
import { Field, FormGrid, Modal, ModalFooter } from "@/components/modal";
import { EmptyState } from "@/components/ui";
import { useToast } from "@/components/toast";
import { INCOME_CATEGORIES, INCOME_SOURCES } from "@/lib/constants";
import { formatDate, formatMoney, todayISO, toNumber } from "@/lib/format";
import type { FieldErrors } from "@/lib/validation";

export type IncomeRow = {
  id: string;
  title: string;
  amount: string;
  category: string;
  source: string;
  date: string;
  notes: string;
};

const currencyTone = "text-brand-600";

export function IncomeManager({ rows, currency }: { rows: IncomeRow[]; currency: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeRow | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<IncomeRow | null>(null);

  const filtered = rows.filter((row) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery =
      !needle ||
      row.title.toLowerCase().includes(needle) ||
      row.category.toLowerCase().includes(needle) ||
      row.source.toLowerCase().includes(needle) ||
      row.notes.toLowerCase().includes(needle);
    const matchesCategory = category === "ALL" || row.category === category;
    const matchesFrom = !from || row.date >= from;
    const matchesTo = !to || row.date <= to;
    return matchesQuery && matchesCategory && matchesFrom && matchesTo;
  });

  const filteredTotal = filtered.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const activeFilters = Boolean(query || category !== "ALL" || from || to);

  function openCreate() {
    setEditing(null);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(row: IncomeRow) {
    setEditing(row);
    setErrors({});
    setFormOpen(true);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveIncome(formData);
      if (result.ok) {
        toast(result.message ?? "Income saved.");
        setFormOpen(false);
        setEditing(null);
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        toast(result.message ?? "Could not save income.", "error");
      }
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteIncome(target.id);
      if (result.ok) {
        toast(result.message ?? "Income deleted.");
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast(result.message ?? "Could not delete income.", "error");
      }
    });
  }

  return (
    <>
      <div className="fin-card overflow-hidden">
        <Toolbar search={query} onSearch={setQuery} placeholder="Search income by title, source or note…">
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="fin-select w-auto min-w-[9.5rem] py-2">
            <option value="ALL">All categories</option>
            {INCOME_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              aria-label="From date"
              className="fin-input w-auto py-2"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              aria-label="To date"
              className="fin-input w-auto py-2"
            />
          </div>
          {activeFilters ? (
            <button
              type="button"
              className="fin-btn-ghost px-2.5 py-2 text-xs"
              onClick={() => {
                setQuery("");
                setCategory("ALL");
                setFrom("");
                setTo("");
              }}
            >
              Reset
            </button>
          ) : null}
          <button type="button" className="fin-btn-primary ml-auto" onClick={openCreate}>
            <Plus className="size-4" /> Add income
          </button>
        </Toolbar>

        {filtered.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title={rows.length === 0 ? "No income recorded yet" : "No matching income"}
            description={
              rows.length === 0
                ? "Add your salary, freelance work or any other money coming in to start tracking your savings rate."
                : "Try widening the date range or clearing the search and category filters."
            }
            action={
              rows.length === 0 ? (
                <button type="button" className="fin-btn-primary" onClick={openCreate}>
                  <Plus className="size-4" /> Add your first income
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-collapse">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="fin-th">Income</th>
                    <th className="fin-th">Category</th>
                    <th className="fin-th">Source</th>
                    <th className="fin-th">Date</th>
                    <th className="fin-th text-right">Amount</th>
                    <th className="fin-th w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row) => (
                    <tr key={row.id} className="transition hover:bg-slate-50/60">
                      <td className="fin-td">
                        <p className="font-medium text-slate-900">{row.title}</p>
                        {row.notes ? <p className="mt-0.5 max-w-[22rem] truncate text-xs text-slate-400">{row.notes}</p> : null}
                      </td>
                      <td className="fin-td">
                        <span className="fin-badge bg-brand-50 text-brand-700">{row.category}</span>
                      </td>
                      <td className="fin-td text-slate-500">{row.source || "—"}</td>
                      <td className="fin-td whitespace-nowrap text-slate-500">{formatDate(row.date)}</td>
                      <td className={`fin-td tnum text-right font-semibold ${currencyTone}`}>
                        +{formatMoney(row.amount, currency)}
                      </td>
                      <td className="fin-td">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            aria-label={`Edit ${row.title}`}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
                            aria-label={`Delete ${row.title}`}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {filtered.map((row) => (
                <li key={row.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{row.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {row.category} · {formatDate(row.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`tnum text-sm font-semibold ${currencyTone}`}>+{formatMoney(row.amount, currency)}</p>
                      <div className="mt-1 flex justify-end gap-1">
                        <button type="button" onClick={() => openEdit(row)} aria-label="Edit" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
                          <Pencil className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(row)} aria-label="Delete" className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500 sm:px-6">
              <span>
                Showing <strong className="font-semibold text-slate-700">{filtered.length}</strong> of {rows.length} entries
              </span>
              <span className="tnum font-semibold text-slate-700">
                Filtered total {formatMoney(filteredTotal, currency)}
              </span>
            </div>
          </>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit income" : "Add income"}
        description="Every entry is private to your account."
      >
        <form key={editing?.id ?? "new"} onSubmit={submit} className="space-y-4">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <FormGrid>
            <Field label="Title" htmlFor="title" error={errors.title} className="sm:col-span-2">
              <input id="title" name="title" defaultValue={editing?.title ?? ""} className="fin-input" placeholder="e.g. October salary" required />
            </Field>
            <Field label="Amount" htmlFor="amount" error={errors.amount}>
              <input id="amount" name="amount" type="number" min="0" step="0.01" defaultValue={editing?.amount ?? ""} className="fin-input" placeholder="0.00" required />
            </Field>
            <Field label="Date" htmlFor="date" error={errors.date}>
              <input id="date" name="date" type="date" defaultValue={editing?.date ?? todayISO()} className="fin-input" required />
            </Field>
            <Field label="Category" htmlFor="category" error={errors.category}>
              <select id="category" name="category" defaultValue={editing?.category ?? "Salary"} className="fin-select">
                {INCOME_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Source" htmlFor="source" error={errors.source}>
              <input id="source" name="source" list="income-sources" defaultValue={editing?.source ?? ""} className="fin-input" placeholder="Employer, client…" />
              <datalist id="income-sources">
                {INCOME_SOURCES.map((source) => (
                  <option key={source} value={source} />
                ))}
              </datalist>
            </Field>
            <Field label="Notes" htmlFor="notes" error={errors.notes} className="sm:col-span-2">
              <textarea id="notes" name="notes" rows={2} defaultValue={editing?.notes ?? ""} className="fin-input resize-none" placeholder="Optional note" />
            </Field>
          </FormGrid>
          <ModalFooter>
            <button type="button" className="fin-btn-secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="fin-btn-primary" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Add income"}
            </button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete income entry"
        message={`This will permanently remove “${deleteTarget?.title ?? ""}” (${formatMoney(deleteTarget?.amount ?? 0, currency)}). This can't be undone.`}
        busy={pending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
