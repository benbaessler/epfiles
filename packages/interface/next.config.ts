import type { NextConfig } from "next";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from root .env file
config({ path: resolve(__dirname, "../../.env") });

// Backend URL for CSP connect-src (direct API calls)
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.epfiles.ai https://challenges.cloudflare.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            `connect-src 'self' ${backendUrl} https://*.clerk.accounts.dev https://clerk.epfiles.ai https://*.posthog.com https://us.i.posthog.com https://api.x.ai wss://*.clerk.accounts.dev wss://clerk.epfiles.ai`,
            "frame-src 'self' https://*.clerk.accounts.dev https://clerk.epfiles.ai https://challenges.cloudflare.com",
            "worker-src 'self' blob:",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
