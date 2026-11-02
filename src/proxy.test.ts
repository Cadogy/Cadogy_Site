// @vitest-environment node
import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import { proxy } from "./proxy"

const SESSION_COOKIE = "cadogy.session_token=signed-token-value"

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

const passesThrough = (response: Response) =>
  response.headers.get("x-middleware-next") === "1"

describe("proxy", () => {
  it("lets public pages through", async () => {
    expect(passesThrough(await call("/who-we-are"))).toBe(true)
  })

  it.each(["/dashboard/billing", "/admin/billing/clients"])(
    "sends visitors without a session from %s to sign in and back",
    async (path) => {
      const response = await call(path)
      expect(response.status).toBe(307)
      const location = new URL(response.headers.get("location") ?? "")
      expect(location.pathname).toBe("/login")
      expect(location.searchParams.get("callbackUrl")).toBe(path)
    }
  )

  it("leaves role checks to the pages once a session cookie is present", async () => {
    const headers = { cookie: SESSION_COOKIE }
    expect(passesThrough(await call("/dashboard", { headers }))).toBe(true)
    expect(passesThrough(await call("/admin/users", { headers }))).toBe(true)
  })

  it("rejects cross-origin state-changing API calls", async () => {
    const response = await call("/api/auth/sign-in/email", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    })
    expect(response.status).toBe(403)
  })

  it("accepts same-origin state-changing API calls", async () => {
    const response = await call("/api/auth/sign-in/email", {
      method: "POST",
      headers: { origin: "https://cadogy.com" },
    })
    expect(passesThrough(response)).toBe(true)
  })

  it("exempts the Stripe webhook from the origin check", async () => {
    const response = await call("/api/webhooks/stripe", { method: "POST" })
    expect(passesThrough(response)).toBe(true)
  })

  it("lets the billing cron through to its own secret check", async () => {
    expect(passesThrough(await call("/api/cron/billing"))).toBe(true)
  })
})
