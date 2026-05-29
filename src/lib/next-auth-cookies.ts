import { NextResponse } from "next/server";

/** Session + related NextAuth cookies to clear when JWT decryption fails */
export const NEXT_AUTH_COOKIES_TO_CLEAR = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "__Host-next-auth.session-token",
  "next-auth.csrf-token",
  "__Secure-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
] as const;

export function requestHasSessionCookie(
  cookies: { has: (name: string) => boolean }
): boolean {
  return (
    cookies.has("next-auth.session-token") ||
    cookies.has("__Secure-next-auth.session-token") ||
    cookies.has("__Host-next-auth.session-token")
  );
}

/** Clear stale NextAuth cookies on a middleware / route response (no JWT decode). */
export function applyClearAuthCookies(response: NextResponse): NextResponse {
  const secure = process.env.NODE_ENV === "production";

  for (const name of NEXT_AUTH_COOKIES_TO_CLEAR) {
    const isHost = name.startsWith("__Host-");
    const isSecureName = name.startsWith("__Secure-") || isHost;

    response.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: secure || isSecureName,
      ...(isHost ? {} : {}),
    });
  }

  return response;
}
