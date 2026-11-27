import { describe, expect, it } from "vitest"

import { safeCallbackPath } from "./safe-redirect"

describe("safeCallbackPath", () => {
  it.each([
    ["/dashboard/invoices", "/dashboard/invoices"],
    ["/admin/billing?status=open", "/admin/billing?status=open"],
  ])("keeps same-site path %s", (input, expected) => {
    expect(safeCallbackPath(input)).toBe(expected)
  })

  it.each([
    "https://evil.example/phish",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "dashboard",
    "",
    null,
    // Browsers strip tabs and newlines, turning these into "//evil.example".
    "/\t/evil.example",
    "/\n/evil.example",
    "/\r\n/evil.example",
    "/\\/evil.example",
    "/x\\..\\..\\evil.example",
    "https://cadogy.com.evil.example/phish",
  ])("replaces unsafe target %j with the dashboard", (input) => {
    expect(safeCallbackPath(input)).toBe("/dashboard")
  })

  it("normalises absolute URLs on our own origin to a path", () => {
    expect(
      safeCallbackPath(
        "https://cadogy.com/dashboard/tickets",
        "https://cadogy.com"
      )
    ).toBe("/dashboard/tickets")
  })
})

describe("safeCallbackPath edge cases", () => {
  it("rejects look-alike origins", () => {
    expect(
      safeCallbackPath(
        "https://cadogy.com.evil.example/x",
        "https://cadogy.com"
      )
    ).toBe("/dashboard")
  })

  it("keeps query strings and fragments on our own paths", () => {
    expect(safeCallbackPath("/dashboard/tickets?category=billing#new")).toBe(
      "/dashboard/tickets?category=billing#new"
    )
  })

  it("treats percent-encoded characters as part of the path", () => {
    expect(safeCallbackPath("/%09/evil.example")).toBe("/%09/evil.example")
  })
})
