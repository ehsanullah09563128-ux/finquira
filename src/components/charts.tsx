import { formatMoney, percent } from "@/lib/format";

export const CHART_COLORS = [
  "#059669",
  "#0ea5e9",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
  "#ef4444",
];

export type SeriesPoint = { label: string; income: number; expense: number };

export function MonthlyBars({ data, currency }: { data: SeriesPoint[]; currency: string }) {
  const max = Math.max(1, ...data.flatMap((point) => [point.income, point.expense]));

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 text-[11px] font-medium text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand-500" /> Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-rose-400" /> Expenses
        </span>
        <span className="ml-auto hidden text-slate-400 sm:block">
          Peak {formatMoney(max, currency, { compact: true })}
        </span>
      </div>
      <div className="relative flex h-52 items-end gap-2 sm:gap-4">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((line) => (
            <span key={line} className="block border-t border-dashed border-slate-100" />
          ))}
        </div>
        {data.map((point) => {
          const incomeHeight = Math.max(point.income > 0 ? 4 : 0, (point.income / max) * 100);
          const expenseHeight = Math.max(point.expense > 0 ? 4 : 0, (point.expense / max) * 100);
          return (
            <div key={point.label} className="relative z-10 flex h-full flex-1 flex-col justify-end">
              <div className="flex h-full items-end justify-center gap-1.5">
                <div
                  className="w-1/2 max-w-[22px] rounded-t-md bg-linear-to-t from-brand-600 to-brand-400 transition-all hover:from-brand-700"
                  style={{ height: `${incomeHeight}%` }}
                  title={`${point.label} income: ${formatMoney(point.income, currency)}`}
                />
                <div
                  className="w-1/2 max-w-[22px] rounded-t-md bg-linear-to-t from-rose-400 to-rose-300 transition-all hover:from-rose-500"
                  style={{ height: `${expenseHeight}%` }}
                  title={`${point.label} expenses: ${formatMoney(point.expense, currency)}`}
                />
              </div>
              <span className="mt-2 text-center text-[11px] font-medium text-slate-500">{point.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type DonutSlice = { label: string; value: number };

function buildSegments(data: DonutSlice[], total: number, circumference: number) {
  return data.reduce<Array<DonutSlice & { dash: number; offset: number }>>((segments, slice) => {
    const previous = segments[segments.length - 1];
    const offset = previous ? previous.offset + previous.dash : 0;
    const dash = (slice.value / total) * circumference;
    return [...segments, { ...slice, dash, offset }];
  }, []);
}

export function DonutChart({
  data,
  currency,
  centerLabel = "Total spent",
}: {
  data: DonutSlice[];
  currency: string;
  centerLabel?: string;
}) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const segments = buildSegments(data, total, circumference);

  if (total <= 0) {
    return (
      <div className="flex h-48 items-center justify-center text-[13px] text-slate-400">
        No data for this period yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0">
        <svg viewBox="0 0 160 160" className="size-40 -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="18" />
          {segments.map((segment, index) => (
            <circle
              key={segment.label}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth="18"
              strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="butt"
            >
              <title>{`${segment.label}: ${formatMoney(segment.value, currency)}`}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{centerLabel}</span>
          <span className="tnum text-sm font-semibold text-slate-900">
            {formatMoney(total, currency, { compact: true })}
          </span>
        </div>
      </div>
      <ul className="grid w-full flex-1 gap-2">
        {data.slice(0, 6).map((slice, index) => (
          <li key={slice.label} className="flex items-center gap-2 text-[13px]">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="flex-1 truncate capitalize text-slate-600">{slice.label.toLowerCase()}</span>
            <span className="tnum text-xs font-medium text-slate-500">{percent(slice.value, total)}%</span>
            <span className="tnum w-20 text-right text-xs font-semibold text-slate-800">
              {formatMoney(slice.value, currency, { compact: true })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HorizontalBar({
  label,
  value,
  total,
  rightLabel,
  color = "#059669",
}: {
  label: string;
  value: number;
  total: number;
  rightLabel: string;
  color?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
        <span className="truncate font-medium text-slate-700">{label}</span>
        <span className="tnum shrink-0 text-xs text-slate-500">{rightLabel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent(value, total)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
