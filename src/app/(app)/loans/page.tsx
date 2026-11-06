import { ArrowDownLeft, ArrowUpRight, CalendarClock, HandCoins, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { loanPayments, loans } from "@/db/schema";
import { LoanManager, type LoanRow } from "@/components/modules/loan-manager";
import { PageHeader, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { daysUntil, formatMoney, todayISO, toNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Loans" };

export default async function LoansPage() {
  const user = await requireUser();

  const [loanRows, paymentRows] = await Promise.all([
    db.select().from(loans).where(eq(loans.userId, user.id)).orderBy(desc(loans.createdAt)),
    db
      .select({ payment: loanPayments })
      .from(loanPayments)
      .innerJoin(loans, eq(loanPayments.loanId, loans.id))
      .where(eq(loans.userId, user.id))
      .orderBy(desc(loanPayments.paymentDate)),
  ]);

  const given = loanRows.filter((loan) => loan.type === "GIVEN");
  const taken = loanRows.filter((loan) => loan.type === "TAKEN");
  const moneyGiven = given.reduce((sum, loan) => sum + toNumber(loan.amount), 0);
  const moneyTaken = taken.reduce((sum, loan) => sum + toNumber(loan.amount), 0);
  const receivable = given.reduce((sum, loan) => sum + toNumber(loan.remainingAmount), 0);
  const payable = taken.reduce((sum, loan) => sum + toNumber(loan.remainingAmount), 0);
  const receivedBack = moneyGiven - receivable;

  const overdue = loanRows.filter(
    (loan) => loan.status !== "CLOSED" && (daysUntil(loan.dueDate) ?? 0) < 0,
  );

  const managerRows: LoanRow[] = loanRows.map((loan) => {
    const payments = paymentRows
      .filter((row) => row.payment.loanId === loan.id)
      .map((row) => ({
        id: row.payment.id,
        amount: row.payment.amount,
        paymentDate: row.payment.paymentDate,
        notes: row.payment.notes,
      }));
    return {
      id: loan.id,
      type: loan.type,
      personName: loan.personName,
      contactNumber: loan.contactNumber,
      amount: loan.amount,
      remainingAmount: loan.remainingAmount,
      interestRate: loan.interestRate,
      startDate: loan.startDate,
      dueDate: loan.dueDate,
      status: loan.status,
      notes: loan.notes,
      paid: payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0),
      payments,
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Loans"
        description="Money you lent and money you borrowed — with repayment history, live balances and overdue reminders."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Money given" value={formatMoney(moneyGiven, user.currency)} icon={ArrowUpRight} tone="brand" helper={`${given.length} loans out`} />
        <StatCard label="Received back" value={formatMoney(receivedBack, user.currency)} icon={HandCoins} tone="positive" helper={`${formatMoney(receivable, user.currency)} outstanding`} />
        <StatCard label="Money borrowed" value={formatMoney(moneyTaken, user.currency)} icon={ArrowDownLeft} tone="warning" helper={`${taken.length} loans in`} />
        <StatCard
          label="Overdue"
          value={String(overdue.length)}
          icon={CalendarClock}
          tone={overdue.length > 0 ? "negative" : "neutral"}
          helper={`${formatMoney(payable, user.currency)} payable · today ${todayISO()}`}
        />
      </div>

      <LoanManager loans={managerRows} currency={user.currency} />
    </div>
  );
}

export const dynamic = "force-dynamic";
