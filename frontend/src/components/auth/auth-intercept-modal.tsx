"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/modal";

interface AuthInterceptModalProps {
  open: boolean;
  onClose: () => void;
  ticker: string;
  action?: "trade" | "watchlist";
}

export function AuthInterceptModal({
  open,
  onClose,
  ticker,
  action = "trade",
}: AuthInterceptModalProps) {
  const isWatchlist = action === "watchlist";
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <h2 className="mb-1 text-lg font-semibold">
          {isWatchlist ? "Sign up to use watchlists" : "Sign in to trade"}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {isWatchlist ? (
            <>
              Sign up for a free account to save {ticker.toUpperCase()} to your
              watchlist and track it across sessions.
            </>
          ) : (
            <>
              You need an account to buy or sell {ticker.toUpperCase()}. Sign in or
              create one to continue.
            </>
          )}
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/login"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-all"
          >
            Sign in
          </Link>
          <p className="text-xs text-muted-foreground">
            No account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </Modal>
  );
}
