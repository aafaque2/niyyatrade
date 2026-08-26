import type { QueryClient } from "@tanstack/react-query";

/**
 * Shared handle to the app's QueryClient so non-React code paths
 * (zustand store logout, axios interceptors) can clear the cache
 * and prevent data leaking between sessions.
 */
export const queryClientRef: { current: QueryClient | null } = {
  current: null,
};
