import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — NiyyaTrade",
  description: "Privacy Policy for the NiyyaTrade paper trading platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">1. Introduction</h2>
            <p>
              NiyyaTrade (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, and safeguard your information when you use our paper trading platform.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">2. Information We Collect</h2>
            <p><strong className="text-foreground">Account Information:</strong> When you register, we collect your
              email address and a display name.</p>
            <p className="mt-2"><strong className="text-foreground">Trading Data:</strong> We store your simulated
              trades, portfolio positions, watchlists, and compliance evaluations.</p>
            <p className="mt-2"><strong className="text-foreground">Usage Data:</strong> We may collect anonymized
              analytics including page views, feature usage, and error logs.</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">3. How We Use Your Data</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>To provide and maintain the Platform</li>
              <li>To personalize your experience and sync data across devices</li>
              <li>To improve the Platform through anonymized analytics</li>
              <li>To communicate important updates about the service</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">4. Data Sharing</h2>
            <p>
              We do <strong className="text-foreground">not</strong> sell your personal data to third parties.
              We may share anonymized, aggregated data that cannot identify you. We may use third-party
              services (e.g., hosting providers, analytics) that process data on our behalf under strict
              confidentiality agreements.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">5. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit (TLS),
              encrypted database storage, and access controls. However, no method of electronic
              transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your trading data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">7. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you delete your account,
              we will remove your personal data within 30 days, though anonymized analytics may persist.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes via email or a prominent notice on the Platform.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">9. Contact</h2>
            <p>
              For privacy-related inquiries, contact us at privacy@niyyatrade.com.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <a href="/" className="text-xs text-primary hover:underline">
            Back to NiyyaTrade
          </a>
        </div>
      </div>
    </div>
  );
}
