import { describe, expect, it } from "vitest"

import { describeDevice, displayIp } from "./devices"

describe("describeDevice", () => {
  it.each([
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
      "Chrome on Windows",
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0",
      "Edge on Windows",
    ],
    [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
      "Safari on macOS",
    ],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
      "Safari on iPhone",
    ],
    [
      "Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
      "Chrome on Android",
    ],
    [
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0",
      "Firefox on Linux",
    ],
  ])("names %s", (userAgent, expected) => {
    expect(describeDevice(userAgent)).toBe(expected)
  })

  it("falls back gracefully", () => {
    expect(describeDevice("")).toBe("Unknown device")
    expect(describeDevice(null)).toBe("Unknown device")
    expect(describeDevice("curl/8.9.1")).toBe("Unknown browser")
  })
})

describe("displayIp", () => {
  it("shows IPv4 addresses written in IPv6 form as plain IPv4", () => {
    expect(displayIp("::ffff:203.0.113.7")).toBe("203.0.113.7")
  })

  it("leaves other addresses alone and handles missing ones", () => {
    expect(displayIp("2001:db8::1")).toBe("2001:db8::1")
    expect(displayIp("203.0.113.7")).toBe("203.0.113.7")
    expect(displayIp(null)).toBe("")
  })
})
