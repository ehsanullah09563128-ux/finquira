import { CalendarDays, Layers, TrendingUp, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { income } from "@/db/schema";
import { IncomeManager, type IncomeRow } from "@/components/modules/income-manager";
import { PageHeader, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatMoney, monthKey, recentMonthKeys, toNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Income" };

export default async function IncomePage() {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(income)
    .where(eq(income.userId, user.id))
    .orderBy(desc(income.date), desc(income.createdAt));

  const total = rows.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const keys = recentMonthKeys(2);
  const thisMonth = rows
    .filter((row) => row.date.startsWith(keys[1]))
    .reduce((sum, row) => sum + toNumber(row.amount), 0);
  const lastMonth = rows
    .filter((row) => row.date.startsWith(keys[0]))
    .reduce((sum, row) => sum + toNumber(row.amount), 0);

  const monthTotals = new Map<string, number>();
  for (const row of rows) {
    const key = monthKey(row.date);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + toNumber(row.amount));
  }
  const activeMonths = [...monthTotals.values()].filter((value) => value > 0);
  const average = activeMonths.length > 0 ? activeMonths.reduce((a, b) => a + b, 0) / activeMonths.length : 0;

  const categoryTotals = new Map<string, number>();
  for (const row of rows) {
    categoryTotals.set(row.category, (categoryTotals.get(row.category) ?? 0) + toNumber(row.amount));
  }
  const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  const managerRows: IncomeRow[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    amount: row.amount,
    category: row.category,
    source: row.source,
    date: row.date,
    notes: row.notes,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Income"
        description="Every stream of money coming in — salary, freelance work, business and investments. Search, filter and keep the history tidy."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total recorded income" value={formatMoney(total, user.currency)} icon={Wallet} tone="positive" helper={`${rows.length} entries`} />
        <StatCard label="This month" value={formatMoney(thisMonth, user.currency)} icon={CalendarDays} tone="brand" helper={lastMonth > 0 ? `Last month ${formatMoney(lastMonth, user.currency, { compact: true })}` : "No prior month data"} />
        <StatCard label="Average per month" value={formatMoney(average, user.currency)} icon={TrendingUp} tone="neutral" helper={`${activeMonths.length} active months`} />
        <StatCard
          label="Top category"
          value={topCategory ? topCategory[0] : "—"}
          icon={Layers}
          tone="brand"
          helper={topCategory ? formatMoney(topCategory[1], user.currency) : "Add income to see this"}
        />
      </div>

      <IncomeManager rows={managerRows} currency={user.currency} />
    </div>
  );
}
