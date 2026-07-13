"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = query.trim().toUpperCase();
    if (ticker) {
      router.push(`/assets/${ticker}`);
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-20 text-center sm:pb-32 sm:pt-28">
        <div className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          Islamic Finance · Transparent · Free to Use
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          The Compliance-Aware
          <br />
          Investing Operating System
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          Learn, simulate, and understand investing decisions through
          transparent compliance frameworks. Start paper trading with
          $100,000 in virtual capital.
        </p>

        <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search any asset (e.g., AAPL)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 pl-10 text-base"
            />
          </div>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 text-sm font-medium">
              Get Started Free
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-sm font-medium"
            >
              Sign In
            </Button>
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required. Start with $100,000 in paper trading
          capital.
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}
