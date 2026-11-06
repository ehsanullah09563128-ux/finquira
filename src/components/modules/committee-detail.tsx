"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, HandCoins, Pencil, Plus, Trash2, Users } from "lucide-react";
import {
  deleteCommittee,
  deleteMember,
  markMemberReceived,
  markMonthPaid,
  saveCommittee,
  saveMember,
  toggleCommitteePayment,
} from "@/app/actions/committees";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Field, FormGrid, Modal, ModalFooter } from "@/components/modal";
import { Badge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { COMMITTEE_STATUSES } from "@/lib/constants";
import { formatDate, formatMoney, todayISO, toNumber } from "@/lib/format";
import type { FieldErrors } from "@/lib/validation";

export type CommitteeDetailData = {
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
};

export type MemberData = {
  id: string;
  memberName: string;
  phone: string;
  email: string;
  position: number;
  receivedAmount: string;
  receivedDate: string | null;
};

export type PaymentData = {
  id: string;
  memberId: string;
  month: number;
  amount: string;
  status: string;
  paymentDate: string | null;
};

export function CommitteeDetail({
  committee,
  members,
  payments,
  currency,
}: {
  committee: CommitteeDetailData;
  members: MemberData[];
  payments: PaymentData[];
  currency: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<MemberData | null>(null);

  const months = Array.from({ length: committee.durationMonths }, (_, index) => index + 1);
  const sortedMembers = [...members].sort((a, b) => a.position - b.position);

  function run(task: () => Promise<{ ok: boolean; message?: string; fieldErrors?: FieldErrors }>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await task();
      if (result.ok) {
        toast(result.message ?? "Saved.");
        setErrors({});
        onSuccess?.();
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        toast(result.message ?? "Something went wrong.", "error");
      }
    });
  }

  function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(() => saveCommittee(formData), () => setEditOpen(false));
  }

  function submitMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(() => saveMember(formData), () => setMemberOpen(false));
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={committee.status === "ACTIVE" ? "green" : committee.status === "COMPLETED" ? "slate" : "amber"}>
          {committee.status.toLowerCase()}
        </Badge>
        <span className="text-xs text-slate-500">
          {formatDate(committee.startDate)} → {formatDate(committee.endDate)}
        </span>
        <div className="ml-auto flex gap-2">
          <button type="button" className="fin-btn-secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Edit
          </button>
          <button type="button" className="fin-btn-primary" onClick={() => setMemberOpen(true)}>
            <Plus className="size-4" /> Add member
          </button>
          <button type="button" className="fin-btn-danger px-3" onClick={() => setDeleteOpen(true)} aria-label="Delete committee">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 fin-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">Members & payout order</h2>
          </div>
          <span className="text-[11px] font-medium text-slate-400">{members.length} of {committee.totalMembers} slots used</span>
        </div>

        {sortedMembers.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">No members added yet</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
              Add each member with their payout position. Payment rows for all {committee.durationMonths} months are
              generated automatically.
            </p>
            <button type="button" className="fin-btn-primary mt-4" onClick={() => setMemberOpen(true)}>
              <Plus className="size-4" /> Add member
            </button>
          </div>
        ) : (
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="fin-th w-16">Turn</th>
                  <th className="fin-th">Member</th>
                  <th className="fin-th">Contact</th>
                  <th className="fin-th">Received</th>
                  <th className="fin-th">Payout date</th>
                  <th className="fin-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60">
                    <td className="fin-td">
                      <span className="grid size-7 place-items-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                        {member.position}
                      </span>
                    </td>
                    <td className="fin-td font-medium text-slate-900">{member.memberName}</td>
                    <td className="fin-td text-xs text-slate-500">
                      <p>{member.phone || "—"}</p>
                      <p className="text-slate-400">{member.email || "—"}</p>
                    </td>
                    <td className="fin-td tnum">
                      {toNumber(member.receivedAmount) > 0 ? (
                        <span className="font-medium text-brand-700">{formatMoney(member.receivedAmount, currency)}</span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="fin-td text-slate-500">{member.receivedDate ? formatDate(member.receivedDate) : "—"}</td>
                    <td className="fin-td">
                      <div className="flex items-center justify-end gap-1">
                        {!member.receivedDate ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => run(() => markMemberReceived(committee.id, member.id))}
                            className="fin-btn-secondary px-2.5 py-1.5 text-xs"
                          >
                            <HandCoins className="size-3.5" /> Mark paid out
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setMemberToDelete(member)}
                          aria-label={`Remove ${member.memberName}`}
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
        )}

        {sortedMembers.length > 0 ? (
          <ul className="divide-y divide-slate-100 md:hidden">
            {sortedMembers.map((member) => (
              <li key={member.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      <span className="mr-2 text-xs text-slate-400">#{member.position}</span>
                      {member.memberName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{member.phone || member.email || "No contact"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {member.receivedDate
                        ? `Received ${formatMoney(member.receivedAmount, currency)} on ${formatDate(member.receivedDate)}`
                        : "Payout pending"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {!member.receivedDate ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => markMemberReceived(committee.id, member.id))}
                        className="fin-btn-secondary px-2 py-1 text-[11px]"
                      >
                        Payout done
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setMemberToDelete(member)}
                      aria-label="Remove member"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {members.length > 0 ? (
        <div className="mt-4 fin-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Contribution tracker</h2>
              <p className="mt-0.5 text-xs text-slate-500">Tap any cell to mark a member’s monthly contribution paid or pending.</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand-500" /> Paid</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-slate-200" /> Pending</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-[9.5rem] bg-slate-50/90 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 backdrop-blur">
                    Member
                  </th>
                  {months.map((month) => (
                    <th key={month} className="px-1.5 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => run(() => markMonthPaid(committee.id, month))}
                        title={`Mark all month ${month} contributions paid`}
                        className="mx-auto grid min-w-[2.6rem] rounded-lg px-1.5 py-1 text-[10px] font-semibold text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
                      >
                        M{month}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((member) => (
                  <tr key={member.id} className="border-t border-slate-100">
                    <td className="sticky left-0 z-10 max-w-[11rem] truncate bg-white px-4 py-2 text-[12.5px] font-medium text-slate-700">
                      {member.memberName}
                    </td>
                    {months.map((month) => {
                      const payment = payments.find(
                        (item) => item.memberId === member.id && item.month === month,
                      );
                      const paid = payment?.status === "PAID";
                      return (
                        <td key={month} className="px-1.5 py-2 text-center">
                          <button
                            type="button"
                            disabled={!payment || pending}
                            onClick={() => payment && run(() => toggleCommitteePayment(payment.id, !paid))}
                            title={
                              payment
                                ? `${member.memberName} · Month ${month} · ${paid ? "Paid" : "Pending"}`
                                : "No schedule"
                            }
                            className={`mx-auto grid size-7 place-items-center rounded-lg border transition ${
                              paid
                                ? "border-brand-500 bg-brand-500 text-white hover:bg-brand-600"
                                : "border-slate-200 bg-slate-50 text-transparent hover:border-brand-300 hover:bg-brand-50"
                            } disabled:opacity-40`}
                          >
                            <Check className="size-3.5" strokeWidth={3} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit committee" size="lg">
        <form onSubmit={submitEdit} className="space-y-4">
          <input type="hidden" name="id" value={committee.id} />
          <FormGrid>
            <Field label="Committee name" htmlFor="edit-name" error={errors.name} className="sm:col-span-2">
              <input id="edit-name" name="name" defaultValue={committee.name} className="fin-input" required />
            </Field>
            <Field label="Description" htmlFor="edit-description" error={errors.description} className="sm:col-span-2">
              <textarea id="edit-description" name="description" rows={2} defaultValue={committee.description} className="fin-input resize-none" />
            </Field>
            <Field label="Number of members" htmlFor="edit-totalMembers" error={errors.totalMembers}>
              <input id="edit-totalMembers" name="totalMembers" type="number" min="2" max="200" defaultValue={committee.totalMembers} className="fin-input" required />
            </Field>
            <Field label="Monthly contribution" htmlFor="edit-contribution" error={errors.monthlyContribution}>
              <input id="edit-contribution" name="monthlyContribution" type="number" min="0" step="0.01" defaultValue={toNumber(committee.monthlyContribution)} className="fin-input" required />
            </Field>
            <Field label="Duration (months)" htmlFor="edit-duration" error={errors.durationMonths}>
              <input id="edit-duration" name="durationMonths" type="number" min="1" max="120" defaultValue={committee.durationMonths} className="fin-input" required />
            </Field>
            <Field label="Status" htmlFor="edit-status" error={errors.status}>
              <select id="edit-status" name="status" defaultValue={committee.status} className="fin-select">
                {COMMITTEE_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0) + option.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start date" htmlFor="edit-startDate" error={errors.startDate} className="sm:col-span-2">
              <input id="edit-startDate" name="startDate" type="date" defaultValue={committee.startDate} className="fin-input" required />
            </Field>
          </FormGrid>
          <ModalFooter>
            <button type="button" className="fin-btn-secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="fin-btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal open={memberOpen} onClose={() => setMemberOpen(false)} title="Add committee member" description="Position decides the payout turn.">
        <form onSubmit={submitMember} className="space-y-4">
          <input type="hidden" name="committeeId" value={committee.id} />
          <FormGrid>
            <Field label="Member name" htmlFor="memberName" error={errors.memberName} className="sm:col-span-2">
              <input id="memberName" name="memberName" className="fin-input" placeholder="Full name" required />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone}>
              <input id="phone" name="phone" className="fin-input" placeholder="+1 555 0100" />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email}>
              <input id="email" name="email" type="email" className="fin-input" placeholder="member@example.com" />
            </Field>
            <Field label="Payout position" htmlFor="position" error={errors.position} className="sm:col-span-2">
              <input
                id="position"
                name="position"
                type="number"
                min="1"
                max={committee.durationMonths}
                defaultValue={members.length + 1}
                className="fin-input"
                required
              />
            </Field>
          </FormGrid>
          <ModalFooter>
            <button type="button" className="fin-btn-secondary" onClick={() => setMemberOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="fin-btn-primary" disabled={pending}>
              {pending ? "Adding…" : "Add member"}
            </button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete committee"
        message={`“${committee.name}”, all members and contribution history will be permanently removed.`}
        busy={pending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteCommittee(committee.id);
            if (result.ok) {
              toast(result.message ?? "Committee deleted.");
              router.push("/committees");
            } else {
              toast(result.message ?? "Could not delete committee.", "error");
            }
          })
        }
      />

      <ConfirmDialog
        open={Boolean(memberToDelete)}
        title="Remove member"
        message={`Remove ${memberToDelete?.memberName ?? "this member"} and their payment schedule from this committee?`}
        confirmLabel="Remove"
        busy={pending}
        onClose={() => setMemberToDelete(null)}
        onConfirm={() => {
          if (!memberToDelete) return;
          const target = memberToDelete;
          run(() => deleteMember(committee.id, target.id), () => setMemberToDelete(null));
        }}
      />
    </>
  );
}
