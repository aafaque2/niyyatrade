"use client";

import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { ResetPortfolioDialog } from "@/components/settings/reset-portfolio-dialog";
import { FrameworkOverrideForm } from "@/components/settings/framework-override-form";

export default function SettingsPage() {

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Account management and compliance preferences.
        </p>
      </div>

      <ProfileForm />

      <PasswordForm />

      <FrameworkOverrideForm />

      <ResetPortfolioDialog />
    </div>
  );
}
