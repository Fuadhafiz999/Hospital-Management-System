// ═══════════════════════════════════════════════════════════════════
//  Auth Guard Helpers (server components)
//  Role-based redirects for dashboard layouts.
// ═══════════════════════════════════════════════════════════════════

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, AUTH_COOKIE_NAME } from "./auth-utils";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

/**
 * Require a specific role; redirect to /auth/login if not authenticated
 * or the role does not match.
 */
export async function requireRole(roles: string[]): Promise<CurrentUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/auth/login");
  }

  const payload = verifyToken(token);
  if (!payload || !roles.includes(payload.role)) {
    redirect("/auth/login");
  }

  return {
    id: payload.userId,
    email: payload.email,
    fullName: payload.email,
    role: payload.role,
  };
}

/**
 * Get the current user without redirecting (returns null if not authenticated).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    email: payload.email,
    fullName: payload.email,
    role: payload.role,
  };
}
