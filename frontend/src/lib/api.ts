import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
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
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      localStorage.getItem("auth_token")
    ) {
      // Only fires for expired/invalidated sessions — a failed login attempt
      // has no token and is surfaced inline by the auth forms instead.
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
    const serverMessage =
      typeof data?.message === "string"
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
