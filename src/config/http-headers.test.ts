// @vitest-environment node
import { describe, expect, it } from "vitest"

import { buildHeaderRules } from "./http-headers"

const headersFor = (source: string) =>
  buildHeaderRules().find((rule) => rule.source === source)?.headers ?? []

const valueOf = (source: string, key: string) =>
  headersFor(source).find((header) => header.key === key)?.value

describe("security headers", () => {
  it("applies baseline hardening headers to every route", () => {
    expect(valueOf("/:path*", "X-Frame-Options")).toBe("DENY")
    expect(valueOf("/:path*", "X-Content-Type-Options")).toBe("nosniff")
    expect(valueOf("/:path*", "Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    )
  })

  it("denies powerful browser features by default", () => {
    const policy = valueOf("/:path*", "Permissions-Policy")
    expect(policy).toContain("camera=()")
    expect(policy).toContain("microphone=()")
    expect(policy).toContain("geolocation=()")
    expect(policy).toContain("payment=()")
  })

  it("rolls out the content security policy in report-only mode", () => {
    const csp = valueOf("/:path*", "Content-Security-Policy-Report-Only")
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("https://challenges.cloudflare.com")
    expect(csp).toContain("https://checkout.stripe.com")
    expect(valueOf("/:path*", "Content-Security-Policy")).toBeUndefined()
  })
})

describe("cache tiers", () => {
  it("never sets no-store on every route", () => {
    expect(valueOf("/:path*", "Cache-Control")).toBeUndefined()
  })

  it("leaves fingerprinted asset caching to Next.js", () => {
    expect(headersFor("/_next/static/:path*")).toEqual([])
  })

  it("keeps APIs out of shared caches", () => {
    expect(valueOf("/api/:path*", "Cache-Control")).toBe("no-store")
  })

  it.each(["/dashboard/:path*", "/admin/:path*", "/invoice/:path*"])(
    "keeps private surface %s out of every cache",
    (source) => {
      expect(valueOf(source, "Cache-Control")).toBe("private, no-store")
      expect(valueOf(source, "X-Robots-Tag")).toBe("noindex, nofollow")
    }
  )
})
