// @vitest-environment node
import { describe, expect, it } from "vitest"

import { isDuplicateKeyError, withoutId } from "./mongodb"

describe("isDuplicateKeyError", () => {
  it("recognizes MongoDB's duplicate key error", () => {
    expect(isDuplicateKeyError({ code: 11000 })).toBe(true)
  })

  it("rejects other errors and non-errors", () => {
    expect(isDuplicateKeyError({ code: 121 })).toBe(false)
    expect(isDuplicateKeyError(new Error("boom"))).toBe(false)
    expect(isDuplicateKeyError(null)).toBe(false)
  })
})

describe("withoutId", () => {
  it("drops the domain id so a document can be written under _id", () => {
    expect(withoutId({ id: "a1", name: "Retainer" })).toEqual({
      name: "Retainer",
    })
  })
})
