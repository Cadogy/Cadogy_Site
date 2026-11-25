import { describe, expect, it } from "vitest"

import { isActivePath } from "./navigation"

describe("isActivePath", () => {
  it("matches the page itself and anything beneath it", () => {
    expect(isActivePath("/work", "/work")).toBe(true)
    expect(isActivePath("/work/playerbay", "/work")).toBe(true)
  })

  it("ignores pages that only share a prefix", () => {
    expect(isActivePath("/workshop", "/work")).toBe(false)
  })

  it("matches only the page itself when exact", () => {
    expect(isActivePath("/admin", "/admin", { exact: true })).toBe(true)
    expect(isActivePath("/admin/users", "/admin", { exact: true })).toBe(false)
  })
})
