import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "HalalTrade - Paper Trading & Compliance Education",
  description:
    "A compliance-aware paper trading platform for Indian equities. Practice investing with transparent ESG and Shariah compliance frameworks.",
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
