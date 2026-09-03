import axios from "axios";
import { toast } from "sonner";
import { useAuthStore, type User } from "@/lib/stores/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL && process.env.NODE_ENV === "production") {
  // A prod bundle without this env var would silently hit the developer's
  // own machine — fail loudly so it gets caught immediately.
  console.error(
    "NEXT_PUBLIC_API_URL is not set. The app cannot reach the backend — " +
      "set it at build time (e.g. https://niyyatrade-backend.onrender.com/api/v1).",
  );
}

export const api = axios.create({
  baseURL: API_URL || "http://localhost:4000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  // Send the httpOnly session cookie (nt_auth) on same-site + CORS requests
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as
      | ({ _retry?: boolean; url?: string; headers?: Record<string, string> } & Record<string, unknown>)
      | undefined;
    const isAuthCall =
      typeof original?.url === "string" && original.url.startsWith("/auth/");
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      localStorage.getItem("auth_token") &&
      !isAuthCall &&
      original &&
      !original._retry
    ) {
      // Single silent-renewal attempt: the httpOnly cookie may still be valid
      // even when the Bearer token is stale. Only then sign the user out.
      // (Guests have no local token, so this never fires for them.)
      original._retry = true;
      try {
        const { data } = await api.post<{ data: { user: User; token: string } }>(
          "/auth/refresh",
        );
        if (data?.data?.token) {
          const store = useAuthStore.getState();
          store.setAuth(data.data.user ?? store.user!, data.data.token);
          original.headers = {
            ...(original.headers ?? {}),
            Authorization: `Bearer ${data.data.token}`,
          };
          return api.request(original);
        }
      } catch {
        // Refresh failed — fall through to sign-out below.
      }
      // Only fires for expired/invalidated sessions — a failed login attempt
      // has no token and is surfaced inline by the auth forms instead.
      try {
        await api.post("/auth/logout");
      } catch {
        // Best effort — the local session is cleared regardless.
      }
      useAuthStore.getState().logout();
      toast.error("Your session has expired. Please sign in again.");
      const next = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign(`/login?next=${next}`);
      }
    }

    const data = error.response?.data;
    // Backend envelope is { error: { message } }; ValidationPipe nests { message: [...] }
    const serverMessage =
      typeof data?.error?.message === "string"
        ? data.error.message
        : typeof data?.message === "string"
          ? data.message
          : Array.isArray(data?.message) && data.message.length > 0
            ? data.message[0]
            : undefined;

    if (serverMessage) {
      error.message = serverMessage;
    } else if (!error.response) {
      error.message = "Cannot reach the server. Check your connection and try again.";
    }

    return Promise.reject(error);
  }
);
