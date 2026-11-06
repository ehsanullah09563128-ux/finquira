"use client";

import {
  BarChart3,
  ChevronRight,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { NAV_ITEMS } from "@/lib/constants";
import { initials } from "@/lib/format";

const ICONS = {
  dashboard: LayoutDashboard,
  income: TrendingUp,
  expenses: Receipt,
  committee: Users,
  loans: HandCoins,
  reports: BarChart3,
  settings: Settings,
} as const;

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand-400 to-brand-600 text-ink-950 shadow-[0_6px_18px_-8px_rgba(5,150,105,0.9)] ${className}`}>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
        <path d="M5 17V9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M12 17V5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M19 17v-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; currency: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
        Workspace
      </p>
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition ${
              active
                ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span
              className={`grid size-7 place-items-center rounded-lg transition ${
                active ? "bg-brand-400/20 text-brand-300" : "text-white/50 group-hover:text-white/80"
              }`}
            >
              <Icon className="size-[16px]" />
            </span>
            <span className="flex-1">{item.label}</span>
            {active ? <span className="size-1.5 rounded-full bg-brand-400" /> : null}
          </Link>
        );
      })}

      <div className="mt-auto pb-2 pt-4">
        <div className="mx-1 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-400/15 text-[11px] font-bold text-brand-200">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-white">{user.name}</p>
              <p className="truncate text-[11px] text-white/40">{user.email}</p>
            </div>
          </div>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-2 text-[12px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#f5f7f6]">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-linear-to-b from-ink-900 via-ink-950 to-[#04100c] py-5 lg:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-3 px-6">
          <BrandMark />
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-white">Finquira</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/35">Finance OS</p>
          </div>
        </Link>
        {nav}
        <div className="mx-4 mb-1 flex items-center gap-2 rounded-lg bg-brand-400/10 px-3 py-2 text-[11px] font-medium text-brand-200">
          <Wallet className="size-3.5" /> Base currency · {user.currency}
        </div>
      </aside>

      {/* mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside className="animate-fade-up relative flex h-full w-[17rem] flex-col bg-linear-to-b from-ink-900 via-ink-950 to-[#04100c] py-5">
            <div className="mb-6 flex items-center justify-between px-5">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <BrandMark />
                <span className="text-[15px] font-semibold text-white">Finquira</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 lg:hidden"
          >
            <Menu className="size-4" />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <BrandMark className="size-7 rounded-lg" />
            <span className="text-sm font-semibold text-slate-900">Finquira</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 sm:flex">
              <span className="size-1.5 rounded-full bg-brand-500" />
              {user.currency}
            </span>
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="grid size-7 place-items-center rounded-full bg-ink-900 text-[10px] font-bold text-brand-200">
                {initials(user.name)}
              </span>
              <span className="hidden max-w-[9rem] truncate text-[12.5px] font-medium text-slate-700 sm:block">
                {user.name}
              </span>
              <ChevronRight className="hidden size-3.5 text-slate-400 sm:block" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
