import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { AuthStateBridge } from "@/components/auth-state-bridge";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PostHogPageView } from "@/components/posthog-page-view";
import { siteConfig } from "@/config/site";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "Engineering Foundry — Prepare. Practice. Build. Grow.", template: "%s — Engineering Foundry" },
  description: siteConfig.description,
  openGraph: { type: "website", locale: "en_US", siteName: siteConfig.name, title: siteConfig.name, description: siteConfig.description, images: [{ url: "/og.png", width: 1730, height: 909, alt: "Engineering Foundry — Prepare. Practice. Build. Grow." }] },
  twitter: { card: "summary_large_image", title: siteConfig.name, description: siteConfig.description, images: ["/og.png"] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

const themeScript = `(function(){try{var t=localStorage.getItem('ef-theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const accountPlatformAvailable = isAccountPlatformAvailable();
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <AnalyticsProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          {accountPlatformAvailable && <Suspense fallback={null}><AuthStateBridge /></Suspense>}
          <Suspense fallback={null}><PostHogPageView /></Suspense>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
