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
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants";

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function monthsAgo(months: number, day = 1): Date {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - months, day);
  return date;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

const expensePlan: Array<[string, string, number, string, number]> = [
  ["Monthly rent", "Bills", 1450, "Bank Transfer", 1],
  ["Groceries — weekly shop", "Food", 176.4, "Card", 3],
  ["Fuel & tolls", "Transport", 92.25, "Card", 6],
  ["Electricity bill", "Bills", 118.7, "Bank Transfer", 8],
  ["Dinner with family", "Food", 64.8, "Card", 11],
  ["Gym membership", "Healthcare", 45, "Card", 12],
  ["Online course — analytics", "Education", 129, "Card", 15],
  ["Weekend cinema", "Entertainment", 38.5, "Cash", 18],
  ["Winter jacket", "Shopping", 142.9, "Card", 21],
  ["Pharmacy", "Healthcare", 27.35, "Cash", 24],
  ["Mobile & internet", "Bills", 76.2, "Mobile Wallet", 26],
  ["Ride shares", "Transport", 58.1, "Card", 28],
];

const incomePlan: Array<[string, string, number, string, string, number]> = [
  ["Monthly salary", "Salary", 6400, "Employer", "Employer payroll", 1],
  ["Freelance — dashboard build", "Freelance", 1250, "Client", "Studio Nord", 12],
  ["Dividend payout", "Investment", 186.45, "Broker", "Index fund", 17],
];

/**
 * Creates the shared demo workspace (idempotent) and returns its user id.
 * Sample data exists only for the demo account — real signups start empty.
 */
