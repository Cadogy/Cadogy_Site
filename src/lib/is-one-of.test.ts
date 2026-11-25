import { describe, expect, it } from "vitest"

import { isOneOf } from "./is-one-of"

const isColor = isOneOf(["red", "green"] as const)

describe("isOneOf", () => {
  it("accepts a value from the list", () => {
    expect(isColor("green")).toBe(true)
  })

  it("rejects anything else, including a missing value", () => {
    expect(isColor("blue")).toBe(false)
    expect(isColor(undefined)).toBe(false)
  })
})
