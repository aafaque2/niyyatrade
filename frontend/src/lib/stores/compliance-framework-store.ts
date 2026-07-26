"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "niyyatrade_frameworks";
const DEFAULT_FRAMEWORKS = ["esg"];

interface ComplianceFrameworkState {
  selectedFrameworks: string[];
  toggleFramework: (slug: string) => void;
  setFrameworks: (slugs: string[]) => void;
  isActive: (slug: string) => boolean;
}

export const useComplianceFrameworkStore = create<ComplianceFrameworkState>()(
  persist(
    (set, get) => ({
      selectedFrameworks: DEFAULT_FRAMEWORKS,

      toggleFramework: (slug) => {
        const current = get().selectedFrameworks;
        const next = current.includes(slug)
          ? current.filter((s) => s !== slug)
          : [...current, slug];
        set({ selectedFrameworks: next });
      },

      setFrameworks: (slugs) => {
        set({ selectedFrameworks: slugs });
      },

      isActive: (slug) => get().selectedFrameworks.includes(slug),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ selectedFrameworks: state.selectedFrameworks }),
    },
  ),
);
