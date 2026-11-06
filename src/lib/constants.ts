export const APP_NAME = "Finquira";
export const APP_TAGLINE = "Your money, finally in one clear picture.";
export const APP_DESCRIPTION =
  "Finquira is a personal finance workspace for income, expenses, saving committees and loans — built for people who lend, borrow and save together.";

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Gift",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Shopping",
  "Healthcare",
  "Education",
  "Entertainment",
  "Other",
] as const;

export const PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "Mobile Wallet", "Cheque"] as const;

export const INCOME_SOURCES = [
  "Employer",
  "Client",
  "Own Business",
  "Bank / Broker",
  "Family",
  "Other",
] as const;

export const LOAN_TYPES = ["GIVEN", "TAKEN"] as const;
export type LoanType = (typeof LOAN_TYPES)[number];

export const COMMITTEE_STATUSES = ["ACTIVE", "COMPLETED", "PAUSED"] as const;

export const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar", symbol: "$" },
  { code: "EUR", label: "EUR — Euro", symbol: "€" },
  { code: "GBP", label: "GBP — British Pound", symbol: "£" },
  { code: "INR", label: "INR — Indian Rupee", symbol: "₹" },
  { code: "PKR", label: "PKR — Pakistani Rupee", symbol: "₨" },
  { code: "BDT", label: "BDT — Bangladeshi Taka", symbol: "৳" },
  { code: "AED", label: "AED — UAE Dirham", symbol: "د.إ" },
  { code: "SAR", label: "SAR — Saudi Riyal", symbol: "﷼" },
  { code: "CAD", label: "CAD — Canadian Dollar", symbol: "C$" },
  { code: "AUD", label: "AUD — Australian Dollar", symbol: "A$" },
  { code: "SGD", label: "SGD — Singapore Dollar", symbol: "S$" },
  { code: "JPY", label: "JPY — Japanese Yen", symbol: "¥" },
  { code: "TRY", label: "TRY — Turkish Lira", symbol: "₺" },
  { code: "NGN", label: "NGN — Nigerian Naira", symbol: "₦" },
  { code: "ZAR", label: "ZAR — South African Rand", symbol: "R" },
  { code: "BRL", label: "BRL — Brazilian Real", symbol: "R$" },
] as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/income", label: "Income", icon: "income" },
  { href: "/expenses", label: "Expenses", icon: "expenses" },
  { href: "/committees", label: "Committee", icon: "committee" },
  { href: "/loans", label: "Loans", icon: "loans" },
  { href: "/reports", label: "Reports", icon: "reports" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export const DEMO_EMAIL = "demo@finquira.app";
export const DEMO_PASSWORD = "finquira123";
