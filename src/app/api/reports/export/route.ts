import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { committeeMembers, committeePayments, committees, expenses, income, loans } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { toNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

type Cell = string | number | null | undefined;

function csvValue(value: Cell): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows: Cell[][]): string {
  return rows.map((row) => row.map(csvValue).join(",")).join("\r\n");
}

function parseDate(value: string | null, fallback: string): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "income";
  const today = new Date().toISOString().slice(0, 10);
  const from = parseDate(url.searchParams.get("from"), "1970-01-01");
  const to = parseDate(url.searchParams.get("to"), today);

  let rows: Cell[][] = [];
  let filename = `finquira-${type}-${from}-to-${to}.csv`;

  try {
    if (type === "income") {
      const data = await db
        .select()
        .from(income)
        .where(and(eq(income.userId, user.id), gte(income.date, from), lte(income.date, to)))
        .orderBy(desc(income.date));
      rows = [
        ["Date", "Title", "Category", "Source", "Amount", "Notes"],
        ...data.map((row) => [row.date, row.title, row.category, row.source, toNumber(row.amount).toFixed(2), row.notes]),
        ["", "", "", "TOTAL", data.reduce((sum, row) => sum + toNumber(row.amount), 0).toFixed(2), ""],
      ];
    } else if (type === "expenses") {
      const data = await db
        .select()
        .from(expenses)
        .where(and(eq(expenses.userId, user.id), gte(expenses.date, from), lte(expenses.date, to)))
        .orderBy(desc(expenses.date));
      rows = [
        ["Date", "Title", "Category", "Payment method", "Amount", "Notes"],
        ...data.map((row) => [row.date, row.title, row.category, row.paymentMethod, toNumber(row.amount).toFixed(2), row.notes]),
        ["", "", "", "TOTAL", data.reduce((sum, row) => sum + toNumber(row.amount), 0).toFixed(2), ""],
      ];
    } else if (type === "loans") {
      const data = await db.select().from(loans).where(eq(loans.userId, user.id)).orderBy(desc(loans.startDate));
      rows = [
        ["Type", "Person", "Contact", "Principal", "Remaining", "Interest %", "Start", "Due", "Status", "Notes"],
        ...data.map((row) => [
          row.type,
          row.personName,
          row.contactNumber,
          toNumber(row.amount).toFixed(2),
          toNumber(row.remainingAmount).toFixed(2),
          toNumber(row.interestRate).toFixed(2),
          row.startDate,
          row.dueDate,
          row.status,
          row.notes,
        ]),
      ];
    } else if (type === "committees") {
      const data = await db
        .select({ committee: committees, member: committeeMembers, payment: committeePayments })
        .from(committees)
        .leftJoin(committeeMembers, eq(committeeMembers.committeeId, committees.id))
        .leftJoin(committeePayments, eq(committeePayments.memberId, committeeMembers.id))
        .where(eq(committees.userId, user.id))
        .orderBy(committees.name, committeeMembers.position, committeePayments.month);

      rows = [
        ["Committee", "Status", "Member", "Turn", "Month", "Amount", "Payment status", "Payment date"],
        ...data.map((row) => [
          row.committee.name,
          row.committee.status,
          row.member?.memberName ?? "",
          row.member?.position ?? "",
          row.payment?.month ?? "",
          row.payment ? toNumber(row.payment.amount).toFixed(2) : "",
          row.payment?.status ?? "",
          row.payment?.paymentDate ?? "",
        ]),
      ];
    } else {
      return Response.json({ error: "Unknown report type" }, { status: 400 });
    }
  } catch (error) {
    console.error("report export failed", error);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }

  filename = `finquira-${type}-${from}-to-${to}.csv`;

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
