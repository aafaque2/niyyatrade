"use client";

import { create } from "zustand";
import { queryClientRef } from "@/lib/query-client-ref";

export interface User {
  id: string;
  email: string;
  name: string | null;
  activeFrameworkId: string | null;
  currency: string;
  portfolio?: {
    id: string;
    availableCashCents: number;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

function getStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function setStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}

function removeStorage(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  _hydrated: false,

  setAuth: (user, token) => {
    setStorage("auth_token", token);
    setStorage("auth_user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  setUser: (user) => {
    setStorage("auth_user", JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    removeStorage("auth_token");
    removeStorage("auth_user");
    // Drop all cached queries so a different user on this tab can never
    // see the previous user's data.
    queryClientRef.current?.clear();
    set({ user: null, token: null, isAuthenticated: false, _hydrated: false });
  },

  hydrate: () => {
    const token = getStorage("auth_token");
    const userRaw = getStorage("auth_user");
    if (token) {
      let user: User | null = null;
      if (userRaw) {
        try {
          user = JSON.parse(userRaw) as User;
        } catch {
          // Corrupted storage — treat as signed out rather than crashing
          // (which would leave the app stuck on an infinite skeleton).
          removeStorage("auth_token");
          removeStorage("auth_user");
          set({ _hydrated: true });
          return;
        }
      }
      set({ token, user, isAuthenticated: true, _hydrated: true });
    } else {
      set({ _hydrated: true });
    }
  },
}));
