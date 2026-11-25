// @vitest-environment node
import { describe, expect, it } from "vitest"

import { clientContext } from "./request-context"

describe("clientContext", () => {
  it("takes the first address the proxy forwarded and the user agent", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      "x-real-ip": "10.0.0.2",
      "user-agent": "Firefox",
    })

    expect(clientContext(headers)).toEqual({
      ip: "203.0.113.7",
      userAgent: "Firefox",
    })
  })

  it("falls back to the real IP header", () => {
    expect(clientContext(new Headers({ "x-real-ip": "198.51.100.4" })).ip).toBe(
      "198.51.100.4"
    )
  })

  it("leaves both blank when the request carries neither", () => {
    expect(clientContext(new Headers())).toEqual({ ip: "", userAgent: "" })
    expect(clientContext(undefined)).toEqual({ ip: "", userAgent: "" })
  })
})
