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
