import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ users */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    currency: text("currency").notNull().default("USD"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

/* ----------------------------------------------------------------- income */

export const income = pgTable(
  "income",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    category: text("category").notNull(),
    source: text("source").notNull().default(""),
    date: date("date", { mode: "string" }).notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("income_user_idx").on(table.userId),
    index("income_user_date_idx").on(table.userId, table.date),
    index("income_category_idx").on(table.category),
  ],
);

/* ---------------------------------------------------------------- expenses */

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    category: text("category").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    paymentMethod: text("payment_method").notNull().default("Cash"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("expenses_user_idx").on(table.userId),
    index("expenses_user_date_idx").on(table.userId, table.date),
    index("expenses_category_idx").on(table.category),
  ],
);

/* -------------------------------------------------------------- committees */

export const committees = pgTable(
  "committees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    totalMembers: integer("total_members").notNull().default(0),
    monthlyContribution: numeric("monthly_contribution", { precision: 14, scale: 2 }).notNull(),
    durationMonths: integer("duration_months").notNull(),
    totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    status: text("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("committees_user_idx").on(table.userId),
    index("committees_status_idx").on(table.userId, table.status),
  ],
);

export const committeeMembers = pgTable(
  "committee_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    committeeId: uuid("committee_id")
      .notNull()
      .references(() => committees.id, { onDelete: "cascade" }),
    memberName: text("member_name").notNull(),
    phone: text("phone").notNull().default(""),
    email: text("email").notNull().default(""),
    position: integer("position").notNull(),
    receivedAmount: numeric("received_amount", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    receivedDate: date("received_date", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("committee_members_committee_idx").on(table.committeeId),
    uniqueIndex("committee_members_position_unique").on(table.committeeId, table.position),
  ],
);

export const committeePayments = pgTable(
  "committee_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    committeeId: uuid("committee_id")
      .notNull()
      .references(() => committees.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => committeeMembers.id, { onDelete: "cascade" }),
    month: integer("month").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    status: text("status").notNull().default("PENDING"),
    paymentDate: date("payment_date", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("committee_payments_committee_idx").on(table.committeeId),
    index("committee_payments_member_idx").on(table.memberId),
    uniqueIndex("committee_payments_member_month_unique").on(table.memberId, table.month),
  ],
);

/* ------------------------------------------------------------------- loans */

export const loans = pgTable(
  "loans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // GIVEN | TAKEN
    personName: text("person_name").notNull(),
    contactNumber: text("contact_number").notNull().default(""),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    remainingAmount: numeric("remaining_amount", { precision: 14, scale: 2 }).notNull(),
    interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull().default("0"),
    startDate: date("start_date", { mode: "string" }).notNull(),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE | CLOSED
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("loans_user_idx").on(table.userId),
    index("loans_user_type_idx").on(table.userId, table.type),
    index("loans_due_idx").on(table.dueDate),
  ],
);

export const loanPayments = pgTable(
  "loan_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    loanId: uuid("loan_id")
      .notNull()
      .references(() => loans.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    paymentDate: date("payment_date", { mode: "string" }).notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("loan_payments_loan_idx").on(table.loanId)],
);

/* --------------------------------------------------------------- relations */

export const usersRelations = relations(users, ({ many }) => ({
  income: many(income),
  expenses: many(expenses),
  committees: many(committees),
  loans: many(loans),
}));

export const committeesRelations = relations(committees, ({ one, many }) => ({
  user: one(users, { fields: [committees.userId], references: [users.id] }),
  members: many(committeeMembers),
  payments: many(committeePayments),
}));

export const committeeMembersRelations = relations(committeeMembers, ({ one, many }) => ({
  committee: one(committees, {
    fields: [committeeMembers.committeeId],
    references: [committees.id],
  }),
  payments: many(committeePayments),
}));

export const committeePaymentsRelations = relations(committeePayments, ({ one }) => ({
  committee: one(committees, {
    fields: [committeePayments.committeeId],
    references: [committees.id],
  }),
  member: one(committeeMembers, {
    fields: [committeePayments.memberId],
    references: [committeeMembers.id],
  }),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  user: one(users, { fields: [loans.userId], references: [users.id] }),
  payments: many(loanPayments),
}));

export const loanPaymentsRelations = relations(loanPayments, ({ one }) => ({
  loan: one(loans, { fields: [loanPayments.loanId], references: [loans.id] }),
}));

/* ------------------------------------------------------------------- types */

export type User = typeof users.$inferSelect;
export type Income = typeof income.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Committee = typeof committees.$inferSelect;
export type CommitteeMember = typeof committeeMembers.$inferSelect;
export type CommitteePayment = typeof committeePayments.$inferSelect;
export type Loan = typeof loans.$inferSelect;
export type LoanPayment = typeof loanPayments.$inferSelect;
