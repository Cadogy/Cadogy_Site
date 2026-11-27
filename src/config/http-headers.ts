import { SIGNED_IN_AREAS } from "./signed-in-areas"

type Header = { readonly key: string; readonly value: string }
type HeaderRule = { readonly source: string; readonly headers: Header[] }

const PRIVATE_SURFACES = [
  ...SIGNED_IN_AREAS.map((area) => `${area}/:path*`),
  "/invoice/:path*",
]

/**
 * Enforced: rules that can't break a script, so they're safe to apply now.
 * They stop framing, <base> hijacking, plugins and forms posting elsewhere.
 */
const enforcedPolicy = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self' https://checkout.stripe.com",
].join("; ")

/**
 * Reported only, for now: a client bundle on /contact still evaluates
 * strings as code, which an enforced script-src without 'unsafe-eval' would
 * block. Cloudflare injects its Web Analytics beacon, so that's allowed.
 */
const reportedPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com https://*.cadogy.com https://cloudflareinsights.com",
  "frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com",
  enforcedPolicy,
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
  { key: "Content-Security-Policy", value: enforcedPolicy },
  { key: "Content-Security-Policy-Report-Only", value: reportedPolicy },
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
