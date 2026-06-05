import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import { RegisterSW } from "@/components/shared/RegisterSW";
import "./globals.css";

// Inter Tight — secondary/body typeface (Google Fonts, self-hosted by Next.js)
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SPAL — Your Business Companion",
  description:
    "Track your sales, understand your profit, and grow your business with simple AI-powered insights.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SPAL",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "SPAL Business Assistant",
    description: "Your AI business companion for everyday entrepreneurs.",
    siteName: "SPAL",
  },
};

export const viewport: Viewport = {
  themeColor: "#22C55E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interTight.variable} h-full`}>
      <head>
        {/* Satoshi — primary brand typeface via Fontshare CDN */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SPAL" />
      </head>
      <body className="h-full overflow-hidden bg-spal-bg antialiased">
        {/* Registers /sw.js in production for PWA / offline support */}
        <RegisterSW />
        <div id="app-root" className="h-full flex flex-col overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
