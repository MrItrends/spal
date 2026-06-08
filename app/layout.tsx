import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  icons: { icon: "/favicon.png" },
  title: "SPAL — Your AI Business Companion",
  description:
    "SPAL helps small business owners in Africa track spending, spot profits, and grow with confidence. Join the waitlist.",
  openGraph: {
    title: "SPAL — Your AI Business Companion",
    description:
      "Track spending, spot profits, and grow your business with confidence.",
    url: "https://spal.ng",
    siteName: "SPAL",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SPAL — Your AI Business Companion",
    description: "Track spending, spot profits, and grow with confidence.",
  },
  metadataBase: new URL("https://spal.ng"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Fonts */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Tailwind v4 CDN — processes utility classes browser-side */}
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" async />
        {/* @theme tokens exposed to Tailwind v4 CDN */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <style
          type="text/tailwindcss"
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes preloader-pulse {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50%       { transform: scale(1.15); opacity: 1; }
              }
              @keyframes preloader-bar {
                0%   { width: 0%; opacity: 1; }
                80%  { width: 90%; opacity: 1; }
                100% { width: 100%; opacity: 0; }
              }
              @keyframes rocket-liftoff {
                0%, 50%, 100% { transform: translateY(0px) rotate(0deg); }
                60%            { transform: translateY(-7px) rotate(-20deg); }
                75%            { transform: translateY(-4px) rotate(-10deg); }
                88%            { transform: translateY(1px) rotate(3deg); }
                95%            { transform: translateY(0px) rotate(0deg); }
              }
              .rocket-anim {
                display: inline-block;
                animation: rocket-liftoff 3.2s ease-in-out infinite;
              }

              @theme {
                --color-navy: #0F172A;
                --color-cream: #F8F7F4;
                --color-green: #22C55E;
                --color-blue: #2F63F5;
                --color-orange: #F35902;
                --color-purple: #8B5CF6;
                --color-teal: #123332;
                --color-disabled: #E4E4E7;
                --color-muted: #67738F;
                --font-sans: "Satoshi", "Inter Tight", system-ui, sans-serif;
                --font-body: "Inter Tight", system-ui, sans-serif;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
