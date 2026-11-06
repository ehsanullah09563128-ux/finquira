import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formatMoney, percent } from "@/lib/format";

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return <Tag className={`fin-card ${className}`}>{children}</Tag>;
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600">
            <Icon className="size-4" />
          </span>
        ) : null}
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "neutral",
  trend,
}: {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  tone?: "neutral" | "positive" | "negative" | "warning" | "brand";
  trend?: ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-600",
    positive: "bg-brand-50 text-brand-600",
    negative: "bg-rose-50 text-rose-600",
    warning: "bg-amber-50 text-amber-600",
    brand: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="fin-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-slate-500">{label}</p>
        <span className={`grid size-8 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="tnum mt-3 truncate text-[22px] font-semibold tracking-tight text-slate-900">{value}</p>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
        {trend}
        {helper ? <span>{helper}</span> : null}
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "rose" | "amber" | "indigo";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-brand-50 text-brand-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    indigo: "bg-indigo-50 text-indigo-700",
  };
  return <span className={`fin-badge ${tones[tone]}`}>{children}</span>;
}

export function ProgressBar({
  value,
  total,
  tone = "brand",
  showLabel = false,
}: {
  value: number;
  total: number;
  tone?: "brand" | "indigo" | "amber" | "rose";
  showLabel?: boolean;
}) {
  const pct = percent(value, total);
  const tones: Record<string, string> = {
    brand: "bg-brand-500",
    indigo: "bg-indigo-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  return (
    <div className="w-full">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel ? <p className="mt-1 text-[11px] font-medium text-slate-500">{pct}%</p> : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-500">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function Money({
  value,
  currency,
  sign,
  className = "",
}: {
  value: string | number;
  currency: string;
  sign?: string;
  className?: string;
}) {
  return (
    <span className={`tnum ${className}`}>
      {sign ?? ""}
      {formatMoney(value, currency)}
    </span>
  );
}
