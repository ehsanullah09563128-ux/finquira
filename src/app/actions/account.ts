"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { committees, expenses, income, loans, users } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { changePasswordSchema, fieldErrors, profileSchema } from "@/lib/validation";

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return actionError("Please check your profile details.", fieldErrors(parsed.error));
  }

  try {
    await db.update(users).set(parsed.data).where(eq(users.id, user.id));
  } catch (error) {
    console.error("updateProfile failed", error);
    return actionError("Could not update your profile.");
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return actionOk("Profile updated.");
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return actionError("Please check the password fields.", fieldErrors(parsed.error));
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return actionError("Current password is incorrect.", { currentPassword: "Incorrect password" });
  }

  try {
    const passwordHash = await hashPassword(parsed.data.newPassword);
    await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
  } catch (error) {
    console.error("changePassword failed", error);
    return actionError("Could not update your password.");
  }

  return actionOk("Password updated.");
}

export async function resetFinancialData(): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await db.delete(loans).where(eq(loans.userId, user.id));
    await db.delete(committees).where(eq(committees.userId, user.id));
    await db.delete(expenses).where(eq(expenses.userId, user.id));
    await db.delete(income).where(eq(income.userId, user.id));
  } catch (error) {
    console.error("resetFinancialData failed", error);
    return actionError("Could not clear your data. Please try again.");
  }
  revalidatePath("/dashboard");
  revalidatePath("/income");
  revalidatePath("/expenses");
  revalidatePath("/committees");
  revalidatePath("/loans");
  revalidatePath("/reports");
  return actionOk("All financial records were removed.");
}
