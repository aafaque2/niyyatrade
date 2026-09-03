import { api } from "@/lib/api";
import type { User } from "@/lib/stores/auth-store";

export interface RegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

interface AuthResponse {
  data: {
    user: User;
    token: string;
  };
}

export async function registerUser(dto: RegisterDto) {
  const { data } = await api.post<AuthResponse>("/auth/register", dto);
  return data.data;
}

export async function loginUser(dto: LoginDto) {
  const { data } = await api.post<AuthResponse>("/auth/login", dto);
  return data.data;
}

export async function getMe() {
  const { data } = await api.get<{ data: User }>("/auth/me");
  return data.data;
}

export async function refreshSession() {
  const { data } = await api.post<AuthResponse>("/auth/refresh");
  return data.data;
}

export async function logoutSession() {
  await api.post("/auth/logout");
}

export async function requestPasswordReset(email: string) {
  const { data } = await api.post<{ message: string }>(
    "/auth/forgot-password",
    { email },
  );
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post<{ message: string }>("/auth/reset-password", {
    token,
    password,
  });
  return data;
}
