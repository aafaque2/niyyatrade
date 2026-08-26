import axios from "axios";
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
    if (error.response?.status === 401 && typeof window !== "undefined") {
      useAuthStore.getState().logout();
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
