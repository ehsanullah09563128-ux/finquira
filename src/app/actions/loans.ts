"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { loanPayments, loans } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action";
import { requireUser } from "@/lib/auth";
import { fieldErrors, loanSchema, repaymentSchema } from "@/lib/validation";

function revalidateLoans() {
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function saveLoan(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const parsed = loanSchema.safeParse({
    type: formData.get("type"),
    personName: formData.get("personName"),
    contactNumber: formData.get("contactNumber") ?? "",
    amount: formData.get("amount"),
    interestRate: formData.get("interestRate") ?? "0",
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
    status: formData.get("status") ?? "ACTIVE",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return actionError("Please check the loan details.", fieldErrors(parsed.error));
  }

  const data = parsed.data;
  if (data.dueDate < data.startDate) {
    return actionError("Due date must be after the start date.", { dueDate: "Due date must be after the start date" });
  }

  try {
    if (id) {
      const [existing] = await db
        .select()
        .from(loans)
        .where(and(eq(loans.id, id), eq(loans.userId, user.id)))
        .limit(1);
      if (!existing) return actionError("Loan not found.");

      const [{ paid }] = await db
        .select({ paid: sql<string>`coalesce(sum(${loanPayments.amount}), 0)::text` })
        .from(loanPayments)
        .where(eq(loanPayments.loanId, id));

      const remaining = Math.max(0, Number.parseFloat(data.amount) - Number.parseFloat(paid));
      await db
        .update(loans)
        .set({
          ...data,
          remainingAmount: remaining.toFixed(2),
          status: remaining <= 0 ? "CLOSED" : data.status,
        })
        .where(and(eq(loans.id, id), eq(loans.userId, user.id)));
    } else {
      await db.insert(loans).values({
        ...data,
        userId: user.id,
        remainingAmount: data.amount,
        status: data.status === "CLOSED" ? "CLOSED" : "ACTIVE",
      });
    }
  } catch (error) {
    console.error("saveLoan failed", error);
    return actionError("Could not save this loan.");
  }

  revalidateLoans();
  return actionOk(id ? "Loan updated." : "Loan added.");
}

export async function deleteLoan(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await db.delete(loans).where(and(eq(loans.id, id), eq(loans.userId, user.id)));
  } catch (error) {
    console.error("deleteLoan failed", error);
    return actionError("Could not delete this loan.");
  }
  revalidateLoans();
  return actionOk("Loan deleted.");
}

export async function recordRepayment(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const loanId = String(formData.get("loanId") ?? "");

  const parsed = repaymentSchema.safeParse({
    amount: formData.get("amount"),
    paymentDate: formData.get("paymentDate"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return actionError("Please check the repayment details.", fieldErrors(parsed.error));
  }

  try {
    const [loan] = await db
      .select()
      .from(loans)
      .where(and(eq(loans.id, loanId), eq(loans.userId, user.id)))
      .limit(1);
    if (!loan) return actionError("Loan not found.");

    const remaining = Number.parseFloat(loan.remainingAmount);
    const amount = Number.parseFloat(parsed.data.amount);
    if (amount > remaining + 0.001) {
      return actionError("Repayment is larger than the remaining balance.", {
        amount: "Repayment exceeds remaining balance",
      });
    }

    await db.insert(loanPayments).values({ ...parsed.data, loanId });
    const nextRemaining = Math.max(0, remaining - amount);
    await db
      .update(loans)
      .set({
        remainingAmount: nextRemaining.toFixed(2),
        status: nextRemaining <= 0 ? "CLOSED" : "ACTIVE",
      })
      .where(and(eq(loans.id, loanId), eq(loans.userId, user.id)));
  } catch (error) {
    console.error("recordRepayment failed", error);
    return actionError("Could not record this repayment.");
  }

  revalidateLoans();
  return actionOk("Repayment recorded.");
}
