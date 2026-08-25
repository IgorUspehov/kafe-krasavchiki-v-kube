import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { LandingNavigationFix } from "@/components/landing-navigation-fix";
import { SupportWidget } from "@/components/SupportWidget";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_PUBLIC_ORIGIN } from "@/lib/cloudflare/iframe-ready";
import { resolveBuyerFirebaseSetup } from "@/lib/deployable-zip/buyer-setup";
import { I18nProvider } from "@/lib/i18n/context";

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
  title: "Сайт + CRM + Бронирование — за 3 минуты",
  description: "Сайт + CRM + Бронирование для вашего бизнеса. €199/Monat — Website + CRM + Buchung.",
  metadataBase: new URL(DEFAULT_PUBLIC_ORIGIN),
  openGraph: {
    title: "Сайт + CRM + Бронирование — за 3 минуты",
    description: "Сайт + CRM + Бронирование для вашего бизнеса. €199/Monat — Website + CRM + Buchung.",
    url: DEFAULT_PUBLIC_ORIGIN,
    type: "website",
    images: [
      {
        url: "https://webstudio-muenchen.com/assets/og-image-199.png?v=199",
        width: 1200,
        height: 630,
        alt: "Сайт + CRM + Бронирование — воронка создания CRM-сайта",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Сайт + CRM + Бронирование — за 3 минуты",
    description: "Сайт + CRM + Бронирование для вашего бизнеса. €199/Monat — Website + CRM + Buchung.",
    images: ["https://webstudio-muenchen.com/assets/og-image-199.png?v=199"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const buyerSetup = await resolveBuyerFirebaseSetup();

  return (
    <html lang="de" className="light" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-svh bg-background font-sans text-foreground antialiased`}
      >
        <I18nProvider>
          <LandingNavigationFix />
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
          {buyerSetup ? null : <SupportWidget />}
        </I18nProvider>
      </body>
    </html>
  );
}
