"use client";

import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { loginAction, registerAction } from "@/app/actions/auth";
import { Field } from "@/components/modal";
import { useToast } from "@/components/toast";
import { CURRENCIES, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants";
import type { FieldErrors } from "@/lib/validation";

export function LoginForm() {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFormError("");
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result && !result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message ?? "Unable to sign in.");
        toast(result.message ?? "Unable to sign in.", "error");
      }
    });
  }

  return (
    <div className="space-y-5">
      <a
        href="/api/demo"
        className="group flex w-full items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
          <Sparkles className="size-4" />
        </span>
        <span className="flex-1">
          <span className="block text-[13px] font-semibold text-brand-900">Explore the demo workspace</span>
          <span className="block text-[11.5px] text-brand-700/80">
            {DEMO_EMAIL} · {DEMO_PASSWORD}
          </span>
        </span>
        <span className="text-[11px] font-semibold text-brand-700 group-hover:underline">Open</span>
      </a>

      <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> or sign in with email <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email address" htmlFor="email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="fin-input"
            placeholder="you@example.com"
            required
          />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="fin-input pr-11"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        {formError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700">
            {formError}
          </p>
        ) : null}

        <button type="submit" className="fin-btn-primary w-full py-3" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export function RegisterForm() {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFormError("");
    startTransition(async () => {
      const result = await registerAction(formData);
      if (result && !result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message ?? "Unable to create account.");
        toast(result.message ?? "Unable to create account.", "error");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Full name" htmlFor="name" error={errors.name}>
        <input id="name" name="name" autoComplete="name" className="fin-input" placeholder="Avery Sinclair" required />
      </Field>
      <Field label="Email address" htmlFor="email" error={errors.email}>
        <input id="email" name="email" type="email" autoComplete="email" className="fin-input" placeholder="you@example.com" required />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="fin-input pr-11"
            placeholder="Create a strong password"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      <Field label="Preferred currency" htmlFor="currency" error={errors.currency}>
        <select id="currency" name="currency" defaultValue="USD" className="fin-select">
          {CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.label}
            </option>
          ))}
        </select>
      </Field>

      {formError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700">
          {formError}
        </p>
      ) : null}

      <button type="submit" className="fin-btn-primary w-full py-3" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-[11.5px] leading-relaxed text-slate-400">
        By creating an account you agree to keep your own backups. Finquira stores your records privately against your
        user account.
      </p>
    </form>
  );
}
