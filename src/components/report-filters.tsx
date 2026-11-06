"use client";

import { Download } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const PRESETS = [
  { label: "This month", months: 0 },
  { label: "Last 3 months", months: 2 },
  { label: "Last 6 months", months: 5 },
  { label: "Last 12 months", months: 11 },
];

function firstOfMonthsAgo(monthsAgo: number): string {
  const date = new Date();
  const result = new Date(date.getFullYear(), date.getMonth() - monthsAgo, 1);
  return result.toISOString().slice(0, 10);
}

export function ReportFilters({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);

  function apply(nextFrom = start, nextTo = end) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", nextFrom);
    params.set("to", nextTo);
    router.push(`/reports?${params.toString()}`);
  }

  function preset(months: number) {
    const nextFrom = firstOfMonthsAgo(months);
    const nextTo = new Date().toISOString().slice(0, 10);
    setStart(nextFrom);
    setEnd(nextTo);
    apply(nextFrom, nextTo);
  }

  const exportHref = (type: string) =>
    `/api/reports/export?type=${type}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  return (
    <div className="fin-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="report-from" className="fin-label">
              From
            </label>
            <input id="report-from" type="date" value={start} max={end} onChange={(event) => setStart(event.target.value)} className="fin-input w-auto" />
          </div>
          <div>
            <label htmlFor="report-to" className="fin-label">
              To
            </label>
            <input id="report-to" type="date" value={end} min={start} onChange={(event) => setEnd(event.target.value)} className="fin-input w-auto" />
          </div>
          <button type="button" className="fin-btn-primary" onClick={() => apply()}>
            Apply range
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 lg:ml-2">
          {PRESETS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => preset(item.months)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 lg:ml-auto">
          {[
            { type: "income", label: "Income CSV" },
            { type: "expenses", label: "Expenses CSV" },
            { type: "loans", label: "Loans CSV" },
            { type: "committees", label: "Committees CSV" },
          ].map((item) => (
            <a
              key={item.type}
              href={exportHref(item.type)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Download className="size-3.5" /> {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
