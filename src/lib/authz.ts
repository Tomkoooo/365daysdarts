import { getAuthSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/models/User";
import type { UserRole } from "@/models/User";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function getSessionUser() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new AuthError();
  }
  return session.user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await getSessionUser();
  if (!roles.includes(user.role)) {
    throw new AuthError();
  }
  return user;
}

export async function requireAdmin() {
  return requireRole("admin");
}

export async function requireLecturerOrAdmin() {
  return requireRole("lecturer", "admin");
}

export async function refreshUserSessionFields(userId: string) {
  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user) return null;
  return {
    id: user._id.toString(),
    role: user.role as UserRole,
    subscriptionStatus: user.subscriptionStatus || "inactive",
  };
}

export function canAccessLecturerRoutes(role?: string) {
  return role === "lecturer" || role === "admin";
}

export function isAdmin(role?: string) {
  return role === "admin";
}
