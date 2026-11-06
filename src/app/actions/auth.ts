"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { fieldErrors, loginSchema, registerSchema, type FieldErrors } from "@/lib/validation";

export type AuthResult = { ok: boolean; message?: string; fieldErrors?: FieldErrors };

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    currency: formData.get("currency") || "USD",
  });

  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  const { name, email, password, currency } = parsed.data;

  try {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return { ok: false, message: "That email is already registered.", fieldErrors: { email: "Email already in use" } };
    }

    const passwordHash = await hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({ name, email, passwordHash, currency })
      .returning({ id: users.id });

    await createSession(created.id);
  } catch (error) {
    console.error("register failed", error);
    return { ok: false, message: "We couldn't create your account. Please try again." };
  }

  redirect("/dashboard");
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return { ok: false, message: "Incorrect email or password." };
    }

    await createSession(user.id);
  } catch (error) {
    console.error("login failed", error);
    return { ok: false, message: "Something went wrong signing you in. Please try again." };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}


