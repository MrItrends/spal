import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import { RegisterSW } from "@/components/shared/RegisterSW";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SPAL — Your Business Companion",
  description:
    "Track your sales, understand your profit, and grow your business with simple AI-powered insights.",
  manifest: "/manifest.json",
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
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} h-full`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
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
