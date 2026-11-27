import { describe, expect, it } from "vitest"

import {
  allowancePeriod,
  formatHours,
  inPeriod,
  isPackage,
  packageValue,
  splitHours,
} from "./packages"

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

describe("allowancePeriod", () => {
  const plan = {
    startDate: day("2026-01-31"),
    interval: "month" as const,
    anchorDay: 31,
  }

  it("finds the billing period a date falls in, following the anchor day", () => {
    expect(allowancePeriod(plan, new Date("2026-03-10T15:00:00Z"))).toEqual({
      start: day("2026-02-28"),
      until: day("2026-03-31"),
    })
  })

  it("starts a new period on the renewal day", () => {
    expect(allowancePeriod(plan, day("2026-03-31"))?.start).toEqual(
      day("2026-03-31")
    )
  })

  it("has no period before the plan starts or for one-time services", () => {
    expect(allowancePeriod(plan, day("2026-01-30"))).toBeNull()
    expect(
      allowancePeriod({ ...plan, interval: "one_time" }, day("2026-02-01"))
    ).toBeNull()
  })

  it("checks membership by day", () => {
    const period = { start: day("2026-11-15"), until: day("2026-12-15") }
    expect(inPeriod(period, new Date("2026-12-14T23:00:00Z"))).toBe(true)
    expect(inPeriod(period, day("2026-12-15"))).toBe(false)
  })
})

describe("splitHours", () => {
  it("covers what the allowance has left and bills the rest", () => {
    expect(splitHours(2.5, 1)).toEqual({ included: 1, overage: 1.5 })
    expect(splitHours(0.75, 3)).toEqual({ included: 0.75, overage: 0 })
    expect(splitHours(2, 0)).toEqual({ included: 0, overage: 2 })
  })

  it("avoids floating point leftovers", () => {
    expect(splitHours(0.3, 0.1)).toEqual({ included: 0.1, overage: 0.2 })
  })
})

describe("packageValue", () => {
  const item = (
    id: string,
    unitAmount: number,
    overrides: Record<string, unknown> = {}
  ) => ({
    id,
    pricing: "fixed",
    currency: "USD" as const,
    interval: "month" as const,
    price: { unitAmount },
    ...overrides,
  })

  it("adds up included fixed-price services on the same schedule", () => {
    const items = [
      item("hosting", 4_900),
      item("backups", 2_500),
      item("setup", 25_000, { interval: "one_time" }),
      item("support", 12_500, { pricing: "hourly" }),
      item("eur", 1_000, { currency: "EUR" }),
      item("other", 9_900),
    ]
    expect(
      packageValue(
        {
          currency: "USD",
          interval: "month",
          includedItemIds: ["hosting", "backups", "setup", "support", "eur"],
        },
        items
      )
    ).toBe(7_400)
  })
})

describe("helpers", () => {
  it("formats hours compactly", () => {
    expect(formatHours(3)).toBe("3 h")
    expect(formatHours(1.5)).toBe("1.5 h")
    expect(formatHours(0.25)).toBe("0.25 h")
  })

  it("treats a service with contents or hours as a package", () => {
    expect(isPackage({ includedItemIds: [], includedHours: null })).toBe(false)
    expect(isPackage({ includedItemIds: ["a"], includedHours: null })).toBe(
      true
    )
    expect(isPackage({ includedItemIds: [], includedHours: 2 })).toBe(true)
  })
})
