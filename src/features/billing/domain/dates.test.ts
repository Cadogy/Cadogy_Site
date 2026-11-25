import { describe, expect, it } from "vitest"

import { addDays, isoDay, startOfUtcDay } from "./dates"

describe("billing dates", () => {
  it("adds whole days in UTC", () => {
    expect(addDays(new Date("2026-02-27T10:00:00Z"), 2)).toEqual(
      new Date("2026-03-01T10:00:00Z")
    )
  })

  it("rounds a moment down to midnight UTC", () => {
    expect(startOfUtcDay(new Date("2026-11-24T23:59:59Z"))).toEqual(
      new Date("2026-11-24T00:00:00Z")
    )
  })

  it("writes a day as YYYY-MM-DD for date inputs", () => {
    expect(isoDay(new Date("2026-11-24T23:59:59Z"))).toBe("2026-11-24")
  })
})
