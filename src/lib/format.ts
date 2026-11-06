import { CURRENCIES } from "./constants";

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(
  value: string | number | null | undefined,
  currency = "USD",
  options: { compact?: boolean; decimals?: boolean } = {},
): string {
  const amount = toNumber(value);
  const safeCurrency = CURRENCIES.some((c) => c.code === currency) ? currency : "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
      notation: options.compact ? "compact" : "standard",
      maximumFractionDigits: options.decimals === false ? 0 : options.compact ? 1 : 2,
      minimumFractionDigits: options.decimals === false ? 0 : 2,
    }).format(amount);
  } catch {
    return `${safeCurrency} ${amount.toFixed(2)}`;
  }
}

export function currencySymbol(currency = "USD"): string {
  return CURRENCIES.find((c) => c.code === currency)?.symbol ?? "$";
}

export function formatDate(value: string | Date | null | undefined, style: "short" | "long" = "short"): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(`${value.length === 10 ? `${value}T00:00:00` : value}`) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: style === "long" ? "long" : "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(`${value.slice(0, 10)}T00:00:00`) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(year, month - 1, 1));
}

export function addMonths(date: Date, months: number): Date {
  const copy = new Date(date.getTime());
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

/** Last `count` month keys, oldest first, ending with the current month. */
export function recentMonthKeys(count = 6, reference = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = addMonths(new Date(reference.getFullYear(), reference.getMonth(), 1), -i);
    keys.push(monthKey(date));
  }
  return keys;
}

export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((date.getTime() - start.getTime()) / 86_400_000);
}

export function percent(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
