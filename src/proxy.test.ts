// @vitest-environment node
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getToken = vi.fn()
vi.mock("next-auth/jwt", () => ({
  getToken: (...args: unknown[]) => getToken(...args),
}))

const { proxy } = await import("./proxy")

const call = (
  path: string,
  init?: { method?: string; headers?: Record<string, string> }
) =>
  proxy(
    new NextRequest(`https://cadogy.com${path}`, {
      method: init?.method ?? "GET",
      headers: init?.headers,
    })
  )

const signedInAs = (role: "user" | "admin" | null) =>
  getToken.mockResolvedValue(role ? { sub: "u1", role } : null)

describe("proxy", () => {
  beforeEach(() => {
    getToken.mockReset()
  })

  it("lets public pages through without a session lookup", async () => {
    const response = await call("/who-we-are")
    expect(response.headers.get("x-middleware-next")).toBe("1")
    expect(getToken).not.toHaveBeenCalled()
  })

  it("redirects anonymous visitors from the portal to login with a return path", async () => {
    signedInAs(null)
    const response = await call("/dashboard/invoices")
    expect(response.status).toBe(307)
    const location = new URL(response.headers.get("location") ?? "")
    expect(location.pathname).toBe("/login")
    expect(location.searchParams.get("callbackUrl")).toBe("/dashboard/invoices")
  })

  it("keeps non-admins out of the admin area", async () => {
    signedInAs("user")
    const response = await call("/admin/billing")
    expect(response.status).toBe(307)
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
      "/dashboard"
    )
  })

  it("lets admins into the admin area", async () => {
    signedInAs("admin")
    const response = await call("/admin/billing")
    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it("answers 401 JSON for anonymous calls to session APIs", async () => {
    signedInAs(null)
    const response = await call("/api/dashboard/tickets")
    expect(response.status).toBe(401)
  })

  it("answers 403 for non-admin calls to admin APIs", async () => {
    signedInAs("user")
    const response = await call("/api/admin/invoices")
    expect(response.status).toBe(403)
  })

  it("rejects cross-origin state-changing API calls", async () => {
    const response = await call("/api/contact", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    })
    expect(response.status).toBe(403)
  })

  it("accepts same-origin state-changing API calls", async () => {
    const response = await call("/api/contact", {
      method: "POST",
      headers: { origin: "https://cadogy.com" },
    })
    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it("exempts the Stripe webhook from the origin check", async () => {
    const response = await call("/api/webhooks/stripe", { method: "POST" })
    expect(response.headers.get("x-middleware-next")).toBe("1")
  })
})
