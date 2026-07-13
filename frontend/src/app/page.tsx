import { Scale, BookText, TrendingUp, Globe } from "lucide-react";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureCard } from "@/components/landing/feature-card";
import { LandingFooter } from "@/components/landing/footer";

const features = [
  {
    icon: Scale,
    title: "Pluggable Compliance Frameworks",
    description:
      "Evaluate assets against AAOIFI standards, ESG criteria, or custom rule sets. Each framework is fully transparent — see exactly why an asset passes or fails.",
  },
  {
    icon: BookText,
    title: "Explainable Evaluations",
    description:
      "No black boxes. Every compliance verdict includes a plain-English breakdown of the math, thresholds, and reasoning behind the decision.",
  },
  {
    icon: TrendingUp,
    title: "Paper Trading Simulator",
    description:
      "Practice investing with $100,000 in virtual capital. Execute fractional share trades, track your portfolio, and test strategies risk-free.",
  },
  {
    icon: Globe,
    title: "Real-Time Market Data",
    description:
      "Live prices, historical charts, and fundamental data powered by Financial Modeling Prep. Make informed decisions with accurate market information.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HeroSection />

      <section className="mx-auto w-full max-w-5xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Everything you need to invest with confidence
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A modern platform built for compliance-conscious investors.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h2 className="text-xl font-semibold tracking-tight">
            Start your compliance-aware investing journey
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join other investors who trade with transparency and purpose.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <a
              href="/register"
              className="inline-flex h-12 items-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started Free
            </a>
            <a
              href="/login"
              className="inline-flex h-12 items-center rounded-md border border-border px-8 text-sm font-medium hover:bg-accent"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
