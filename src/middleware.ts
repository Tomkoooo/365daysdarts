import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  applyClearAuthCookies,
  requestHasSessionCookie,
} from "@/lib/next-auth-cookies";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/business", "/lecturer"];

function isProtectedPath(path: string) {
  return PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isAuthPath(path: string) {
  return path.startsWith("/api/auth/");
}

function isPublicAuthPage(path: string) {
  return path === "/login" || path === "/register" || path.startsWith("/error");
}

async function getValidToken(req: NextRequest) {
  try {
    return await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    return null;
  }
}

function clearCookiesAndRedirect(req: NextRequest, destination: string) {
  const url = new URL(destination, req.url);
  const response = NextResponse.redirect(url);
  return applyClearAuthCookies(response);
}

function clearCookiesAndContinue() {
  const response = NextResponse.next();
  return applyClearAuthCookies(response);
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (process.env.DEV_MODE === "true") {
    return NextResponse.next();
  }

  // Never intercept our cookie-clear route or other auth API handlers
  if (path === "/api/auth/clear-session" || isAuthPath(path)) {
    return NextResponse.next();
  }

  const hasSessionCookie = requestHasSessionCookie(req.cookies);

  if (hasSessionCookie) {
    const token = await getValidToken(req);

    if (!token) {
      // Stale JWT after secret rotation — clear cookies without NextAuth signOut
      if (isPublicAuthPage(path)) {
        return clearCookiesAndContinue();
      }
      const login = `/login?session=expired`;
      return clearCookiesAndRedirect(req, login);
    }
  }

  if (!isProtectedPath(path)) {
    return NextResponse.next();
  }

  const token = await getValidToken(req);
  if (!token) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", path);
    return clearCookiesAndRedirect(req, login.toString());
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
