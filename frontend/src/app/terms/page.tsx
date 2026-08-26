import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — NiyyaTrade",
  description: "Terms of Service for the NiyyaTrade paper trading platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using NiyyaTrade (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
              If you do not agree, do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">2. Paper Trading Only</h2>
            <p>
              NiyyaTrade is a <strong className="text-foreground">paper trading platform</strong>. No real money is
              involved. All trades are simulated and do not execute on any real exchange. The Platform is designed
              for educational and informational purposes only.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">3. Not Financial Advice</h2>
            <p>
              Nothing on NiyyaTrade constitutes financial advice, investment recommendations, or an offer to buy or
              sell any securities. Compliance analysis provided on the Platform is based on publicly available data and
              algorithmic evaluation — it should not be the sole basis for any investment decision.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">4. Data &amp; Accuracy</h2>
            <p>
              Market data is provided by Yahoo Finance and may be delayed up to 15 minutes for non-US markets.
              While we strive for accuracy, we make no warranties about the completeness, reliability, or
              suitability of this data. You acknowledge that data may contain errors or omissions.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">5. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. You agree
              to notify us immediately of any unauthorized use. We reserve the right to suspend or terminate
              accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">6. Prohibited Use</h2>
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Platform</li>
              <li>Use automated systems to scrape or extract data without permission</li>
              <li>Impersonate another user or misrepresent your identity</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">7. Limitation of Liability</h2>
            <p>
              NiyyaTrade is provided &quot;as is&quot; without warranties of any kind. We shall not be liable for any
              indirect, incidental, or consequential damages arising from your use of the Platform.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">8. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Platform after changes
              constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">9. Contact</h2>
            <p>
              For questions about these Terms, please contact us at support@niyyatrade.com.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <Link href="/" className="text-xs text-primary hover:underline">
            Back to NiyyaTrade
          </Link>
        </div>
      </div>
    </div>
  );
}
