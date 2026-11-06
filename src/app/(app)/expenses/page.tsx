import { CalendarDays, Layers, Receipt, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { ExpenseManager, type ExpenseRow } from "@/components/modules/expense-manager";
import { Card, CardHeader, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatMoney, monthLabel, monthKey, percent, recentMonthKeys, toNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(expenses)
    .where(eq(expenses.userId, user.id))
    .orderBy(desc(expenses.date), desc(expenses.createdAt));

  const total = rows.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const keys = recentMonthKeys(2);
  const thisMonthRows = rows.filter((row) => row.date.startsWith(keys[1]));
  const lastMonthRows = rows.filter((row) => row.date.startsWith(keys[0]));
  const thisMonth = thisMonthRows.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const lastMonth = lastMonthRows.reduce((sum, row) => sum + toNumber(row.amount), 0);

  const monthTotals = new Map<string, number>();
  for (const row of rows) {
    const key = monthKey(row.date);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + toNumber(row.amount));
  }
  const activeMonths = [...monthTotals.values()].filter((value) => value > 0);
  const average = activeMonths.length > 0 ? activeMonths.reduce((a, b) => a + b, 0) / activeMonths.length : 0;

  const categoryTotals = new Map<string, number>();
  for (const row of thisMonthRows) {
    categoryTotals.set(row.category, (categoryTotals.get(row.category) ?? 0) + toNumber(row.amount));
  }
  const categoryRows = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);

  const managerRows: ExpenseRow[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    amount: row.amount,
    category: row.category,
    date: row.date,
    paymentMethod: row.paymentMethod,
    notes: row.notes,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expenses"
        description="Know exactly where your money goes. Filter by category or date range and keep the monthly summary honest."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total recorded spend" value={formatMoney(total, user.currency)} icon={Wallet} tone="negative" helper={`${rows.length} entries`} />
        <StatCard label={`${monthLabel(keys[1])} spend`} value={formatMoney(thisMonth, user.currency)} icon={CalendarDays} tone="warning" helper={lastMonth > 0 ? `Last month ${formatMoney(lastMonth, user.currency, { compact: true })}` : "No prior month data"} />
        <StatCard label="Average per month" value={formatMoney(average, user.currency)} icon={Receipt} tone="neutral" helper={`${activeMonths.length} active months`} />
        <StatCard
          label="Top category this month"
          value={categoryRows[0] ? categoryRows[0][0] : "—"}
          icon={Layers}
          tone="brand"
          helper={categoryRows[0] ? formatMoney(categoryRows[0][1], user.currency) : "No spend this month"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <ExpenseManager rows={managerRows} currency={user.currency} />

        <Card className="h-fit">
          <CardHeader title="Monthly summary" subtitle={`${monthLabel(keys[1])} by category`} />
          <div className="space-y-3.5 px-5 py-4 sm:px-6">
            {categoryRows.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-slate-400">No expenses recorded this month.</p>
            ) : (
              categoryRows.map(([category, value]) => (
                <div key={category}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-[12.5px]">
                    <span className="font-medium text-slate-700">{category}</span>
                    <span className="tnum text-slate-500">
                      {formatMoney(value, user.currency, { compact: true })} · {percent(value, thisMonth)}%
                    </span>
                  </div>
                  <ProgressBar value={value} total={thisMonth} tone="rose" />
                </div>
              ))
            )}
            {categoryRows.length > 0 ? (
              <div className="flex items-baseline justify-between border-t border-slate-100 pt-3 text-[13px]">
                <span className="font-medium text-slate-600">Total this month</span>
                <span className="tnum font-semibold text-slate-900">{formatMoney(thisMonth, user.currency)}</span>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
