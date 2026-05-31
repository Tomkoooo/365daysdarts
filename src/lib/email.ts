/**
 * Optional email delivery via SMTP (DB settings) or HTTP API (env fallback).
 * When neither is configured, sends are skipped (in-app notifications still work).
 */
import nodemailer from "nodemailer";
import { EmailSettingsService } from "@/services/email-settings";

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function isEmailConfigured(): Promise<boolean> {
  const settings = await EmailSettingsService.get();
  if (settings.enabled && settings.host && settings.fromEmail) {
    return true;
  }
  return !!(process.env.EMAIL_API_URL && process.env.EMAIL_FROM);
}

async function sendViaSmtp(
  settings: Awaited<ReturnType<typeof EmailSettingsService.get>>,
  options: { to: string; subject: string; html: string; text: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: settings.user
        ? { user: settings.user, pass: settings.pass }
        : undefined,
    });

    const from = settings.fromName
      ? `"${settings.fromName}" <${settings.fromEmail}>`
      : settings.fromEmail;

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return { success: true };
  } catch (e: unknown) {
    console.error("SMTP email send failed:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "SMTP hiba",
    };
  }
}

async function sendViaApi(
  options: { to: string; subject: string; html: string; text: string }
): Promise<{ success: boolean; error?: string }> {
  const from = process.env.EMAIL_FROM;
  const apiUrl = process.env.EMAIL_API_URL;

  if (!from || !apiUrl) {
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

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; error?: string }> {
  const settings = await EmailSettingsService.get();

  if (settings.enabled && settings.host && settings.fromEmail) {
    return sendViaSmtp(settings, options);
  }

  const from = process.env.EMAIL_FROM;
  const apiUrl = process.env.EMAIL_API_URL;

  if (!from || !apiUrl) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[email skipped — nincs SMTP / EMAIL_API_URL]",
        options.subject,
        "->",
        options.to
      );
    }
    return { success: true };
  }

  return sendViaApi(options);
}
