"use client";

import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { ResetPortfolioDialog } from "@/components/settings/reset-portfolio-dialog";
import { FrameworkOverrideForm } from "@/components/settings/framework-override-form";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Account management and compliance preferences.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <ProfileForm />
          <PasswordForm />
        </div>
        <div className="space-y-5">
          <FrameworkOverrideForm />
          <ResetPortfolioDialog />
        </div>
      </div>
    </div>
  );
}
