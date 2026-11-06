import type { Committee, CommitteeMember, CommitteePayment } from "@/db/schema";
import { percent, toNumber } from "./format";

export type CommitteeSummary = {
  memberCount: number;
  expected: number;
  collected: number;
  pendingCount: number;
  pendingAmount: number;
  progress: number;
  paidCount: number;
  currentReceiver: CommitteeMember | null;
  currentMonth: number;
  remainingMonths: number;
  monthsElapsed: number;
  receivedMembers: CommitteeMember[];
};

export function committeeSummary(
  committee: Committee,
  members: CommitteeMember[],
  payments: CommitteePayment[],
): CommitteeSummary {
  const expected = payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const paid = payments.filter((payment) => payment.status === "PAID");
  const pending = payments.filter((payment) => payment.status !== "PAID");
  const collected = paid.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const pendingAmount = pending.reduce((sum, payment) => sum + toNumber(payment.amount), 0);

  const start = new Date(`${committee.startDate}T00:00:00`);
  const now = new Date();
  const monthsElapsed = Math.max(
    0,
    Math.min(
      committee.durationMonths,
      (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1,
    ),
  );
  const currentMonth = Math.max(1, monthsElapsed);
  const receivedMembers = members.filter((member) => Boolean(member.receivedDate));
  const currentReceiver =
    members
      .filter((member) => !member.receivedDate)
      .sort((a, b) => a.position - b.position)[0] ?? null;

  return {
    memberCount: members.length,
    expected,
    collected,
    pendingCount: pending.length,
    pendingAmount,
    progress: percent(collected, expected),
    paidCount: paid.length,
    currentReceiver,
    currentMonth,
    remainingMonths: Math.max(0, committee.durationMonths - monthsElapsed),
    monthsElapsed,
    receivedMembers,
  };
}
