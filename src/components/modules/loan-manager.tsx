"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarClock, HandCoins, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteLoan, recordRepayment, saveLoan } from "@/app/actions/loans";
import { ConfirmDialog, Toolbar } from "@/components/confirm-dialog";
import { Field, FormGrid, Modal, ModalFooter } from "@/components/modal";
import { Badge, EmptyState, ProgressBar } from "@/components/ui";
import { useToast } from "@/components/toast";
import { daysUntil, formatDate, formatMoney, percent, todayISO, toNumber } from "@/lib/format";
import type { FieldErrors } from "@/lib/validation";

export type LoanPaymentRow = { id: string; amount: string; paymentDate: string; notes: string };

export type LoanRow = {
  id: string;
  type: string;
  personName: string;
  contactNumber: string;
  amount: string;
  remainingAmount: string;
  interestRate: string;
  startDate: string;
  dueDate: string;
  status: string;
  notes: string;
  paid: number;
  payments: LoanPaymentRow[];
};

export function LoanManager({ loans, currency }: { loans: LoanRow[]; currency: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"ALL" | "GIVEN" | "TAKEN">("ALL");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LoanRow | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<LoanRow | null>(null);
  const [repayTarget, setRepayTarget] = useState<LoanRow | null>(null);

  const filtered = loans.filter((loan) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery =
      !needle ||
      loan.personName.toLowerCase().includes(needle) ||
      loan.contactNumber.toLowerCase().includes(needle) ||
      loan.notes.toLowerCase().includes(needle);
    const matchesTab = tab === "ALL" || loan.type === tab;
    const overdue = loan.status !== "CLOSED" && (daysUntil(loan.dueDate) ?? 0) < 0;
    const matchesStatus =
      status === "ALL" ||
      (status === "OPEN" && loan.status !== "CLOSED") ||
      (status === "CLOSED" && loan.status === "CLOSED") ||
      (status === "OVERDUE" && overdue);
    return matchesQuery && matchesTab && matchesStatus;
  });

  function openCreate(type: "GIVEN" | "TAKEN") {
    setEditing(null);
    setErrors({});
    setFormOpen(true);
    setTab(type);
  }

  function openEdit(loan: LoanRow) {
    setEditing(loan);
    setErrors({});
    setFormOpen(true);
  }

  function submitLoan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveLoan(formData);
      if (result.ok) {
        toast(result.message ?? "Loan saved.");
        setFormOpen(false);
        setEditing(null);
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        toast(result.message ?? "Could not save loan.", "error");
      }
    });
  }

  function submitRepayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await recordRepayment(formData);
      if (result.ok) {
        toast(result.message ?? "Repayment recorded.");
        setRepayTarget(null);
        router.refresh();
      } else {
        toast(result.message ?? "Could not record repayment.", "error");
      }
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteLoan(target.id);
      if (result.ok) {
        toast(result.message ?? "Loan deleted.");
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast(result.message ?? "Could not delete loan.", "error");
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {(["ALL", "GIVEN", "TAKEN"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === value ? "bg-ink-900 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {value === "ALL" ? "All loans" : value === "GIVEN" ? "Given" : "Taken"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" className="fin-btn-secondary" onClick={() => openCreate("TAKEN")}>
            <ArrowDownLeft className="size-4 text-rose-500" /> Record borrowed
          </button>
          <button type="button" className="fin-btn-primary" onClick={() => openCreate("GIVEN")}>
            <Plus className="size-4" /> Add loan
          </button>
        </div>
      </div>

      <div className="fin-card mt-4 overflow-hidden">
        <Toolbar search={query} onSearch={setQuery} placeholder="Search by person or contact…">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="fin-select w-auto min-w-[9rem] py-2">
            <option value="OPEN">Open loans</option>
            <option value="ALL">All statuses</option>
            <option value="OVERDUE">Overdue only</option>
            <option value="CLOSED">Settled</option>
          </select>
        </Toolbar>

        {filtered.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title={loans.length === 0 ? "No loans tracked yet" : "No loans match this filter"}
            description={
              loans.length === 0
                ? "Record money you lend to friends or borrow from anyone — Finquira keeps a running balance and due dates."
                : "Try another tab or clear the search to see all loans."
            }
            action={
              <button type="button" className="fin-btn-primary" onClick={() => openCreate("GIVEN")}>
                <Plus className="size-4" /> Add a loan
              </button>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((loan) => {
              const amount = toNumber(loan.amount);
              const remaining = toNumber(loan.remainingAmount);
              const paid = Math.max(0, loan.paid);
              const days = daysUntil(loan.dueDate);
              const overdue = loan.status !== "CLOSED" && (days ?? 0) < 0;
              const given = loan.type === "GIVEN";
              return (
                <li key={loan.id} className="px-5 py-4 transition hover:bg-slate-50/50 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                          given ? "bg-brand-50 text-brand-600" : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {given ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{loan.personName}</p>
                          <Badge tone={given ? "green" : "rose"}>{given ? "Given" : "Taken"}</Badge>
                          {loan.status === "CLOSED" ? <Badge tone="slate">Settled</Badge> : null}
                          {overdue ? <Badge tone="amber">Overdue</Badge> : null}
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="size-3" /> Due {formatDate(loan.dueDate)}
                          </span>
                          <span>{loan.interestRate !== "0.00" ? `${toNumber(loan.interestRate)}% interest` : "No interest"}</span>
                          {loan.contactNumber ? <span className="hidden sm:inline">{loan.contactNumber}</span> : null}
                          {loan.payments.length > 0 ? <span>{loan.payments.length} repayment(s)</span> : null}
                        </p>
                        <div className="mt-2 max-w-sm">
                          <ProgressBar value={paid} total={amount} tone={given ? "brand" : "indigo"} />
                          <p className="mt-1 text-[11px] text-slate-500">
                            {formatMoney(paid, currency, { compact: true })} repaid · {percent(paid, amount)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                      <div className="text-right">
                        <p className="tnum text-sm font-semibold text-slate-900">{formatMoney(amount, currency)}</p>
                        <p className="tnum text-[11px] text-slate-500">
                          {formatMoney(remaining, currency)} remaining
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {loan.status !== "CLOSED" ? (
                          <button type="button" onClick={() => setRepayTarget(loan)} className="fin-btn-secondary px-2.5 py-1.5 text-xs">
                            Repay
                          </button>
                        ) : null}
                        <button type="button" onClick={() => openEdit(loan)} aria-label="Edit loan" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                          <Pencil className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(loan)} aria-label="Delete loan" className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit loan" : "Add loan"} description="Track money you gave out or borrowed." size="lg">
        <form key={editing?.id ?? "new"} onSubmit={submitLoan} className="space-y-4">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <FormGrid>
            <Field label="Loan type" htmlFor="type" error={errors.type}>
              <select id="type" name="type" defaultValue={editing?.type ?? "GIVEN"} className="fin-select">
                <option value="GIVEN">Money given (receivable)</option>
                <option value="TAKEN">Money taken (payable)</option>
              </select>
            </Field>
            <Field label="Person / institution" htmlFor="personName" error={errors.personName}>
              <input id="personName" name="personName" defaultValue={editing?.personName ?? ""} className="fin-input" placeholder="e.g. Daniel Reyes" required />
            </Field>
            <Field label="Contact number" htmlFor="contactNumber" error={errors.contactNumber}>
              <input id="contactNumber" name="contactNumber" defaultValue={editing?.contactNumber ?? ""} className="fin-input" placeholder="+1 555 0100" />
            </Field>
            <Field label="Principal amount" htmlFor="amount" error={errors.amount}>
              <input id="amount" name="amount" type="number" min="0" step="0.01" defaultValue={editing?.amount ?? ""} className="fin-input" placeholder="0.00" required />
            </Field>
            <Field label="Interest rate (%)" htmlFor="interestRate" error={errors.interestRate}>
              <input id="interestRate" name="interestRate" type="number" min="0" step="0.01" defaultValue={editing ? toNumber(editing.interestRate) : "0"} className="fin-input" />
            </Field>
            <Field label="Status" htmlFor="status" error={errors.status}>
              <select id="status" name="status" defaultValue={editing?.status ?? "ACTIVE"} className="fin-select">
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Settled</option>
              </select>
            </Field>
            <Field label="Start date" htmlFor="startDate" error={errors.startDate}>
              <input id="startDate" name="startDate" type="date" defaultValue={editing?.startDate ?? todayISO()} className="fin-input" required />
            </Field>
            <Field label="Due date" htmlFor="dueDate" error={errors.dueDate}>
              <input id="dueDate" name="dueDate" type="date" defaultValue={editing?.dueDate ?? todayISO()} className="fin-input" required />
            </Field>
            <Field label="Notes" htmlFor="notes" error={errors.notes} className="sm:col-span-2">
              <textarea id="notes" name="notes" rows={2} defaultValue={editing?.notes ?? ""} className="fin-input resize-none" placeholder="Purpose, agreed terms…" />
            </Field>
          </FormGrid>
          <ModalFooter>
            <button type="button" className="fin-btn-secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="fin-btn-primary" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Add loan"}
            </button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={Boolean(repayTarget)}
        onClose={() => setRepayTarget(null)}
        title={`Record repayment — ${repayTarget?.personName ?? ""}`}
        description={`Remaining balance ${formatMoney(repayTarget?.remainingAmount ?? 0, currency)}`}
      >
        <form onSubmit={submitRepayment} className="space-y-4">
          <input type="hidden" name="loanId" value={repayTarget?.id ?? ""} />
          <FormGrid>
            <Field label="Amount" htmlFor="repayAmount" error={errors.amount}>
              <input id="repayAmount" name="amount" type="number" min="0" step="0.01" max={toNumber(repayTarget?.remainingAmount ?? 0)} className="fin-input" placeholder="0.00" required />
            </Field>
            <Field label="Payment date" htmlFor="paymentDate" error={errors.paymentDate}>
              <input id="paymentDate" name="paymentDate" type="date" defaultValue={todayISO()} className="fin-input" required />
            </Field>
            <Field label="Notes" htmlFor="repayNotes" error={errors.notes} className="sm:col-span-2">
              <input id="repayNotes" name="notes" className="fin-input" placeholder="Optional, e.g. bank transfer" />
            </Field>
          </FormGrid>

          {repayTarget && repayTarget.payments.length > 0 ? (
            <div className="rounded-xl border border-slate-200">
              <p className="border-b border-slate-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Repayment history
              </p>
              <ul className="max-h-40 divide-y divide-slate-100 overflow-y-auto">
                {repayTarget.payments.map((payment) => (
                  <li key={payment.id} className="flex items-center justify-between gap-3 px-4 py-2 text-[13px]">
                    <span className="text-slate-500">{formatDate(payment.paymentDate)}</span>
                    <span className="truncate text-xs text-slate-400">{payment.notes}</span>
                    <span className="tnum font-medium text-slate-800">{formatMoney(payment.amount, currency)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <ModalFooter>
            <button type="button" className="fin-btn-secondary" onClick={() => setRepayTarget(null)}>
              Cancel
            </button>
            <button type="submit" className="fin-btn-primary" disabled={pending}>
              {pending ? "Recording…" : "Record repayment"}
            </button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete loan"
        message={`“${deleteTarget?.personName ?? ""}” and all of its repayment history will be permanently deleted.`}
        busy={pending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
