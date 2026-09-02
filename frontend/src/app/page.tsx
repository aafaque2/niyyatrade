import { Shield, BookText, TrendingUp, BarChart3, Layers, Eye } from "lucide-react";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureCard } from "@/components/landing/feature-card";
import { LandingFooter } from "@/components/landing/footer";
import { LandingRedirect } from "@/components/landing/landing-redirect";
import { LandingNav } from "@/components/landing/landing-nav";

const features = [
  {
    icon: Shield,
    title: "Transparent Compliance",
    description:
      "Evaluate assets against ESG criteria, AAOIFI Shariah standards, or custom rule sets. Every verdict is explainable.",
  },
  {
    icon: Layers,
    title: "Pluggable Frameworks",
    description:
      "Switch between Standard, ESG, and Halal compliance modes instantly. Customise thresholds to match your criteria.",
  },
  {
    icon: TrendingUp,
    title: "Framework-driven investing",
    description:
      "Execute fractional share trades with $100,000 in virtual capital. Track your portfolio and test strategies risk-free.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Market Data",
    description:
      "Live prices, candlestick charts, and fundamental data. Make informed decisions with accurate, up-to-date information.",
  },
  {
    icon: BookText,
    title: "Investment Education",
    description:
      "Understand the math, thresholds, and reasoning behind every compliance decision. Learn by doing, not just reading.",
  },
  {
    icon: Eye,
    title: "Portfolio Analytics",
    description:
      "Sector distribution, compliance exposure, performance tracking, and activity history in a single, clear view.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingRedirect />
      <LandingNav />
      <HeroSection />

      <section className="mx-auto w-full max-w-5xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Built for informed investing
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Every feature designed to help you understand your investments before committing real capital.
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h2 className="text-xl font-semibold tracking-tight">
            Framework-driven investing
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            $100,000 in virtual capital. Transparent, explainable compliance.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="/register"
                className="inline-flex h-11 items-center rounded-lg bg-primary px-7 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-muted"
              >
                Create free account
              </a>
              <a
                href="/login"
                className="inline-flex h-11 items-center rounded-lg border border-border px-7 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
              >
                Sign in
              </a>
              <a
                href="/markets"
                className="inline-flex h-11 items-center rounded-lg border border-dashed border-primary/30 bg-primary/5 px-7 text-sm font-medium text-primary transition-colors hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
              >
                Browse as guest
              </a>
            </div>
            <p className="text-xs text-muted-foreground">No account needed to explore — sign in only to trade.</p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
