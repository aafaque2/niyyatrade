"use client";

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

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Compliance Framework Overrides
        </h2>
        <FrameworkOverrideForm />
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-2 text-sm font-medium">Account</h2>
        <p className="text-xs text-muted-foreground">
          Account settings will be available after authentication setup.
        </p>
      </div>
    </div>
  );
}
