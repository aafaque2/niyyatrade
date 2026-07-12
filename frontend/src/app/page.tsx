"use client";

import { useState } from "react";
import Link from "next/link";
import { LoginDialog } from "@/components/auth/login-dialog";

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Compliance-Aware Investing
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Learn, simulate, and understand investing decisions through
          transparent compliance frameworks.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="rounded-md border px-6 py-2.5 text-sm font-medium hover:bg-accent"
          >
            Try Trading Now
          </button>
          <Link
            href="/login"
            className="rounded-md border px-6 py-2.5 text-sm font-medium hover:bg-accent"
          >
            Sign In
          </Link>
        </div>
      </div>

      <LoginDialog open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
