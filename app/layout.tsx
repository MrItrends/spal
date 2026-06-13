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
      {/*
        Desktop shell: body = full-viewport dark canvas.
        #app-root is capped at 480 px and centred.
        transform: translateZ(0) creates a new stacking context so every
        position:fixed child is contained by this element, not the viewport —
        keeping all overlays, sheets, and nav inside the mobile frame on desktop.
      */}
      <body className="h-full overflow-hidden antialiased" style={{ background: "#06090F" }}>
        {/* Registers /sw.js in production for PWA / offline support */}
        <RegisterSW />
        <div
          id="app-root"
          className="h-full flex flex-col overflow-hidden bg-spal-bg mx-auto relative"
          style={{
            maxWidth: 480,
            transform: "translateZ(0)",   // new stacking context — contains fixed children
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 0 80px rgba(0,0,0,0.8)",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
