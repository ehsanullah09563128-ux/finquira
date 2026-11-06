"use client";

import { Loader2, LogOut, Save, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePassword, resetFinancialData, updateProfile } from "@/app/actions/account";
import { logoutAction } from "@/app/actions/auth";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Field } from "@/components/modal";
import { Card, CardHeader } from "@/components/ui";
import { useToast } from "@/components/toast";
import { CURRENCIES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { FieldErrors } from "@/lib/validation";

export function SettingsPanel({
  profile,
}: {
  profile: { name: string; email: string; currency: string; createdAt: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingProfile, startProfile] = useTransition();
  const [pendingPassword, startPassword] = useTransition();
  const [pendingReset, startReset] = useTransition();
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({});
  const [resetOpen, setResetOpen] = useState(false);

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startProfile(async () => {
      const result = await updateProfile(formData);
      if (result.ok) {
        toast(result.message ?? "Profile updated.");
        setProfileErrors({});
        router.refresh();
      } else {
        setProfileErrors(result.fieldErrors ?? {});
        toast(result.message ?? "Could not update profile.", "error");
      }
    });
  }

  function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startPassword(async () => {
      const result = await changePassword(formData);
      if (result.ok) {
        toast(result.message ?? "Password updated.");
        setPasswordErrors({});
        form.reset();
      } else {
        setPasswordErrors(result.fieldErrors ?? {});
        toast(result.message ?? "Could not update password.", "error");
      }
    });
  }

  function clearData() {
    startReset(async () => {
      const result = await resetFinancialData();
      if (result.ok) {
        toast(result.message ?? "Financial data cleared.");
        setResetOpen(false);
        router.refresh();
      } else {
        toast(result.message ?? "Could not clear data.", "error");
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Profile" subtitle="How your workspace identifies you" icon={UserRound} />
        <form onSubmit={saveProfile} className="space-y-4 px-5 py-4 sm:px-6">
          <Field label="Full name" htmlFor="profile-name" error={profileErrors.name}>
            <input id="profile-name" name="name" defaultValue={profile.name} className="fin-input" required />
          </Field>
          <Field label="Email address" htmlFor="profile-email" hint="Email addresses are used to sign in and can't be changed here.">
            <input id="profile-email" value={profile.email} className="fin-input" disabled />
          </Field>
          <Field label="Preferred currency" htmlFor="profile-currency" error={profileErrors.currency}>
            <select id="profile-currency" name="currency" defaultValue={profile.currency} className="fin-select">
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <p className="text-[11.5px] text-slate-400">Member since {formatDate(profile.createdAt, "long")}</p>
            <button type="submit" className="fin-btn-primary" disabled={pendingProfile}>
              {pendingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save profile
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Security" subtitle="Change the password used to sign in" icon={ShieldCheck} />
        <form onSubmit={savePassword} className="space-y-4 px-5 py-4 sm:px-6">
          <Field label="Current password" htmlFor="currentPassword" error={passwordErrors.currentPassword}>
            <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" className="fin-input" required />
          </Field>
          <Field label="New password" htmlFor="newPassword" error={passwordErrors.newPassword} hint="Minimum 8 characters.">
            <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" className="fin-input" minLength={8} required />
          </Field>
          <Field label="Confirm new password" htmlFor="confirmPassword" error={passwordErrors.confirmPassword}>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className="fin-input" required />
          </Field>
          <div className="flex justify-end border-t border-slate-100 pt-3">
            <button type="submit" className="fin-btn-primary" disabled={pendingPassword}>
              {pendingPassword ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Update password
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Data & privacy" subtitle="You control everything stored in your workspace" />
        <div className="space-y-3 px-5 py-4 sm:px-6">
          <p className="text-[13px] leading-relaxed text-slate-600">
            Every income, expense, committee and loan record is scoped to your user account. Other users of Finquira can
            never query, read or edit your data.
          </p>
          <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-[12px] leading-relaxed text-slate-500">
            Session cookies are http-only and signed with HS256. Passwords are stored as bcrypt hashes — never in plain
            text.
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <a href="/api/reports/export?type=income&from=1970-01-01&to=2999-12-31" className="fin-btn-secondary">
              Export my income
            </a>
            <a href="/api/reports/export?type=expenses&from=1970-01-01&to=2999-12-31" className="fin-btn-secondary">
              Export my expenses
            </a>
          </div>
        </div>
      </Card>

      <Card className="border-rose-100">
        <CardHeader title="Danger zone" subtitle="Irreversible actions" />
        <div className="space-y-3 px-5 py-4 sm:px-6">
          <p className="text-[13px] leading-relaxed text-slate-600">
            Deleting financial data removes all income, expenses, committees and loans from your account. Your login stays
            active.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="fin-btn-danger" onClick={() => setResetOpen(true)} disabled={pendingReset}>
              <Trash2 className="size-4" /> Delete all financial data
            </button>
            <form action={logoutAction}>
              <button type="submit" className="fin-btn-secondary">
                <LogOut className="size-4" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        title="Delete all financial data"
        message="Every income entry, expense, committee (with members and payments) and loan will be permanently deleted. This cannot be undone."
        confirmLabel="Delete everything"
        busy={pendingReset}
        onClose={() => setResetOpen(false)}
        onConfirm={clearData}
      />
    </div>
  );
}
