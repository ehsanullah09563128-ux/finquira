import { CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/app-shell";
import { APP_NAME } from "@/lib/constants";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-white lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-ink-900 via-ink-950 to-[#04100c] p-10 lg:flex">
        <div className="pointer-events-none absolute -right-24 top-10 size-80 rounded-full bg-brand-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -left-16 bottom-0 size-72 rounded-full bg-emerald-400/10 blur-[90px]" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <BrandMark />
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-white">{APP_NAME}</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">Finance OS</p>
          </div>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            The honest view of your money.
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-white/55">
            Track income and spending, run saving committees with a real contribution ledger, and never lose sight of a
            loan again.
          </p>
          <ul className="mt-8 space-y-3 text-[13px] text-white/65">
            {[
              "Salary, side income and every expense in one place",
              "Committee payouts, turns and pending months",
              "Loans given and taken with repayment history",
              "Reports you can export and share",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-300" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-[11px] text-white/35">
          <ShieldCheck className="size-3.5" /> Session cookies are http-only and passwords are hashed with bcrypt.
        </p>
      </aside>

      <main className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">{APP_NAME}</span>
          </Link>
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <div className="mt-6 text-center text-[13px] text-slate-500">{footer}</div>
        </div>
      </main>
    </div>
  );
}
