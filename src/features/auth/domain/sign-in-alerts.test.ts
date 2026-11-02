import { describe, expect, it } from "vitest"

import { isUnfamiliarSignIn, networkOf } from "./sign-in-alerts"

describe("networkOf", () => {
  it("groups IPv4 addresses by their /24 network", () => {
    expect(networkOf("203.0.113.7")).toBe("203.0.113")
    expect(networkOf("::ffff:203.0.113.99")).toBe("203.0.113")
  })

  it("groups IPv6 addresses by their /48 prefix", () => {
    expect(networkOf("2001:db8:abcd:12::1")).toBe("2001:db8:abcd")
  })

  it("handles missing addresses", () => {
    expect(networkOf("")).toBe("")
  })
})

describe("isUnfamiliarSignIn", () => {
  const seen = [{ device: "Chrome on Windows", network: "203.0.113" }]

  it("stays quiet for a known device on a known network", () => {
    expect(
      isUnfamiliarSignIn({
        device: "Chrome on Windows",
        network: "203.0.113",
        history: seen,
      })
    ).toBe(false)
  })

  it("alerts on a new device", () => {
    expect(
      isUnfamiliarSignIn({
        device: "Safari on iPhone",
        network: "203.0.113",
        history: seen,
      })
    ).toBe(true)
  })

  it("alerts on a known device from a new network", () => {
    expect(
      isUnfamiliarSignIn({
        device: "Chrome on Windows",
        network: "198.51.100",
        history: seen,
      })
    ).toBe(true)
  })

  it("doesn't alert on an account's very first sign-in", () => {
    expect(
      isUnfamiliarSignIn({
        device: "Safari on iPhone",
        network: "198.51.100",
        history: [],
      })
    ).toBe(false)
  })
})
