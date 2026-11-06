import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { SettingsPanel } from "@/components/settings-panel";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Update your profile, choose how amounts are displayed and manage the security of your workspace."
      />
      <SettingsPanel
        profile={{
          name: user.name,
          email: user.email,
          currency: user.currency,
          createdAt: user.createdAt.toISOString(),
        }}
      />
    </div>
  );
}
