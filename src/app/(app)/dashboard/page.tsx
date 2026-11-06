import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  HandCoins,
  PiggyBank,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  committeeMembers,
  committeePayments,
  committees,
  expenses,
  income,
  loanPayments,
  loans,
} from "@/db/schema";
import { DonutChart, HorizontalBar, MonthlyBars, type DonutSlice } from "@/components/charts";
import { Badge, Card, CardHeader, EmptyState, Money, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { committeeSummary } from "@/lib/committee";
import { formatDate, formatMoney, monthLabel, percent, recentMonthKeys, toNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();

  const [incomeRows, expenseRows, loanRows, repaymentRows, committeeRows, memberRows, committeePaymentRows] =
    await Promise.all([
      db.select().from(income).where(eq(income.userId, user.id)),
      db.select().from(expenses).where(eq(expenses.userId, user.id)),
      db.select().from(loans).where(eq(loans.userId, user.id)),
      db
        .select({ loanId: loanPayments.loanId, amount: loanPayments.amount, paymentDate: loanPayments.paymentDate })
        .from(loanPayments)
        .innerJoin(loans, eq(loanPayments.loanId, loans.id))
        .where(eq(loans.userId, user.id)),
      db.select().from(committees).where(eq(committees.userId, user.id)),
      db
        .select({ member: committeeMembers })
        .from(committeeMembers)
        .innerJoin(committees, eq(committeeMembers.committeeId, committees.id))
        .where(eq(committees.userId, user.id)),
      db
        .select({ payment: committeePayments, committeeName: committees.name, memberName: committeeMembers.memberName })
        .from(committeePayments)
        .innerJoin(committees, eq(committeePayments.committeeId, committees.id))
        .innerJoin(committeeMembers, eq(committeePayments.memberId, committeeMembers.id))
        .where(eq(committees.userId, user.id)),
    ]);

  const currency = user.currency;
  const totalIncome = incomeRows.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const totalExpenses = expenseRows.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  const given = loanRows.filter((loan) => loan.type === "GIVEN");
  const taken = loanRows.filter((loan) => loan.type === "TAKEN");
  const moneyGiven = given.reduce((sum, loan) => sum + toNumber(loan.amount), 0);
  const moneyTaken = taken.reduce((sum, loan) => sum + toNumber(loan.amount), 0);
  const receivable = given.reduce((sum, loan) => sum + toNumber(loan.remainingAmount), 0);
  const payable = taken.reduce((sum, loan) => sum + toNumber(loan.remainingAmount), 0);
  const receivedBack = moneyGiven - receivable;
  const repaid = moneyTaken - payable;

  const activeCommittees = committeeRows.filter((committee) => committee.status === "ACTIVE");

  const committeeSummaries = committeeRows.map((committee) => {
    const members = memberRows.filter((row) => row.member.committeeId === committee.id).map((row) => row.member);
    const payments = committeePaymentRows
      .filter((row) => row.payment.committeeId === committee.id)
      .map((row) => row.payment);
    return { committee, summary: committeeSummary(committee, members, payments) };
  });

  /* ------------------------------------------------------------- charts */
  const monthKeys = recentMonthKeys(6);
  const series = monthKeys.map((key) => ({
    label: monthLabel(key),
    income: incomeRows
      .filter((row) => row.date.startsWith(key))
      .reduce((sum, row) => sum + toNumber(row.amount), 0),
    expense: expenseRows
      .filter((row) => row.date.startsWith(key))
      .reduce((sum, row) => sum + toNumber(row.amount), 0),
  }));

  const currentMonth = monthKeys[monthKeys.length - 1];
  const lastMonth = monthKeys[monthKeys.length - 2];
  const thisMonthIncome = series[series.length - 1]?.income ?? 0;
  const lastMonthIncome = series[series.length - 2]?.income ?? 0;
  const thisMonthExpense = series[series.length - 1]?.expense ?? 0;

  const categoryTotals = new Map<string, number>();
  for (const row of expenseRows) {
    if (!row.date.startsWith(currentMonth) && !row.date.startsWith(lastMonth)) continue;
    categoryTotals.set(row.category, (categoryTotals.get(row.category) ?? 0) + toNumber(row.amount));
  }
  const categoryData: DonutSlice[] = [...categoryTotals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  /* --------------------------------------------------- upcoming payments */
  const todayISO = new Date().toISOString().slice(0, 10);
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const horizon = in30Days.toISOString().slice(0, 10);

  const loanDues = loanRows
    .filter(
      (loan) =>
        loan.status !== "CLOSED" &&
        toNumber(loan.remainingAmount) > 0 &&
        loan.dueDate <= horizon,
    )
    .map((loan) => ({
      id: loan.id,
      title: loan.personName,
      subtitle: loan.type === "GIVEN" ? "Receivable" : "Payable",
      amount: toNumber(loan.remainingAmount),
      date: loan.dueDate,
      overdue: loan.dueDate < todayISO,
      kind: loan.type,
    }));

  const pendingCommitteePayments = committeePaymentRows
    .filter((row) => row.payment.status !== "PAID" && committeeRows.some((c) => c.id === row.payment.committeeId && c.status === "ACTIVE"))
    .slice(0, 4)
    .map((row) => ({
      id: row.payment.id,
      title: row.memberName,
      subtitle: `${row.committeeName} · Month ${row.payment.month}`,
      amount: toNumber(row.payment.amount),
      date: null as string | null,
      overdue: false,
      kind: "COMMITTEE" as const,
    }));

  const upcoming = [...loanDues, ...pendingCommitteePayments]
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"))
    .slice(0, 6);

  const upcomingAmount =
    loanDues.reduce((sum, item) => sum + item.amount, 0) +
    pendingCommitteePayments.reduce((sum, item) => sum + item.amount, 0);

  const isEmpty =
    incomeRows.length === 0 && expenseRows.length === 0 && loanRows.length === 0 && committeeRows.length === 0;

  const activeLoanProgress = loanRows
    .filter((loan) => loan.status !== "CLOSED")
    .map((loan) => {
      const paidFromRecords = repaymentRows
        .filter((row) => row.loanId === loan.id)
        .reduce((sum, row) => sum + toNumber(row.amount), 0);
      return {
        id: loan.id,
        label: `${loan.personName} (${loan.type === "GIVEN" ? "given" : "taken"})`,
        amount: toNumber(loan.amount),
        paid: paidFromRecords,
        remaining: toNumber(loan.remainingAmount),
      };
    })
    .slice(0, 4);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        description="Here is the complete picture of your income, spending, committees and loans."
        action={
          <>
            <Link href="/income" className="fin-btn-secondary">
              <TrendingUp className="size-4 text-brand-600" /> Add income
            </Link>
            <Link href="/expenses" className="fin-btn-primary">
              <TrendingDown className="size-4" /> Add expense
            </Link>
          </>
        }
      />

      {isEmpty ? (
        <Card className="overflow-hidden bg-linear-to-br from-brand-50 via-white to-white">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white">
              <Sparkles className="size-5" />
            </span>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-900">Your workspace is ready</h2>
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-600">
                Start by recording this month’s income and expenses. Every chart, report and balance on this dashboard
                fills in automatically from your entries.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/income" className="fin-btn-secondary">Log income</Link>
              <Link href="/committees" className="fin-btn-primary">Start a committee</Link>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total income"
          value={formatMoney(totalIncome, currency)}
          icon={TrendingUp}
          tone="positive"
          helper={`${formatMoney(thisMonthIncome, currency)} this month`}
          trend={
            thisMonthIncome !== lastMonthIncome ? (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  thisMonthIncome > lastMonthIncome ? "bg-brand-50 text-brand-700" : "bg-rose-50 text-rose-600"
                }`}
              >
                {thisMonthIncome > lastMonthIncome ? <ArrowUpRight className="size-3" /> : <ArrowDownLeft className="size-3" />}
                {lastMonthIncome > 0 ? `${Math.abs(percent(thisMonthIncome - lastMonthIncome, lastMonthIncome))}%` : "new"}
              </span>
            ) : null
          }
        />
        <StatCard
          label="Total expenses"
          value={formatMoney(totalExpenses, currency)}
          icon={TrendingDown}
          tone="negative"
          helper={`${formatMoney(thisMonthExpense, currency)} this month`}
        />
        <StatCard
          label="Current balance"
          value={formatMoney(balance, currency)}
          icon={Wallet}
          tone={balance >= 0 ? "positive" : "negative"}
          helper={totalIncome > 0 ? `${savingsRate}% savings rate` : "Add income to get started"}
        />
        <StatCard
          label="Active committees"
          value={String(activeCommittees.length)}
          icon={Users}
          tone="brand"
          helper={
            activeCommittees.length > 0
              ? `${formatMoney(activeCommittees.reduce((sum, c) => sum + toNumber(c.monthlyContribution), 0), currency)} monthly commitment`
              : "No committees running"
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Money given as loan"
          value={formatMoney(moneyGiven, currency)}
          icon={ArrowUpRight}
          tone="brand"
          helper={`${formatMoney(receivable, currency)} still to receive`}
        />
        <StatCard
          label="Money taken as loan"
          value={formatMoney(moneyTaken, currency)}
          icon={ArrowDownLeft}
          tone="warning"
          helper={`${formatMoney(payable, currency)} still to repay`}
        />
        <StatCard
          label="Upcoming payments"
          value={formatMoney(upcomingAmount, currency)}
          icon={CalendarClock}
          tone="negative"
          helper={`${loanDues.length + pendingCommitteePayments.length} items need attention`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Income vs expenses"
            subtitle="Last six months, all categories"
            icon={CircleDollarSign}
            action={
              <Link href="/reports" className="text-xs font-semibold text-brand-700 hover:underline">
                Reports
              </Link>
            }
          />
          <div className="px-5 pb-5 pt-4 sm:px-6">
            <MonthlyBars data={series} currency={currency} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Expense categories" subtitle="Current & previous month" icon={PiggyBank} />
          <div className="px-5 pb-5 pt-4 sm:px-6">
            <DonutChart data={categoryData} currency={currency} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Loan repayment progress"
            subtitle={`${formatMoney(receivedBack, currency, { compact: true })} recovered · ${formatMoney(repaid, currency, { compact: true })} repaid`}
            icon={HandCoins}
            action={
              <Link href="/loans" className="text-xs font-semibold text-brand-700 hover:underline">
                View
              </Link>
            }
          />
          <div className="space-y-4 px-5 pb-5 pt-4 sm:px-6">
            {activeLoanProgress.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-slate-400">No open loans. Nice and simple.</p>
            ) : (
              activeLoanProgress.map((loan) => (
                <HorizontalBar
                  key={loan.id}
                  label={loan.label}
                  value={loan.paid}
                  total={loan.amount}
                  rightLabel={`${formatMoney(loan.remaining, currency, { compact: true })} left`}
                  color="#6366f1"
                />
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Committee contributions"
            subtitle="Collected against expected"
            icon={Users}
            action={
              <Link href="/committees" className="text-xs font-semibold text-brand-700 hover:underline">
                View
              </Link>
            }
          />
          <div className="space-y-4 px-5 pb-5 pt-4 sm:px-6">
            {committeeSummaries.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-slate-400">No committees yet.</p>
            ) : (
              committeeSummaries.slice(0, 3).map(({ committee, summary }) => (
                <div key={committee.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <Link href={`/committees/${committee.id}`} className="truncate text-[13px] font-medium text-slate-700 hover:text-brand-700">
                      {committee.name}
                    </Link>
                    <span className="tnum shrink-0 text-xs text-slate-500">
                      {formatMoney(summary.collected, currency, { compact: true })} / {formatMoney(summary.expected, currency, { compact: true })}
                    </span>
                  </div>
                  <ProgressBar value={summary.collected} total={summary.expected || 1} />
                  <p className="mt-1 text-[11px] text-slate-400">
                    {summary.pendingCount} pending · {summary.remainingMonths} months left
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Upcoming payments" subtitle="Next 30 days plus pending contributions" icon={CalendarClock} />
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Nothing due"
              description="Loan dues within 30 days and pending committee contributions will show up here."
            />
          ) : (
            <ul className="flex-1 divide-y divide-slate-100 px-2 pt-2">
              {upcoming.map((item) => (
                <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3 px-3 py-2.5">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                      item.kind === "TAKEN"
                        ? "bg-rose-50 text-rose-600"
                        : item.kind === "GIVEN"
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {item.kind === "COMMITTEE" ? <Users className="size-3.5" /> : item.kind === "TAKEN" ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-800">{item.title}</p>
                    <p className="truncate text-[11px] text-slate-500">{item.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="tnum text-[12.5px] font-semibold text-slate-900">{formatMoney(item.amount, currency)}</p>
                    {item.date ? (
                      <p className={`text-[10.5px] ${item.overdue ? "font-semibold text-rose-600" : "text-slate-400"}`}>
                        {item.overdue ? "Overdue" : formatDate(item.date)}
                      </p>
                    ) : (
                      <Badge tone="amber">pending</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/loans"
            className="mt-auto flex items-center justify-center gap-1 border-t border-slate-100 py-3 text-xs font-semibold text-brand-700 transition hover:bg-brand-50/40"
          >
            Manage loans & repayments <ChevronRight className="size-3.5" />
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent income" subtitle="Your latest entries" icon={TrendingUp} />
          <ul className="divide-y divide-slate-100 px-2 pt-2">
            {incomeRows
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-slate-800">{row.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {row.category} · {formatDate(row.date)}
                    </p>
                  </div>
                  <Money value={row.amount} currency={currency} sign="+" className="text-[13px] font-semibold text-brand-600" />
                </li>
              ))}
            {incomeRows.length === 0 ? <li className="px-3 py-6 text-center text-[13px] text-slate-400">No income yet.</li> : null}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Recent expenses" subtitle="Largest first" icon={TrendingDown} />
          <ul className="divide-y divide-slate-100 px-2 pt-2">
            {expenseRows
              .slice()
              .sort((a, b) => Number(b.amount) - Number(a.amount))
              .slice(0, 5)
              .map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-slate-800">{row.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {row.category} · {formatDate(row.date)}
                    </p>
                  </div>
                  <Money value={row.amount} currency={currency} sign="−" className="text-[13px] font-semibold text-slate-800" />
                </li>
              ))}
            {expenseRows.length === 0 ? <li className="px-3 py-6 text-center text-[13px] text-slate-400">No expenses yet.</li> : null}
          </ul>
        </Card>
      </div>
    </div>
  );
}
