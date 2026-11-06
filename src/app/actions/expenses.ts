"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action";
import { requireUser } from "@/lib/auth";
import { expenseSchema, fieldErrors } from "@/lib/validation";

export async function saveExpense(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const parsed = expenseSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    date: formData.get("date"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return actionError("Please check the expense details.", fieldErrors(parsed.error));
  }

  try {
    if (id) {
      await db
        .update(expenses)
        .set(parsed.data)
        .where(and(eq(expenses.id, id), eq(expenses.userId, user.id)));
    } else {
      await db.insert(expenses).values({ ...parsed.data, userId: user.id });
    }
  } catch (error) {
    console.error("saveExpense failed", error);
    return actionError("Could not save this expense.");
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return actionOk(id ? "Expense updated." : "Expense added.");
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, user.id)));
  } catch (error) {
    console.error("deleteExpense failed", error);
    return actionError("Could not delete this expense.");
  }
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return actionOk("Expense deleted.");
}
