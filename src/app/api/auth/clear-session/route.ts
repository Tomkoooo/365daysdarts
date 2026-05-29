import { NextRequest, NextResponse } from "next/server";
import { applyClearAuthCookies } from "@/lib/next-auth-cookies";

/**
 * Clears NextAuth cookies without calling signOut (which fails if JWT cannot be decrypted).
 */
export async function GET(req: NextRequest) {
  const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") || "/login?session=expired";
  const target = callbackUrl.startsWith("/")
    ? new URL(callbackUrl, req.url)
    : new URL("/login?session=expired", req.url);

  const response = NextResponse.redirect(target);
  return applyClearAuthCookies(response);
}
