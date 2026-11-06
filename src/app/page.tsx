import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  HandCoins,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

const modules = [
  {
    icon: TrendingUp,
    title: "Income",
    body: "Salary, freelance, business, investments — categorised and searchable in seconds.",
  },
  {
    icon: Receipt,
    title: "Expenses",
    body: "Every outflow with payment method and monthly category breakdowns that actually add up.",
  },
  {
    icon: Users,
    title: "Committees",
    body: "Run BC / saving circles: members, payout turns, monthly contribution matrix and pending tracking.",
  },
  {
    icon: HandCoins,
    title: "Loans",
    body: "Money given and money taken, with repayment history, remaining balance and overdue alerts.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-ink-950 text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 -top-40 size-[34rem] rounded-full bg-brand-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 top-24 size-[28rem] rounded-full bg-emerald-400/10 blur-[110px]" />

        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <div>
              <p className="text-[15px] font-semibold tracking-tight">{APP_NAME}</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">Finance OS</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="fin-btn-primary">
                Open dashboard <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  Sign in
                </Link>
                <Link href="/register" className="fin-btn-primary">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </header>

        <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-200">
              <ShieldCheck className="size-3.5" /> Private by default
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              Every rupee, pound and dollar.
              <span className="block bg-linear-to-r from-brand-300 to-emerald-200 bg-clip-text text-transparent">
                One calm picture.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/60">{APP_DESCRIPTION}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={user ? "/dashboard" : "/register"} className="fin-btn-primary px-5 py-3">
                {user ? "Go to dashboard" : "Create your free account"} <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Explore the demo workspace
              </Link>
            </div>
            <ul className="mt-8 grid gap-2.5 text-[13px] text-white/60 sm:grid-cols-2">
              {[
                "Email & password auth, hashed",
                "Income, expenses, committees, loans",
                "Monthly charts & CSV exports",
                "Responsive on any device",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-brand-300" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur">
              <div className="rounded-xl bg-[#0b1a16] p-4 ring-1 ring-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-white/40">Net worth snapshot</p>
                    <p className="tnum mt-1 text-2xl font-semibold">$24,860.00</p>
                  </div>
                  <span className="rounded-full bg-brand-400/15 px-2.5 py-1 text-[11px] font-semibold text-brand-200">
                    +8.2% MoM
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Income", value: "$7,836", tone: "text-brand-300" },
                    { label: "Expenses", value: "$2,964", tone: "text-rose-300" },
                    { label: "Loans out", value: "$2,100", tone: "text-white" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-white/[0.04] px-2.5 py-2">
                      <p className="text-[9.5px] uppercase tracking-wide text-white/35">{item.label}</p>
                      <p className={`tnum text-xs font-semibold ${item.tone}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex h-28 items-end gap-2">
                  {[42, 58, 50, 72, 64, 88].map((height, index) => (
                    <div key={index} className="flex flex-1 items-end gap-1">
                      <span className="w-1/2 rounded-t bg-brand-400/80" style={{ height: `${height}%` }} />
                      <span className="w-1/2 rounded-t bg-rose-400/50" style={{ height: `${height * 0.45}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-[9px] uppercase tracking-wide text-white/30">
                  {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((month) => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/50">Family Savings Circle · Month 4 of 8</span>
                    <span className="tnum text-brand-200">62% collected</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[62%] rounded-full bg-linear-to-r from-brand-400 to-emerald-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="border-t border-white/5 bg-[#f5f7f6] py-16 text-slate-900 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">Four modules, one ledger</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Built for the way money actually moves
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
              Most finance apps stop at budgeting. {APP_NAME} also handles the circles you save with and the loans that
              connect you to people.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((module) => (
              <div key={module.title} className="fin-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <module.icon className="size-[18px]" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{module.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{module.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { icon: BarChart3, title: "Know your month", body: "Income vs expense chart, category donut and monthly summaries keep surprises out." },
              { icon: Users, title: "Committee clarity", body: "A contribution matrix shows exactly who has paid for which month — no notebooks." },
              { icon: ShieldCheck, title: "Your data, yours", body: "Session-based auth and per-user row scoping on every query. Nothing shared, ever." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200/80 bg-white/60 p-5">
                <item.icon className="size-5 text-brand-700" />
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl bg-ink-900 px-6 py-8 text-white sm:flex-row sm:px-10">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Start with a clean sheet today</h2>
              <p className="mt-1 text-[13px] text-white/60">No spreadsheets. No monthly fee. Just your numbers.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/register" className="fin-btn-primary">
                Create account <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-ink-950 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-[12px] text-white/40 sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} {APP_NAME}. Personal finance, privately kept.</p>
          <p>Built with Next.js, Drizzle ORM & PostgreSQL.</p>
        </div>
      </footer>
    </div>
  );
}
