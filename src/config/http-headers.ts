type Header = { readonly key: string; readonly value: string }
type HeaderRule = { readonly source: string; readonly headers: Header[] }

const PRIVATE_SURFACES = [
  "/dashboard/:path*",
  "/admin/:path*",
  "/invoice/:path*",
]

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com https://*.cadogy.com",
  "frame-src https://challenges.cloudflare.com",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ")

const permissionsPolicy = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "interest-cohort=()",
].join(", ")

const securityHeaders: Header[] = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: permissionsPolicy },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
]

const privateHeaders: Header[] = [
  { key: "Cache-Control", value: "private, no-store" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
]

export const buildHeaderRules = (): HeaderRule[] => [
  { source: "/:path*", headers: securityHeaders },
  {
    source: "/api/:path*",
    headers: [{ key: "Cache-Control", value: "no-store" }],
  },
  ...PRIVATE_SURFACES.map((source) => ({ source, headers: privateHeaders })),
]
