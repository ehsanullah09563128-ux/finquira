import { CalendarClock, PiggyBank, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { committeeMembers, committeePayments, committees } from "@/db/schema";
import { CommitteeManager, type CommitteeCardData } from "@/components/modules/committee-manager";
import { PageHeader, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { committeeSummary } from "@/lib/committee";
import { formatMoney, toNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Committees" };

export default async function CommitteesPage() {
  const user = await requireUser();

  const [committeeRows, memberRows, paymentRows] = await Promise.all([
    db.select().from(committees).where(eq(committees.userId, user.id)).orderBy(asc(committees.startDate)),
    db
      .select({ member: committeeMembers })
      .from(committeeMembers)
      .innerJoin(committees, eq(committeeMembers.committeeId, committees.id))
      .where(eq(committees.userId, user.id)),
    db
      .select({ payment: committeePayments })
      .from(committeePayments)
      .innerJoin(committees, eq(committeePayments.committeeId, committees.id))
      .where(eq(committees.userId, user.id)),
  ]);

  const cards: CommitteeCardData[] = committeeRows.map((committee) => {
    const members = memberRows.filter((row) => row.member.committeeId === committee.id).map((row) => row.member);
    const payments = paymentRows.filter((row) => row.payment.committeeId === committee.id).map((row) => row.payment);
    const summary = committeeSummary(committee, members, payments);
    return {
      id: committee.id,
      name: committee.name,
      description: committee.description,
      totalMembers: committee.totalMembers,
      monthlyContribution: committee.monthlyContribution,
      durationMonths: committee.durationMonths,
      totalAmount: committee.totalAmount,
      startDate: committee.startDate,
      endDate: committee.endDate,
      status: committee.status,
      memberCount: summary.memberCount,
      collected: summary.collected,
      expected: summary.expected,
      progress: summary.progress,
      pendingCount: summary.pendingCount,
      currentReceiver: summary.currentReceiver?.memberName ?? null,
      currentMonth: summary.currentMonth,
      remainingMonths: summary.remainingMonths,
    };
  });

  const activeCount = committeeRows.filter((committee) => committee.status === "ACTIVE").length;
  const totalCollected = cards.reduce((sum, card) => sum + card.collected, 0);
  const pendingCount = cards.reduce((sum, card) => sum + card.pendingCount, 0);
  const monthlyCommitment = committeeRows
    .filter((committee) => committee.status === "ACTIVE")
    .reduce((sum, committee) => sum + toNumber(committee.monthlyContribution), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Committees"
        description="Run your BC / saving circle with a real ledger: member turns, monthly contributions and payouts, all in one place."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Committees" value={String(committeeRows.length)} icon={Users} tone="brand" helper={`${activeCount} active`} />
        <StatCard label="Contributions collected" value={formatMoney(totalCollected, user.currency)} icon={PiggyBank} tone="positive" helper="Across all committees" />
        <StatCard label="Pending contributions" value={String(pendingCount)} icon={CalendarClock} tone={pendingCount > 0 ? "warning" : "neutral"} helper="Mark them paid in the tracker" />
        <StatCard label="Monthly commitment" value={formatMoney(monthlyCommitment, user.currency)} icon={Wallet} tone="neutral" helper="Active committees" />
      </div>

      <CommitteeManager committees={cards} currency={user.currency} />
    </div>
  );
}
