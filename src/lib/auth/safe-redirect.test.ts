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
  ])("replaces unsafe target %s with the dashboard", (input) => {
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
