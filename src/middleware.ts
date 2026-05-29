import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requestHasSessionCookie } from "@/lib/next-auth-cookies";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/business", "/lecturer"];

function isProtectedPath(path: string) {
  return PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isAuthApiPath(path: string) {
  return path.startsWith("/api/auth/");
}

async function getValidToken(req: NextRequest) {
  return getToken({ req, secret: process.env.NEXTAUTH_SECRET });
}

function redirectToSignOut(req: NextRequest) {
  const signOut = new URL("/api/auth/signout", req.url);
  signOut.searchParams.set("callbackUrl", "/login?session=expired");
  return NextResponse.redirect(signOut);
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (process.env.DEV_MODE === "true") {
    return NextResponse.next();
  }

  const hasSessionCookie = requestHasSessionCookie(req.cookies);

  // Stale/invalid JWT (e.g. after NEXTAUTH_SECRET rotation) — clear via sign-out
  if (hasSessionCookie && !isAuthApiPath(path)) {
    const token = await getValidToken(req);
    if (!token) {
      return redirectToSignOut(req);
    }
  }

  if (!isProtectedPath(path)) {
    return NextResponse.next();
  }

  const token = await getValidToken(req);
  if (!token) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  if (path.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (
    path.startsWith("/business") &&
    token.role !== "business" &&
    token.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (
    path.startsWith("/lecturer") &&
    token.role !== "lecturer" &&
    token.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on all routes except static assets so stale session cookies
     * are cleared site-wide after NEXTAUTH_SECRET changes.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
