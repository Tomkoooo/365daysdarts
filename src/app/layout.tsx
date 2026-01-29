import { DevModeRoleSwitcher } from "@/components/dev/DevModeRoleSwitcher";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getAuthSession } from "@/lib/session";
import AuthProvider from "@/components/providers/AuthProvider";
import PrivacyWrapper from "@/components/layout/PrivacyWrapper";
import { UserRole } from "@/models/User";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
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
  icons: {
    icon: "/logo.svg",
  },
  title: "365daysdarts",
  description: "Secure, efficient, and comprehensive Kressz learning.",
};

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

// ...

import { UploadProvider } from "@/components/providers/UploadContext";
import { UploadProgressWidget } from "@/components/layout/UploadProgressWidget";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthSession();

  return (
    <html lang="en" className="dark h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground flex flex-col min-h-screen`}
      >
        <AuthProvider session={session}>
          <UploadProvider>
            <PrivacyWrapper>
              <Navbar />
              {children}
              <Footer />
              {process.env.DEV_MODE === "true" && <DevModeRoleSwitcher />}
              <Toaster position="top-center" expand={true} richColors />
              <UploadProgressWidget />
            </PrivacyWrapper>
          </UploadProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
