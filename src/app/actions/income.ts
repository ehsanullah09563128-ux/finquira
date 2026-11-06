"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { income } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action";
import { requireUser } from "@/lib/auth";
import { fieldErrors, incomeSchema } from "@/lib/validation";

export async function saveIncome(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const parsed = incomeSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    source: formData.get("source") ?? "",
    date: formData.get("date"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return actionError("Please check the income details.", fieldErrors(parsed.error));
  }

  try {
    if (id) {
      await db
        .update(income)
        .set(parsed.data)
        .where(and(eq(income.id, id), eq(income.userId, user.id)));
    } else {
      await db.insert(income).values({ ...parsed.data, userId: user.id });
    }
  } catch (error) {
    console.error("saveIncome failed", error);
    return actionError("Could not save this income entry.");
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return actionOk(id ? "Income updated." : "Income added.");
}

export async function deleteIncome(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await db.delete(income).where(and(eq(income.id, id), eq(income.userId, user.id)));
  } catch (error) {
    console.error("deleteIncome failed", error);
    return actionError("Could not delete this income entry.");
  }
  revalidatePath("/income");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return actionOk("Income deleted.");
}
