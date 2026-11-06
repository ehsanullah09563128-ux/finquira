import { BarChart3, HandCoins, PiggyBank, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { committeeMembers, committeePayments, committees, expenses, income, loanPayments, loans } from "@/db/schema";
import { MonthlyBars } from "@/components/charts";
import { ReportFilters } from "@/components/report-filters";
import { Badge, Card, CardHeader, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { committeeSummary } from "@/lib/committee";
import { formatDate, formatMoney, monthKey, monthLabel, percent, toNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

function monthRange(from: string, to: string): string[] {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const keys: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end && keys.length < 60) {
    keys.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().slice(0, 10);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(params.from ?? "") ? params.from! : defaultFrom;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(params.to ?? "") ? params.to! : today;
  const range = { from, to };
  const currency = user.currency;

  const [incomeRows, expenseRows, loanRows, repaymentRows, committeeRows, memberRows, committeePaymentRows] =
    await Promise.all([
      db.select().from(income).where(eq(income.userId, user.id)),
      db.select().from(expenses).where(eq(expenses.userId, user.id)),
      db.select().from(loans).where(eq(loans.userId, user.id)),
      db
        .select({ payment: loanPayments, type: loans.type, personName: loans.personName })
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
        .select({ payment: committeePayments })
        .from(committeePayments)
        .innerJoin(committees, eq(committeePayments.committeeId, committees.id))
        .where(eq(committees.userId, user.id)),
    ]);

  const inRange = (value: string | null) => Boolean(value) && value! >= from && value! <= to;

  const periodIncome = incomeRows.filter((row) => inRange(row.date));
  const periodExpenses = expenseRows.filter((row) => inRange(row.date));
  const totalIncome = periodIncome.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const totalExpenses = periodExpenses.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const netSavings = totalIncome - totalExpenses;

  const keys = monthRange(from, to);
  const monthly = keys.map((key) => {
    const monthIncome = periodIncome.filter((row) => row.date.startsWith(key)).reduce((sum, row) => sum + toNumber(row.amount), 0);
    const monthExpense = periodExpenses.filter((row) => row.date.startsWith(key)).reduce((sum, row) => sum + toNumber(row.amount), 0);
    return { key, income: monthIncome, expense: monthExpense, net: monthIncome - monthExpense };
  });

  const categoryMap = new Map<string, number>();
  for (const row of periodExpenses) {
    categoryMap.set(row.category, (categoryMap.get(row.category) ?? 0) + toNumber(row.amount));
  }
  const expenseCategories = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);

  const incomeCategoryMap = new Map<string, number>();
  for (const row of periodIncome) {
    incomeCategoryMap.set(row.category, (incomeCategoryMap.get(row.category) ?? 0) + toNumber(row.amount));
  }
  const incomeCategories = [...incomeCategoryMap.entries()].sort((a, b) => b[1] - a[1]);

  const periodRepayments = repaymentRows.filter((row) => inRange(row.payment.paymentDate));
  const givenRows = loanRows.filter((loan) => loan.type === "GIVEN");
  const takenRows = loanRows.filter((loan) => loan.type === "TAKEN");
  const receivedInPeriod = periodRepayments
    .filter((row) => row.type === "GIVEN")
    .reduce((sum, row) => sum + toNumber(row.payment.amount), 0);
  const paidInPeriod = periodRepayments
    .filter((row) => row.type === "TAKEN")
    .reduce((sum, row) => sum + toNumber(row.payment.amount), 0);
  const outstandingReceivable = givenRows.reduce((sum, loan) => sum + toNumber(loan.remainingAmount), 0);
  const outstandingPayable = takenRows.reduce((sum, loan) => sum + toNumber(loan.remainingAmount), 0);

  const committeeReports = committeeRows.map((committee) => {
    const members = memberRows.filter((row) => row.member.committeeId === committee.id).map((row) => row.member);
    const payments = committeePaymentRows.filter((row) => row.payment.committeeId === committee.id).map((row) => row.payment);
    const summary = committeeSummary(committee, members, payments);
    const collectedInPeriod = payments
      .filter((payment) => payment.status === "PAID" && inRange(payment.paymentDate))
      .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
    return { committee, summary, collectedInPeriod };
  });

  const committeeCollected = committeeReports.reduce((sum, item) => sum + item.summary.collected, 0);
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Filter any date range, review monthly performance and export clean CSV files for your records."
      />

      <ReportFilters from={from} to={to} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income in range" value={formatMoney(totalIncome, currency)} icon={Wallet} tone="positive" helper={`${periodIncome.length} entries`} />
        <StatCard label="Expenses in range" value={formatMoney(totalExpenses, currency)} icon={BarChart3} tone="negative" helper={`${periodExpenses.length} entries`} />
        <StatCard
          label="Net savings"
          value={formatMoney(netSavings, currency)}
          icon={PiggyBank}
          tone={netSavings >= 0 ? "brand" : "warning"}
          helper={`${savingsRate}% of income kept`}
        />
        <StatCard
          label="Committee collected"
          value={formatMoney(committeeCollected, currency)}
          icon={Users}
          tone="neutral"
          helper={`${committeeReports.length} committees`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Monthly income vs expenses" subtitle={`${formatDate(from)} → ${formatDate(to)}`} />
          <div className="px-5 pb-5 pt-4 sm:px-6">
            <MonthlyBars data={monthly.map((row) => ({ label: monthLabel(row.key), income: row.income, expense: row.expense }))} currency={currency} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Loan report" subtitle="Lifetime balances" icon={HandCoins} />
          <div className="space-y-3 px-5 py-4 text-[13px] sm:px-6">
            {[
              { label: "Given (total)", value: givenRows.reduce((sum, loan) => sum + toNumber(loan.amount), 0), tone: "text-slate-800" },
              { label: "Received back in range", value: receivedInPeriod, tone: "text-brand-700" },
              { label: "Outstanding receivable", value: outstandingReceivable, tone: "text-slate-800" },
              { label: "Borrowed (total)", value: takenRows.reduce((sum, loan) => sum + toNumber(loan.amount), 0), tone: "text-slate-800" },
              { label: "Repaid in range", value: paidInPeriod, tone: "text-indigo-700" },
              { label: "Outstanding payable", value: outstandingPayable, tone: "text-rose-600" },
            ].map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-500">{item.label}</span>
                <span className={`tnum font-semibold ${item.tone}`}>{formatMoney(item.value, currency)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Monthly breakdown" subtitle="Income, expenses and net per month" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="fin-th">Month</th>
                  <th className="fin-th text-right">Income</th>
                  <th className="fin-th text-right">Expenses</th>
                  <th className="fin-th text-right">Net</th>
                  <th className="fin-th text-right">Saved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthly.map((row) => (
                  <tr key={row.key}>
                    <td className="fin-td font-medium text-slate-800">{monthLabel(row.key)} {row.key.slice(0, 4)}</td>
                    <td className="fin-td tnum text-right text-brand-700">{formatMoney(row.income, currency, { compact: true })}</td>
                    <td className="fin-td tnum text-right text-slate-600">{formatMoney(row.expense, currency, { compact: true })}</td>
                    <td className={`fin-td tnum text-right font-semibold ${row.net >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                      {formatMoney(row.net, currency, { compact: true })}
                    </td>
                    <td className="fin-td tnum text-right text-slate-500">
                      {row.income > 0 ? `${percent(row.net, row.income)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Expense categories" subtitle="Share of spend in range" />
          <div className="space-y-3 px-5 py-4 sm:px-6">
            {expenseCategories.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-slate-400">No expenses in this range.</p>
            ) : (
              expenseCategories.map(([category, value]) => (
                <div key={category}>
                  <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
                    <span className="font-medium text-slate-700">{category}</span>
                    <span className="tnum text-slate-500">
                      {formatMoney(value, currency, { compact: true })} · {percent(value, totalExpenses)}%
                    </span>
                  </div>
                  <ProgressBar value={value} total={totalExpenses || 1} tone="rose" />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Income sources" subtitle="Where the money came from" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="fin-th">Category</th>
                  <th className="fin-th text-right">Amount</th>
                  <th className="fin-th text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomeCategories.length === 0 ? (
                  <tr>
                    <td className="fin-td text-slate-400" colSpan={3}>
                      No income in this range.
                    </td>
                  </tr>
                ) : (
                  incomeCategories.map(([category, value]) => (
                    <tr key={category}>
                      <td className="fin-td font-medium text-slate-800">{category}</td>
                      <td className="fin-td tnum text-right text-brand-700">{formatMoney(value, currency)}</td>
                      <td className="fin-td tnum text-right text-slate-500">{percent(value, totalIncome)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Committee report" subtitle="Lifetime collection and pending contributions" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="fin-th">Committee</th>
                  <th className="fin-th text-right">Collected in range</th>
                  <th className="fin-th text-right">Progress</th>
                  <th className="fin-th text-right">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {committeeReports.length === 0 ? (
                  <tr>
                    <td className="fin-td text-slate-400" colSpan={4}>
                      No committees yet.
                    </td>
                  </tr>
                ) : (
                  committeeReports.map(({ committee, summary, collectedInPeriod }) => (
                    <tr key={committee.id}>
                      <td className="fin-td">
                        <p className="font-medium text-slate-800">{committee.name}</p>
                        <Badge tone={committee.status === "ACTIVE" ? "green" : "slate"}>{committee.status.toLowerCase()}</Badge>
                      </td>
                      <td className="fin-td tnum text-right text-slate-700">{formatMoney(collectedInPeriod, currency)}</td>
                      <td className="fin-td tnum text-right text-slate-500">{summary.progress}%</td>
                      <td className="fin-td tnum text-right font-medium text-amber-600">{summary.pendingCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
