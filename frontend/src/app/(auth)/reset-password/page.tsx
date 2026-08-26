"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "@/lib/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const token =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token")
      : null;

  const mutation = useMutation({
    mutationFn: () => resetPassword(token!, password),
    onSuccess: (data) => {
      // Give the success message a moment to read, then go sign in.
      setError("");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
      return data;
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to reset password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(
        "This link is missing its reset token. Please request a new email.",
      );
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--primary)_0%,_transparent_50%)] opacity-[0.05]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center text-foreground"
          >
            <img
              src="/logo.png"
              alt="NiyyaTrade"
              className="h-16 w-auto"
            />
          </Link>
          <h1 className="mt-8 text-xl font-semibold tracking-tight">
            Choose a new password
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pick something strong — at least 8 characters.
          </p>
        </div>

        {!token ? (
          <div className="rounded-lg border border-destructive/20 bg-surface/50 p-4 text-center space-y-3">
            <p className="text-sm text-destructive">
              This reset link is invalid.
            </p>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        ) : mutation.isSuccess ? (
          <div className="rounded-lg border border-border bg-surface/50 p-4 text-center space-y-3">
            <p className="text-sm text-foreground">
              Your password has been updated. Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-foreground"
              >
                New password
              </label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="h-10 bg-surface border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-medium text-foreground"
              >
                Confirm new password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="h-10 bg-surface border-border"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full h-10 bg-primary hover:bg-emerald-muted"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
