import { DevModeRoleSwitcher } from "@/components/dev/DevModeRoleSwitcher";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getAuthSession } from "@/lib/session";
import AuthProvider from "@/components/providers/AuthProvider";
import PrivacyWrapper from "@/components/layout/PrivacyWrapper";
import { UserRole } from "@/models/User";
import { cookies } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "365daysdarts",
  description: "Secure, efficient, and comprehensive Kressz learning.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthSession();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider session={session}>
          <PrivacyWrapper>
            {children}
            {process.env.DEV_MODE === "true" && <DevModeRoleSwitcher />}
          </PrivacyWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
