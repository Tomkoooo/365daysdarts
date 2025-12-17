import { DevModeRoleSwitcher } from "@/components/dev/DevModeRoleSwitcher";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import PrivacyWrapper from "@/components/layout/PrivacyWrapper";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
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
  let session = await getServerSession(authOptions);

  // Mock Session for Dev Mode
  if (!session && process.env.DEV_MODE === "true") {
    const cookieStore = await cookies();
    const devRole = cookieStore.get("dev_role")?.value || "admin";
    
    session = {
      user: {
        name: `Dev ${devRole.charAt(0).toUpperCase() + devRole.slice(1)}`,
        email: "dev@example.com",
        image: "",
        id: "dev-id",
        role: devRole as UserRole
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

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
