# Finquira — Personal Finance OS

Finquira is a full-stack personal finance workspace for **income, expenses, saving committees (BC) and loans**. It ships with email/password authentication, per-user data isolation, interactive charts, CSV reports and a responsive dashboard.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions) |
| UI | React 19, Tailwind CSS v4, Lucide icons, hand-built SVG/CSS charts |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Email + password, `bcryptjs` hashing, signed HS256 JWT session cookie (`jose`) |

## Features

- **Dashboard** — total income, total expenses, balance, loans given/taken, active committees, upcoming payments, monthly income vs expense chart, expense category donut, loan repayment progress, committee collection progress.
- **Income** — create/edit/delete, search, category + date filters, totals and averages.
- **Expenses** — create/edit/delete, search, category + date filters, monthly category summary, payment methods.
- **Committees** — create committees, add members with payout positions, auto-generated monthly payment schedules, contribution matrix (tap a cell to mark paid/pending), payout recording, current receiver, remaining months, progress.
- **Loans** — money `GIVEN` or `TAKEN`, repayment history, live remaining balance, overdue detection, settlement.
- **Reports** — date-range filtering, monthly breakdown, category breakdowns, loan and committee reports, CSV export per report.
- **Settings** — profile, currency, password change, data export, delete-all-data danger zone.

## Local development

```bash
npm install
cp .env.example .env      # set DATABASE_URL and AUTH_SECRET
npx drizzle-kit push      # create tables from src/db/schema.ts
npm run dev
```

Then open `http://localhost:3000`, register an account, or use the demo workspace button on the login page (`demo@finquira.app` / `finquira123`).

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string (Neon, Supabase, local …) |
| `AUTH_SECRET` | recommended | Random 32+ char secret used to sign session JWTs. Falls back to a dev secret if absent. |

## Deploying to Vercel + Neon

1. Create a Neon Postgres database and copy the pooled connection string.
2. Import this repository into Vercel, add `DATABASE_URL` and `AUTH_SECRET` in Project → Settings → Environment Variables.
3. Run `npx drizzle-kit push` once against the Neon database (or generate SQL migrations with `npx drizzle-kit generate`).
4. Deploy. Route protection uses the server-side layout guard, so no middleware configuration is needed.

## Data model

`users` → `income`, `expenses`, `committees`, `loans`
`committees` → `committee_members` → `committee_payments`
`loans` → `loan_payments`

All financial tables carry a `user_id` foreign key with `ON DELETE CASCADE`; every query and mutation is scoped to the signed-in user. Indexes cover user lookups, date filtering, categories, due dates and payment schedules. Money is stored as `numeric(14,2)`.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm start          # production server
npm run typecheck  # TypeScript
npm run lint       # ESLint
```
