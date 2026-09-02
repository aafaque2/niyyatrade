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

      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-16 text-center sm:pb-32 sm:pt-28">
        <img
          src="/logo.png"
          alt="NiyyaTrade"
          className="mx-auto h-24 sm:h-32 w-auto"
        />

        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Trade with Intentions.
          <br />
          Invest with <span className="text-primary">Ethics</span>.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
          Evaluate investments through ESG, Shariah, or custom compliance frameworks.
          Understand <em>why</em> an investment passes or fails — before you risk a single rupee.
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

        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="h-11 px-7 text-sm font-medium bg-primary hover:bg-emerald-muted">
                Start investing — Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-11 px-7 text-sm font-medium">
                Sign in
              </Button>
            </Link>
            <Link href="/markets">
              <Button variant="outline" size="lg" className="h-11 px-7 text-sm font-medium border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60 hover:text-primary">
                Browse as guest
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>$100,000 virtual capital</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <Link href="/frameworks" className="hover:text-primary hover:underline">
              Explore frameworks
            </Link>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>No credit card required</span>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground/70">
          Guest mode: search any ticker, view compliance, then sign in to trade.
        </p>
      </div>
    </section>
  );
}
