"use client";

import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { ResetPortfolioDialog } from "@/components/settings/reset-portfolio-dialog";
import { CurrencySelector } from "@/components/settings/currency-selector";
import { ActiveFrameworkCard } from "@/components/settings/active-framework-card";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function SettingsPage() {
  // Keyed on user id: these forms snapshot user fields into useState at mount,
  // and without the key they would initialize from null while /auth/me is in
  // flight (blank name, wrong currency).
  const userId = useAuthStore((s) => s.user?.id);

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
          <ProfileForm key={userId ?? "loading"} />
          <CurrencySelector key={userId ?? "loading"} />
          <ActiveFrameworkCard />
          <ResetPortfolioDialog />
        </div>
        <div className="space-y-5">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
