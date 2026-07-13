import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "HalalTrade - Compliance-Aware Investing",
  description:
    "A modern investing operating system that helps you learn, simulate, and understand investing decisions through transparent compliance frameworks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full bg-background font-sans text-foreground">
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
                },
              }}
            />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
