import type { NextConfig } from "next"

import { buildHeaderRules } from "./src/config/http-headers"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Uses Node APIs and its own font loading; bundling it breaks PDF output.
  serverExternalPackages: ["@react-pdf/renderer"],
  cacheComponents: true,
  partialPrefetching: false,
  cacheLife: {
    content: { stale: 300, revalidate: 3600, expire: 86400 },
  },
  images: {
    qualities: [75, 85],
    remotePatterns: [{ protocol: "https", hostname: "wp.cadogy.com" }],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "react-icons", "date-fns"],
  },
  headers: async () => buildHeaderRules(),
  redirects: async () => [
    {
      source: "/auth/verify-email",
      destination: "/verify-email",
      permanent: true,
    },
    {
      source: "/auth/reset-password",
      destination: "/reset-password",
      permanent: true,
    },
  ],
}

export default nextConfig
