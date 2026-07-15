import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "NiyyaTrade — Framework-driven investing",
  description:
    "A framework-driven paper trading platform. Evaluate investments through ESG, Shariah, and custom compliance frameworks with transparent, explainable verdicts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
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
