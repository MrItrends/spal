import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets Next transpile @spal/core's TypeScript source directly (workspace
  // package, no separate build step) — see packages/core.
  transpilePackages: ["@spal/core"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options",        value: "DENY" },
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
