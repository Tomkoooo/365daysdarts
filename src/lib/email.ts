/**
 * Optional email delivery. No third-party SDK required.
 * When EMAIL_API_URL + EMAIL_FROM are not set, sends are skipped (in-app notifications still work).
 *
 * To enable later, set EMAIL_API_URL to any HTTP endpoint that accepts POST JSON:
 * { from, to, subject, html, text }
 */
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function isEmailConfigured(): boolean {
  return !!(process.env.EMAIL_API_URL && process.env.EMAIL_FROM);
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; error?: string }> {
  const from = process.env.EMAIL_FROM;
  const apiUrl = process.env.EMAIL_API_URL;

  if (!from || !apiUrl) {
    if (process.env.NODE_ENV === "development") {
      console.log("[email skipped — nincs EMAIL_API_URL / EMAIL_FROM]", options.subject, "->", options.to);
    }
    return { success: true };
  }

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      console.error("Email API error:", errText);
      return { success: false, error: errText || "Email küldési hiba" };
    }
    return { success: true };
  } catch (e: unknown) {
    console.error("Email send failed:", e);
    return { success: false, error: e instanceof Error ? e.message : "Email hiba" };
  }
}
