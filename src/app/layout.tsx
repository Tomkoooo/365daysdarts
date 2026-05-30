import { DevModeRoleSwitcher } from "@/components/dev/DevModeRoleSwitcher";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getAuthSession } from "@/lib/session";
import AuthProvider from "@/components/providers/AuthProvider";
import PrivacyWrapper from "@/components/layout/PrivacyWrapper";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { UploadProvider } from "@/components/providers/UploadContext";
import { UploadProgressWidget } from "@/components/layout/UploadProgressWidget";
import { SeoSettingsService } from "@/services/seo-settings";
import { ThemeSettingsService } from "@/services/theme-settings";
import { themeTokensToCssVars } from "@/lib/theme-css-vars";
import { getPublicSiteChrome } from "@/lib/site-chrome";
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

export async function generateMetadata(): Promise<Metadata> {
  const seo = await SeoSettingsService.get();
  const metadata: Metadata = {
    icons: { icon: seo.favicon || "/logo.svg" },
    title: seo.siteTitle,
    description: seo.siteDescription,
    openGraph: {
      title: seo.siteTitle,
      description: seo.siteDescription,
      images: seo.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
    robots: {
      index: seo.robotsIndex,
      follow: seo.robotsFollow,
    },
  };
  if (seo.canonicalBaseUrl) {
    metadata.metadataBase = new URL(seo.canonicalBaseUrl);
  }
  return metadata;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthSession();
  const [theme, { branding }] = await Promise.all([
    ThemeSettingsService.get(),
    getPublicSiteChrome(),
  ]);
  const themeStyle = themeTokensToCssVars(theme.colors);

  return (
    <html lang="en" className="dark h-full" style={themeStyle}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground flex flex-col min-h-screen`}
      >
        <AuthProvider session={session}>
          <UploadProvider>
            <PrivacyWrapper>
              <Navbar branding={branding} />
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
