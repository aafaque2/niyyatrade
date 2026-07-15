"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
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
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--primary)_0%,_transparent_50%)] opacity-[0.07]" />

      <div className="relative mx-auto max-w-5xl px-6 pb-24 pt-20 text-center sm:pb-32 sm:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" />
          Paper trading platform for Indian equities
        </div>

        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Compliance-aware
          <br />
          <span className="text-primary">paper trading</span> &amp; education
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
          Practice investing with transparent compliance frameworks.
          Understand <em>why</em> an investment passes or fails before you risk a single rupee.
        </p>

        <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-md">
          <div className="relative">
            <Input
              type="text"
              placeholder="Look up any ticker (e.g., RELIANCE)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 pl-4 pr-28 text-base bg-surface border-border"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-muted"
            >
              Look up
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="h-11 px-7 text-sm font-medium bg-primary hover:bg-emerald-muted">
              Start paper trading
            </Button>
          </Link>
          <Link href="/frameworks">
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-7 text-sm font-medium"
            >
              Explore frameworks
            </Button>
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          $100,000 virtual capital. No account required to explore.
        </p>
      </div>
    </section>
  );
}
