// @vitest-environment node
import { describe, expect, it } from "vitest"

import { isSameOriginRequest } from "./request-origin"

const request = (headers: Record<string, string>) => ({
  method: "POST",
  url: "https://cadogy.com/api/contact",
  headers: new Headers(headers),
})

describe("isSameOriginRequest", () => {
  it("accepts a matching Origin header", () => {
    expect(isSameOriginRequest(request({ origin: "https://cadogy.com" }))).toBe(
      true
    )
  })

  it("rejects a foreign Origin header", () => {
    expect(
      isSameOriginRequest(request({ origin: "https://evil.example" }))
    ).toBe(false)
  })

  it("falls back to the Referer when Origin is absent", () => {
    expect(
      isSameOriginRequest(request({ referer: "https://cadogy.com/contact" }))
    ).toBe(true)
    expect(
      isSameOriginRequest(request({ referer: "https://evil.example/x" }))
    ).toBe(false)
  })

  it("fails closed when neither header is present", () => {
    expect(isSameOriginRequest(request({}))).toBe(false)
  })

  it("rejects an unparseable Referer", () => {
    expect(isSameOriginRequest(request({ referer: "not a url" }))).toBe(false)
  })

  it("treats the literal null origin as foreign", () => {
    expect(isSameOriginRequest(request({ origin: "null" }))).toBe(false)
  })
})
