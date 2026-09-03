import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://niyyatrade.com";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0F0E",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NiyyaTrade — Framework-driven investing",
    template: "%s | NiyyaTrade",
  },
  description:
    "A framework-driven paper trading platform. Evaluate investments through ESG, Shariah, and custom compliance frameworks with transparent, explainable verdicts.",
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "NiyyaTrade",
    url: SITE_URL,
    title: "NiyyaTrade — Framework-driven investing",
    description:
      "Practice investing with ESG, Shariah (AAOIFI), and BDS screening. $100,000 in virtual capital, real market data, zero risk.",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "NiyyaTrade — Trade with Intentions. Invest with Ethics.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NiyyaTrade — Framework-driven investing",
    description:
      "Practice investing with ESG, Shariah (AAOIFI), and BDS screening. $100,000 virtual capital, real market data, zero risk.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-xs focus:font-medium focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <QueryProvider>
          <TooltipProvider>
            {children}
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{
                style: {
                  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                  background: "#111827",
                  border: "1px solid #232B35",
                  color: "#F8FAFC",
                },
              }}
            />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
