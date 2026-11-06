import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: emailSchema,
  password: passwordSchema,
  currency: z.string().trim().min(3).max(3).default("USD"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date");

const money = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === "number" ? value : Number.parseFloat(value.replace(/,/g, ""))))
  .refine((value) => Number.isFinite(value), "Enter a valid amount")
  .refine((value) => value > 0, "Amount must be greater than zero")
  .refine((value) => value <= 1_000_000_000, "Amount is too large")
  .transform((value) => value.toFixed(2));

const optionalMoney = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((value) => {
    if (value === undefined || value === null || value === "") return "0.00";
    const parsed = typeof value === "number" ? value : Number.parseFloat(String(value).replace(/,/g, ""));
    return Number.isFinite(parsed) ? Math.max(0, parsed).toFixed(2) : "0.00";
  });

export const incomeSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(120),
  amount: money,
  category: z.string().trim().min(1, "Category is required"),
  source: z.string().trim().max(120).optional().default(""),
  date: isoDate,
  notes: z.string().trim().max(600).optional().default(""),
});

export const expenseSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(120),
  amount: money,
  category: z.string().trim().min(1, "Category is required"),
  date: isoDate,
  paymentMethod: z.string().trim().min(1, "Payment method is required"),
  notes: z.string().trim().max(600).optional().default(""),
});

export const committeeSchema = z
  .object({
    name: z.string().trim().min(2, "Committee name is required").max(120),
    description: z.string().trim().max(600).optional().default(""),
    totalMembers: z.coerce.number().int().min(2, "At least 2 members").max(200),
    monthlyContribution: money,
    durationMonths: z.coerce.number().int().min(1, "Duration must be at least 1 month").max(120),
    startDate: isoDate,
    status: z.enum(["ACTIVE", "COMPLETED", "PAUSED"]).default("ACTIVE"),
  });

export const memberSchema = z.object({
  memberName: z.string().trim().min(2, "Member name is required").max(120),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.union([z.string().trim().email("Enter a valid email"), z.literal("")]).optional().default(""),
  position: z.coerce.number().int().min(1).max(200),
});

export const loanSchema = z.object({
  type: z.enum(["GIVEN", "TAKEN"]),
  personName: z.string().trim().min(2, "Person name is required").max(120),
  contactNumber: z.string().trim().max(40).optional().default(""),
  amount: money,
  interestRate: optionalMoney,
  startDate: isoDate,
  dueDate: isoDate,
  status: z.enum(["ACTIVE", "CLOSED"]).default("ACTIVE"),
  notes: z.string().trim().max(600).optional().default(""),
});

export const repaymentSchema = z.object({
  amount: money,
  paymentDate: isoDate,
  notes: z.string().trim().max(300).optional().default(""),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  currency: z.string().trim().min(3).max(3),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type FieldErrors = Record<string, string>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
