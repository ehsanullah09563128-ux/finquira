"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { committeeMembers, committeePayments, committees } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action";
import { requireUser } from "@/lib/auth";
import { addMonths } from "@/lib/format";
import { committeeSchema, fieldErrors, memberSchema } from "@/lib/validation";

function dateFromISO(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function ownedCommittee(committeeId: string, userId: string) {
  const [committee] = await db
    .select()
    .from(committees)
    .where(and(eq(committees.id, committeeId), eq(committees.userId, userId)))
    .limit(1);
  return committee ?? null;
}

function revalidateCommittee(id?: string) {
  revalidatePath("/committees");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  if (id) revalidatePath(`/committees/${id}`);
}

export async function saveCommittee(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const parsed = committeeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    totalMembers: formData.get("totalMembers"),
    monthlyContribution: formData.get("monthlyContribution"),
    durationMonths: formData.get("durationMonths"),
    startDate: formData.get("startDate"),
    status: formData.get("status") ?? "ACTIVE",
  });

  if (!parsed.success) {
    return actionError("Please check the committee details.", fieldErrors(parsed.error));
  }

  const data = parsed.data;
  const totalAmount = (Number.parseFloat(data.monthlyContribution) * Number(data.totalMembers)).toFixed(2);
  const endDate = isoDate(addMonths(dateFromISO(data.startDate), Number(data.durationMonths)));
  const values = { ...data, totalAmount, endDate };

  try {
    if (id) {
      const existing = await ownedCommittee(id, user.id);
      if (!existing) return actionError("Committee not found.");
      await db
        .update(committees)
        .set(values)
        .where(and(eq(committees.id, id), eq(committees.userId, user.id)));
      // keep generated payment amounts in sync with the contribution
      await db
        .update(committeePayments)
        .set({ amount: data.monthlyContribution })
        .where(and(eq(committeePayments.committeeId, id), eq(committeePayments.status, "PENDING")));
      revalidateCommittee(id);
      return { ...actionOk("Committee updated."), id };
    }

    const [created] = await db
      .insert(committees)
      .values({ ...values, userId: user.id })
      .returning({ id: committees.id });
    revalidateCommittee(created.id);
    return { ...actionOk("Committee created."), id: created.id };
  } catch (error) {
    console.error("saveCommittee failed", error);
    return actionError("Could not save this committee.");
  }
}

export async function deleteCommittee(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await db.delete(committees).where(and(eq(committees.id, id), eq(committees.userId, user.id)));
  } catch (error) {
    console.error("deleteCommittee failed", error);
    return actionError("Could not delete this committee.");
  }
  revalidateCommittee(id);
  return actionOk("Committee deleted.");
}

export async function saveMember(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const committeeId = String(formData.get("committeeId") ?? "");
  const committee = await ownedCommittee(committeeId, user.id);
  if (!committee) return actionError("Committee not found.");

  const parsed = memberSchema.safeParse({
    memberName: formData.get("memberName"),
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    position: formData.get("position"),
  });

  if (!parsed.success) {
    return actionError("Please check the member details.", fieldErrors(parsed.error));
  }

  try {
    const [member] = await db
      .insert(committeeMembers)
      .values({ ...parsed.data, committeeId })
      .returning({ id: committeeMembers.id });

    const months = Array.from({ length: committee.durationMonths }, (_, index) => index + 1);
    await db
      .insert(committeePayments)
      .values(
        months.map((month) => ({
          committeeId,
          memberId: member.id,
          month,
          amount: committee.monthlyContribution,
          status: "PENDING" as const,
        })),
      )
      .onConflictDoNothing();

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(committeeMembers)
      .where(eq(committeeMembers.committeeId, committeeId));
    await db.update(committees).set({ totalMembers: count }).where(eq(committees.id, committeeId));
  } catch (error) {
    console.error("saveMember failed", error);
    return actionError("Could not add this member. That position may already be taken.");
  }

  revalidateCommittee(committeeId);
  return actionOk("Member added and payment schedule created.");
}

export async function deleteMember(committeeId: string, memberId: string): Promise<ActionResult> {
  const user = await requireUser();
  const committee = await ownedCommittee(committeeId, user.id);
  if (!committee) return actionError("Committee not found.");
  try {
    await db
      .delete(committeeMembers)
      .where(and(eq(committeeMembers.id, memberId), eq(committeeMembers.committeeId, committeeId)));
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(committeeMembers)
      .where(eq(committeeMembers.committeeId, committeeId));
    await db.update(committees).set({ totalMembers: count }).where(eq(committees.id, committeeId));
  } catch (error) {
    console.error("deleteMember failed", error);
    return actionError("Could not remove this member.");
  }
  revalidateCommittee(committeeId);
  return actionOk("Member removed.");
}

export async function toggleCommitteePayment(paymentId: string, paid: boolean): Promise<ActionResult> {
  const user = await requireUser();
  const [row] = await db
    .select({ committeeId: committeePayments.committeeId, userId: committees.userId })
    .from(committeePayments)
    .innerJoin(committees, eq(committeePayments.committeeId, committees.id))
    .where(eq(committeePayments.id, paymentId))
    .limit(1);

  if (!row || row.userId !== user.id) return actionError("Payment not found.");

  try {
    await db
      .update(committeePayments)
      .set({
        status: paid ? "PAID" : "PENDING",
        paymentDate: paid ? isoDate(new Date()) : null,
      })
      .where(eq(committeePayments.id, paymentId));
  } catch (error) {
    console.error("toggleCommitteePayment failed", error);
    return actionError("Could not update this payment.");
  }
  revalidateCommittee(row.committeeId);
  return actionOk(paid ? "Contribution marked as paid." : "Contribution set back to pending.");
}

export async function markMonthPaid(committeeId: string, month: number): Promise<ActionResult> {
  const user = await requireUser();
  const committee = await ownedCommittee(committeeId, user.id);
  if (!committee) return actionError("Committee not found.");
  try {
    await db
      .update(committeePayments)
      .set({ status: "PAID", paymentDate: isoDate(new Date()) })
      .where(and(eq(committeePayments.committeeId, committeeId), eq(committeePayments.month, month)));
  } catch (error) {
    console.error("markMonthPaid failed", error);
    return actionError("Could not update this month.");
  }
  revalidateCommittee(committeeId);
  return actionOk(`Month ${month} contributions marked as paid.`);
}

export async function markMemberReceived(committeeId: string, memberId: string): Promise<ActionResult> {
  const user = await requireUser();
  const committee = await ownedCommittee(committeeId, user.id);
  if (!committee) return actionError("Committee not found.");
  try {
    await db
      .update(committeeMembers)
      .set({ receivedAmount: committee.totalAmount, receivedDate: isoDate(new Date()) })
      .where(and(eq(committeeMembers.id, memberId), eq(committeeMembers.committeeId, committeeId)));
  } catch (error) {
    console.error("markMemberReceived failed", error);
    return actionError("Could not record this payout.");
  }
  revalidateCommittee(committeeId);
  return actionOk("Payout recorded for this member.");
}