export async function ensureDemoData(): Promise<string> {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);

  let userId = existing?.id;
  if (!userId) {
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    await db
      .insert(users)
      .values({ name: "Avery Sinclair", email: DEMO_EMAIL, passwordHash, currency: "USD" })
      .onConflictDoNothing();
    const [created] = await db.select({ id: users.id }).from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
    if (!created) throw new Error("Could not create demo workspace");
    userId = created.id;
  }

  const [alreadySeeded] = await db
    .select({ id: income.id })
    .from(income)
    .where(eq(income.userId, userId))
    .limit(1);
  if (alreadySeeded) return userId;

  // ---------------------------------------------------------------- income
  const incomeRows: (typeof income.$inferInsert)[] = [];
  for (let m = 5; m >= 0; m -= 1) {
    for (const [title, category, base, source, notes, day] of incomePlan) {
      const factor = title.startsWith("Freelance") ? 1 + ((5 - m) % 3) * 0.25 : 1;
      incomeRows.push({
        userId,
        title,
        amount: (Math.round(base * factor * 100) / 100).toFixed(2),
        category,
        source,
        notes,
        date: iso(monthsAgo(m, Math.min(day, 28))),
      });
    }
  }
  incomeRows.push({
    userId,
    title: "Birthday gift",
    amount: "300.00",
    category: "Gift",
    source: "Family",
    notes: "From mum and dad",
    date: iso(monthsAgo(1, 22)),
  });
  await db.insert(income).values(incomeRows);

  // -------------------------------------------------------------- expenses
  const expenseRows: (typeof expenses.$inferInsert)[] = [];
  for (let m = 5; m >= 0; m -= 1) {
    expensePlan.forEach(([title, category, base, method, day], index) => {
      const variance = 1 + (((m + index) % 4) - 1.5) * 0.08;
      expenseRows.push({
        userId,
        title,
        amount: (Math.round(base * variance * 100) / 100).toFixed(2),
        category,
        paymentMethod: method,
        notes: "",
        date: iso(monthsAgo(m, Math.min(day, 28))),
      });
    });
  }
  await db.insert(expenses).values(expenseRows);

  // ------------------------------------------------------------ committees
  const [familyCircle] = await db
    .insert(committees)
    .values({
      userId,
      name: "Family Savings Circle",
      description: "Monthly family BC with eight cousins. Payout rotates by position.",
      totalMembers: 8,
      monthlyContribution: "250.00",
      durationMonths: 8,
      totalAmount: "2000.00",
      startDate: iso(monthsAgo(4, 5)),
      endDate: iso(monthsAgo(-3, 5)),
      status: "ACTIVE",
    })
    .returning({ id: committees.id });

  const [officePool] = await db
    .insert(committees)
    .values({
      userId,
      name: "Office Saving Pool",
      description: "Six colleagues, smaller monthly contribution, ends this year.",
      totalMembers: 6,
      monthlyContribution: "150.00",
      durationMonths: 6,
      totalAmount: "900.00",
      startDate: iso(monthsAgo(2, 10)),
      endDate: iso(monthsAgo(-3, 10)),
      status: "ACTIVE",
    })
    .returning({ id: committees.id });

  const familyNames = [
    "Avery Sinclair",
    "Marcus Sinclair",
    "Nadia Rahman",
    "Tomas Alvarez",
    "Grace Okafor",
    "Liam Byrne",
    "Sofia Ricci",
    "Daniel Reyes",
  ];
  const officeNames = ["Avery Sinclair", "Priya Nair", "Ethan Cho", "Hana Suzuki", "Omar Haddad", "Clara Mendes"];

  const familyMembers = await db
    .insert(committeeMembers)
    .values(
      familyNames.map((memberName, index) => ({
        committeeId: familyCircle.id,
        memberName,
        phone: `+1 555 01${String(10 + index)}`,
        email: `${memberName.split(" ")[0].toLowerCase()}@example.com`,
        position: index + 1,
        receivedAmount: index < 3 ? "2000.00" : "0",
        receivedDate: index < 3 ? iso(monthsAgo(4 - index, 6)) : null,
      })),
    )
    .returning({ id: committeeMembers.id, position: committeeMembers.position });

  const officeMembers = await db
    .insert(committeeMembers)
    .values(
      officeNames.map((memberName, index) => ({
        committeeId: officePool.id,
        memberName,
        phone: `+1 555 02${String(20 + index)}`,
        email: `${memberName.split(" ")[0].toLowerCase()}@work.example.com`,
        position: index + 1,
        receivedAmount: index === 0 ? "900.00" : "0",
        receivedDate: index === 0 ? iso(monthsAgo(2, 12)) : null,
      })),
    )
    .returning({ id: committeeMembers.id, position: committeeMembers.position });

  const paymentRows: (typeof committeePayments.$inferInsert)[] = [];
  for (const member of familyMembers) {
    for (let month = 1; month <= 4; month += 1) {
      const pending = month === 4 && member.position > 5;
      paymentRows.push({
        committeeId: familyCircle.id,
        memberId: member.id,
        month,
        amount: "250.00",
        status: pending ? "PENDING" : "PAID",
        paymentDate: pending ? null : iso(monthsAgo(4 - month, 7)),
      });
    }
  }
  for (const member of officeMembers) {
    for (let month = 1; month <= 2; month += 1) {
      const pending = month === 2 && member.position === 6;
      paymentRows.push({
        committeeId: officePool.id,
        memberId: member.id,
        month,
        amount: "150.00",
        status: pending ? "PENDING" : "PAID",
        paymentDate: pending ? null : iso(monthsAgo(2 - month, 12)),
      });
    }
  }
  await db.insert(committeePayments).values(paymentRows);

  // ----------------------------------------------------------------- loans
  const loanRows = await db
    .insert(loans)
    .values([
      {
        userId,
        type: "GIVEN",
        personName: "Daniel Reyes",
        contactNumber: "+1 555 0114",
        amount: "2500.00",
        remainingAmount: "1500.00",
        interestRate: "0.00",
        startDate: iso(monthsAgo(3, 14)),
        dueDate: iso(daysFromNow(18)),
        status: "ACTIVE",
        notes: "Helped with a car deposit. Two instalments received so far.",
      },
      {
        userId,
        type: "GIVEN",
        personName: "Ayesha Khan",
        contactNumber: "+1 555 0166",
        amount: "800.00",
        remainingAmount: "0.00",
        interestRate: "0.00",
        startDate: iso(monthsAgo(6, 8)),
        dueDate: iso(monthsAgo(2, 8)),
        status: "CLOSED",
        notes: "Fully repaid ahead of schedule.",
      },
      {
        userId,
        type: "GIVEN",
        personName: "Tomas Alvarez",
        contactNumber: "+1 555 0171",
        amount: "600.00",
        remainingAmount: "600.00",
        interestRate: "2.00",
        startDate: iso(monthsAgo(1, 20)),
        dueDate: iso(daysFromNow(-6)),
        status: "ACTIVE",
        notes: "Overdue — follow up this week.",
      },
      {
        userId,
        type: "TAKEN",
        personName: "Westbank Auto Finance",
        contactNumber: "+1 800 555 0190",
        amount: "6000.00",
        remainingAmount: "3200.00",
        interestRate: "7.50",
        startDate: iso(monthsAgo(7, 2)),
        dueDate: iso(daysFromNow(240)),
        status: "ACTIVE",
        notes: "Car loan, monthly auto-debit.",
      },
      {
        userId,
        type: "TAKEN",
        personName: "Priya Nair",
        contactNumber: "+1 555 0182",
        amount: "500.00",
        remainingAmount: "200.00",
        interestRate: "0.00",
        startDate: iso(monthsAgo(2, 18)),
        dueDate: iso(daysFromNow(9)),
        status: "ACTIVE",
        notes: "Borrowed for a laptop repair.",
      },
    ])
    .returning({ id: loans.id, personName: loans.personName });

  const byPerson = new Map(loanRows.map((row) => [row.personName, row.id]));
  await db.insert(loanPayments).values([
    {
      loanId: byPerson.get("Daniel Reyes")!,
      amount: "500.00",
      paymentDate: iso(monthsAgo(2, 15)),
      notes: "First instalment",
    },
    {
      loanId: byPerson.get("Daniel Reyes")!,
      amount: "500.00",
      paymentDate: iso(monthsAgo(1, 15)),
      notes: "Second instalment",
    },
    {
      loanId: byPerson.get("Ayesha Khan")!,
      amount: "800.00",
      paymentDate: iso(monthsAgo(2, 4)),
      notes: "Settled in full",
    },
    {
      loanId: byPerson.get("Westbank Auto Finance")!,
      amount: "1400.00",
      paymentDate: iso(monthsAgo(3, 2)),
      notes: "Quarterly payment",
    },
    {
      loanId: byPerson.get("Westbank Auto Finance")!,
      amount: "1400.00",
      paymentDate: iso(monthsAgo(1, 2)),
      notes: "Quarterly payment",
    },
    {
      loanId: byPerson.get("Priya Nair")!,
      amount: "300.00",
      paymentDate: iso(monthsAgo(1, 20)),
      notes: "Partial repayment",
    },
  ]);

  return userId;
}
