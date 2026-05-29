export const NEXT_AUTH_SESSION_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "__Host-next-auth.session-token",
] as const;

export function requestHasSessionCookie(
  cookies: { has: (name: string) => boolean }
): boolean {
  return NEXT_AUTH_SESSION_COOKIES.some((name) => cookies.has(name));
}

export function clearSessionCookies(
  cookies: { delete: (name: string) => void }
): void {
  for (const name of NEXT_AUTH_SESSION_COOKIES) {
    cookies.delete(name);
  }
}
