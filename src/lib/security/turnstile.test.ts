// @vitest-environment node
import { describe, expect, it, vi } from "vitest"

import { createTurnstileVerifier } from "./turnstile"

const respond = (success: boolean) =>
  vi.fn(async () => new Response(JSON.stringify({ success }), { status: 200 }))

describe("createTurnstileVerifier", () => {
  it("accepts tokens Cloudflare confirms", async () => {
    const fetcher = respond(true)
    const verify = createTurnstileVerifier({
      secret: "secret",
      environment: "production",
      fetcher,
    })

    expect(await verify("token", "203.0.113.1")).toBe(true)
    const [, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    const body = init.body as FormData
    expect(body.get("remoteip")).toBe("203.0.113.1")
  })

  it("rejects tokens Cloudflare refuses", async () => {
    const verify = createTurnstileVerifier({
      secret: "secret",
      environment: "production",
      fetcher: respond(false),
    })
    expect(await verify("token", "203.0.113.1")).toBe(false)
  })

  it("never honours a bypass token in production", async () => {
    const fetcher = respond(false)
    const verify = createTurnstileVerifier({
      secret: "secret",
      environment: "production",
      fetcher,
    })
    expect(await verify("development_bypass_token", "203.0.113.1")).toBe(false)
  })

  it("fails closed in production when no secret is configured", async () => {
    const fetcher = respond(true)
    const verify = createTurnstileVerifier({
      secret: undefined,
      environment: "production",
      fetcher,
    })
    expect(await verify("token", "203.0.113.1")).toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("fails closed when Cloudflare is unreachable", async () => {
    const verify = createTurnstileVerifier({
      secret: "secret",
      environment: "production",
      fetcher: vi.fn(async () => {
        throw new Error("network")
      }),
    })
    expect(await verify("token", "203.0.113.1")).toBe(false)
  })

  it("skips verification only in local development without a secret", async () => {
    const verify = createTurnstileVerifier({
      secret: undefined,
      environment: "development",
      fetcher: respond(false),
    })
    expect(await verify("", "127.0.0.1")).toBe(true)
  })
})
