"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getMe } from "@/lib/services/auth";
import { X } from "lucide-react";

const PAPER_BANNER_KEY = "niyyatrade_paper_banner_dismissed";

function PaperTradingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // sessionStorage is only available after hydration on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(sessionStorage.getItem(PAPER_BANNER_KEY) !== "1");
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(PAPER_BANNER_KEY, "1");
  }, []);

  if (!visible) return null;

  return (
    <div className="sticky top-0 z-50 bg-primary/10 border-b border-primary/20 px-4 py-1.5 text-center relative">
      <p className="text-[11px] font-medium text-primary">
        Paper Trading — No real money involved. All trades are simulated for educational purposes.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary transition-colors"
        aria-label="Dismiss paper trading notice"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hydrated);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const meMutation = useMutation({
    mutationFn: getMe,
    onSuccess: (me) => {
      setUser(me);
    },
    onError: () => {
      logout();
      router.push("/login");
    },
  });

  // useMutation returns a new object each render; keeping it in a ref lets the
  // effect below depend only on real state changes (otherwise it re-runs on
  // every render and can fire duplicate /auth/me requests).
  const meMutationRef = useRef(meMutation);
  useEffect(() => {
    meMutationRef.current = meMutation;
  });

  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      router.push("/login");
      return;
    }

    if (!user && !meMutationRef.current.isPending) {
      meMutationRef.current.mutate();
    }
  }, [hydrated, token, user, router]);

  if (!hydrated || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-72 space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PaperTradingBanner />
      <Sidebar />
      <TopNav />
      <main id="main-content" className="lg:ml-[232px] mt-14 min-h-[calc(100vh-3.5rem)] p-6">
        <div className="mx-auto max-w-[1400px] animate-fade-in">
          {children}
        </div>
      </main>
      <footer className="lg:ml-[232px] border-t border-border px-6 py-3">
        <p className="text-[10px] text-muted-foreground text-center">
          Market data provided by Yahoo Finance. Prices may be delayed up to 15 minutes for non-US markets.
          NiyyaTrade is a paper trading platform — no real money is involved. This is not financial advice.
        </p>
      </footer>
    </div>
  );
}
