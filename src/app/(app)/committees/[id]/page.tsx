import { ArrowLeft, CalendarClock, HandCoins, PiggyBank, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { committeeMembers, committeePayments, committees } from "@/db/schema";
import { CommitteeDetail } from "@/components/modules/committee-detail";
import { Card, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { committeeSummary } from "@/lib/committee";
import { formatDate, formatMoney, percent, toNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Committee detail" };

export default async function CommitteeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const [committee] = await db
    .select()
    .from(committees)
    .where(and(eq(committees.id, id), eq(committees.userId, user.id)))
    .limit(1);

  if (!committee) notFound();

  const [members, payments] = await Promise.all([
    db
      .select()
      .from(committeeMembers)
      .where(eq(committeeMembers.committeeId, committee.id))
      .orderBy(asc(committeeMembers.position)),
    db
      .select()
      .from(committeePayments)
      .where(eq(committeePayments.committeeId, committee.id))
      .orderBy(asc(committeePayments.month)),
  ]);

  const summary = committeeSummary(committee, members, payments);
  const currency = user.currency;

  return (
    <div className="space-y-5">
      <Link href="/committees" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 transition hover:text-slate-900">
        <ArrowLeft className="size-3.5" /> All committees
      </Link>

      <PageHeader
        title={committee.name}
        description={committee.description || "A saving committee tracked month by month."}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Payout pot"
          value={formatMoney(committee.totalAmount, currency)}
          icon={PiggyBank}
          tone="brand"
          helper={`${formatMoney(committee.monthlyContribution, currency)} × ${committee.totalMembers} members`}
        />
        <StatCard
          label="Collected"
          value={formatMoney(summary.collected, currency)}
          icon={HandCoins}
          tone="positive"
          helper={`${summary.paidCount} of ${payments.length} contributions`}
        />
        <StatCard
          label="Pending"
          value={formatMoney(summary.pendingAmount, currency)}
          icon={CalendarClock}
          tone={summary.pendingCount > 0 ? "warning" : "neutral"}
          helper={`${summary.pendingCount} contributions open`}
        />
        <StatCard
          label="Current receiver"
          value={summary.currentReceiver?.memberName ?? "Complete"}
          icon={Users}
          tone="brand"
          helper={`Month ${Math.min(summary.currentMonth, committee.durationMonths)} of ${committee.durationMonths} · ${summary.remainingMonths} left`}
        />
      </div>

      <Card>
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Contribution progress</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatMoney(summary.collected, currency)} collected of {formatMoney(summary.expected, currency)} expected
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="tnum text-lg font-semibold text-slate-900">{summary.progress}%</p>
              <p className="text-[11px] text-slate-400">
                {summary.receivedMembers.length}/{members.length} payouts made
              </p>
            </div>
            <div className="h-12 w-28">
              <div className="mt-4">
                <ProgressBar value={summary.collected} total={summary.expected || 1} />
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-3 border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500 sm:grid-cols-3 sm:px-6">
          <p>
            Start <span className="font-medium text-slate-700">{formatDate(committee.startDate)}</span>
          </p>
          <p>
            End <span className="font-medium text-slate-700">{formatDate(committee.endDate)}</span>
          </p>
          <p>
            Completion{" "}
            <span className="font-medium text-slate-700">
              {percent(summary.monthsElapsed, committee.durationMonths)}% of the cycle elapsed
            </span>
          </p>
        </div>
      </Card>

      <CommitteeDetail
        committee={{
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
        }}
        members={members.map((member) => ({
          id: member.id,
          memberName: member.memberName,
          phone: member.phone,
          email: member.email,
          position: member.position,
          receivedAmount: member.receivedAmount,
          receivedDate: member.receivedDate,
        }))}
        payments={payments.map((payment) => ({
          id: payment.id,
          memberId: payment.memberId,
          month: payment.month,
          amount: payment.amount,
          status: payment.status,
          paymentDate: payment.paymentDate,
        }))}
        currency={currency}
      />

      <p className="text-center text-[11.5px] text-slate-400">
        Total monthly inflow at full membership:{" "}
        <span className="font-medium text-slate-600">
          {formatMoney(toNumber(committee.monthlyContribution) * members.length, currency)}
        </span>
      </p>
    </div>
  );
}
