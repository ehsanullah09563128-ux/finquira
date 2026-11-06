"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, CalendarRange, Plus, Users, Wallet } from "lucide-react";
import { saveCommittee } from "@/app/actions/committees";
import { Field, FormGrid, Modal, ModalFooter } from "@/components/modal";
import { Badge, EmptyState, ProgressBar } from "@/components/ui";
import { useToast } from "@/components/toast";
import { COMMITTEE_STATUSES } from "@/lib/constants";
import { formatDate, formatMoney, todayISO } from "@/lib/format";
import type { FieldErrors } from "@/lib/validation";

export type CommitteeCardData = {
  id: string;
  name: string;
  description: string;
  totalMembers: number;
  monthlyContribution: string;
  durationMonths: number;
  totalAmount: string;
  startDate: string;
  endDate: string;
  status: string;
  memberCount: number;
  collected: number;
  expected: number;
  progress: number;
  pendingCount: number;
  currentReceiver: string | null;
  currentMonth: number;
  remainingMonths: number;
};

export function CommitteeManager({ committees, currency }: { committees: CommitteeCardData[]; currency: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveCommittee(formData);
      if (result.ok) {
        toast(result.message ?? "Committee created.");
        setFormOpen(false);
        router.refresh();
        if (result.id) router.push(`/committees/${result.id}`);
      } else {
        setErrors(result.fieldErrors ?? {});
        toast(result.message ?? "Could not create committee.", "error");
      }
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <button type="button" className="fin-btn-primary" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" /> New committee
        </button>
      </div>

      {committees.length === 0 ? (
        <div className="fin-card mt-4">
          <EmptyState
            icon={Users}
            title="No committees yet"
            description="A committee (BC) pools a fixed monthly contribution from every member and pays out the pot in turn. Create one to track members, contributions and payouts."
            action={
              <button type="button" className="fin-btn-primary" onClick={() => setFormOpen(true)}>
                <Plus className="size-4" /> Create your first committee
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {committees.map((committee) => (
            <Link
              key={committee.id}
              href={`/committees/${committee.id}`}
              className="fin-card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-semibold tracking-tight text-slate-900">{committee.name}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {committee.description || "No description"}
                  </p>
                </div>
                <Badge
                  tone={committee.status === "ACTIVE" ? "green" : committee.status === "COMPLETED" ? "slate" : "amber"}
                >
                  {committee.status.toLowerCase()}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-center">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Members</p>
                  <p className="tnum text-sm font-semibold text-slate-800">
                    {committee.memberCount}/{committee.totalMembers}
                  </p>
                </div>
                <div className="border-x border-slate-200/70">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Monthly</p>
                  <p className="tnum text-sm font-semibold text-slate-800">
                    {formatMoney(committee.monthlyContribution, currency, { compact: true })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Pending</p>
                  <p className="tnum text-sm font-semibold text-slate-800">{committee.pendingCount}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Collected {formatMoney(committee.collected, currency, { compact: true })}</span>
                  <span>{committee.progress}%</span>
                </div>
                <ProgressBar value={committee.collected} total={committee.expected || 1} />
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                <p className="flex items-center gap-1.5">
                  <Wallet className="size-3.5 text-slate-400" />
                  Total pot {formatMoney(committee.totalAmount, currency, { compact: true })} ·{" "}
                  {committee.durationMonths} months
                </p>
                <p className="flex items-center gap-1.5">
                  <CalendarRange className="size-3.5 text-slate-400" />
                  {formatDate(committee.startDate)} → {formatDate(committee.endDate)}
                </p>
                <p className="flex items-center gap-1.5">
                  <Users className="size-3.5 text-slate-400" />
                  {committee.currentReceiver ? (
                    <>
                      Next receiver <span className="font-medium text-slate-700">{committee.currentReceiver}</span>
                    </>
                  ) : (
                    "All members paid out"
                  )}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="text-[11px] font-medium text-slate-400">
                  Month {Math.min(committee.currentMonth, committee.durationMonths)} of {committee.durationMonths} ·{" "}
                  {committee.remainingMonths} left
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 group-hover:gap-2 transition-all">
                  Open <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Create committee" description="Set the contribution plan — you can add members right after." size="lg">
        <form onSubmit={submit} className="space-y-4">
          <FormGrid>
            <Field label="Committee name" htmlFor="name" error={errors.name} className="sm:col-span-2">
              <input id="name" name="name" className="fin-input" placeholder="e.g. Family Savings Circle" required />
            </Field>
            <Field label="Description" htmlFor="description" error={errors.description} className="sm:col-span-2">
              <textarea id="description" name="description" rows={2} className="fin-input resize-none" placeholder="How the committee works, payout rules…" />
            </Field>
            <Field label="Number of members" htmlFor="totalMembers" error={errors.totalMembers}>
              <input id="totalMembers" name="totalMembers" type="number" min="2" max="200" defaultValue={8} className="fin-input" required />
            </Field>
            <Field label="Monthly contribution" htmlFor="monthlyContribution" error={errors.monthlyContribution}>
              <input id="monthlyContribution" name="monthlyContribution" type="number" min="0" step="0.01" className="fin-input" placeholder="250.00" required />
            </Field>
            <Field label="Duration (months)" htmlFor="durationMonths" error={errors.durationMonths}>
              <input id="durationMonths" name="durationMonths" type="number" min="1" max="120" defaultValue={8} className="fin-input" required />
            </Field>
            <Field label="Status" htmlFor="status" error={errors.status}>
              <select id="status" name="status" defaultValue="ACTIVE" className="fin-select">
                {COMMITTEE_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0) + option.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start date" htmlFor="startDate" error={errors.startDate} className="sm:col-span-2">
              <input id="startDate" name="startDate" type="date" defaultValue={todayISO()} className="fin-input" required />
            </Field>
          </FormGrid>
          <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-500">
            Total pot is calculated automatically as{" "}
            <span className="font-medium text-slate-700">members × monthly contribution</span>. Each member receives the
            pot once, in position order.
          </p>
          <ModalFooter>
            <button type="button" className="fin-btn-secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="fin-btn-primary" disabled={pending}>
              {pending ? "Creating…" : "Create committee"}
            </button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
