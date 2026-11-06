"use client";

export type AuthUser = {
  id: string;
  phone: string;
  full_name: string | null;
  role: string;
  estate_id?: string | null;
  default_address_directions?: string | null;
};

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem("agrover_token", token);
  localStorage.setItem("agrover_user", JSON.stringify(user));
  window.dispatchEvent(new Event("auth-updated"));
}

export function clearAuth() {
  localStorage.removeItem("agrover_token");
  localStorage.removeItem("agrover_user");
  window.dispatchEvent(new Event("auth-updated"));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("agrover_token");
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const user = localStorage.getItem("agrover_user");
    if (!user) return null;
    const parsed = JSON.parse(user);
    return parsed && parsed.id ? parsed : null;
  } catch (e) {
    localStorage.removeItem("agrover_user");
    return null;
  }
}