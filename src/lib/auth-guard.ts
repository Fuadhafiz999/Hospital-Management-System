// ═══════════════════════════════════════════════════════════════════
//  Auth Guard Helpers (server components)
//  Role-based redirects for dashboard layouts.
// ═══════════════════════════════════════════════════════════════════

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, AUTH_COOKIE_NAME } from "./auth-utils";
import prisma from "./prisma";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

/**
 * Fetch the full user record from the database given a JWT payload.
 */
async function fetchUserFromDb(userId: string): Promise<CurrentUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, role: true },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  } catch {
    return null;
  }
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

  const user = await fetchUserFromDb(payload.userId);
  if (!user) {
    redirect("/auth/login");
  }

  return user;
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

  return fetchUserFromDb(payload.userId);
}
