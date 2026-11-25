import { describe, expect, it } from "vitest"
import { z } from "zod"

import { optionValues } from "./option-values"

const SIZES = [
  { value: "small", label: "Small" },
  { value: "large", label: "Large" },
] as const

describe("optionValues", () => {
  it("lists the values of a set of options, ready for a schema", () => {
    const size = z.enum(optionValues(SIZES))

    expect(optionValues(SIZES)).toEqual(["small", "large"])
    expect(size.safeParse("large").success).toBe(true)
    expect(size.safeParse("medium").success).toBe(false)
  })
})
