import { describe, expect, it } from "vitest"

import {
  addInterval,
  chargeDescription,
  dueCharges,
  type AddOn,
} from "./recurring"

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

const addOn = (overrides: Partial<AddOn> = {}): AddOn => ({
  id: "addon_1",
  clientId: "client_1",
  name: "Business email",
  unitAmount: 800,
  quantity: 1,
  currency: "USD",
  interval: "month",
  anchorDay: 1,
  nextBillingDate: day("2026-11-01"),
  status: "active",
  ...overrides,
})

describe("addInterval", () => {
  it("advances by calendar months, quarters and years", () => {
    expect(addInterval(day("2026-11-01"), "month", 1)).toEqual(
      day("2026-12-01")
    )
    expect(addInterval(day("2026-11-15"), "quarter", 15)).toEqual(
      day("2027-02-15")
    )
    expect(addInterval(day("2026-11-15"), "year", 15)).toEqual(
      day("2027-11-15")
    )
  })

  it("clamps to the end of short months and returns to the anchor day", () => {
    const feb = addInterval(day("2027-01-31"), "month", 31)
    expect(feb).toEqual(day("2027-02-28"))
    expect(addInterval(feb, "month", 31)).toEqual(day("2027-03-31"))
    expect(addInterval(day("2028-01-31"), "month", 31)).toEqual(
      day("2028-02-29")
    )
  })
})

describe("dueCharges", () => {
  it("bills the current period when the billing date arrives", () => {
    const { charges, nextBillingDate } = dueCharges(addOn(), day("2026-11-01"))

    expect(charges).toEqual([
      {
        addOnId: "addon_1",
        clientId: "client_1",
        description: "Business email (Nov 1 – Nov 30, 2026)",
        quantity: 1,
        unitAmount: 800,
        currency: "USD",
        periodStart: day("2026-11-01"),
        periodEnd: day("2026-11-30"),
      },
    ])
    expect(nextBillingDate).toEqual(day("2026-12-01"))
  })

  it("does nothing before the billing date", () => {
    expect(dueCharges(addOn(), day("2026-10-31"))).toEqual({
      charges: [],
      nextBillingDate: day("2026-11-01"),
      completed: false,
    })
  })

  it("catches up every missed period, oldest first", () => {
    const { charges, nextBillingDate } = dueCharges(addOn(), day("2027-01-05"))
    expect(charges.map((charge) => charge.periodStart)).toEqual([
      day("2026-11-01"),
      day("2026-12-01"),
      day("2027-01-01"),
    ])
    expect(nextBillingDate).toEqual(day("2027-02-01"))
  })

  it.each(["paused", "canceled"] as const)(
    "never bills a %s add-on",
    (status) => {
      expect(dueCharges(addOn({ status }), day("2027-06-01")).charges).toEqual(
        []
      )
    }
  )

  it("bills a one-time add-on exactly once and then completes it", () => {
    const result = dueCharges(
      addOn({ interval: "one_time", name: "Domain setup", quantity: 2 }),
      day("2026-12-01")
    )
    expect(result.charges).toHaveLength(1)
    expect(result.charges[0]?.description).toBe("Domain setup × 2")
    expect(result.completed).toBe(true)
  })
})

describe("chargeDescription", () => {
  it("shows quantity only when it is more than one", () => {
    expect(
      chargeDescription({
        name: "Business email",
        quantity: 5,
        periodStart: day("2026-11-01"),
        periodEnd: day("2026-11-30"),
      })
    ).toBe("Business email × 5 (Nov 1 – Nov 30, 2026)")
  })

  it("spells out both years when a period crosses the new year", () => {
    expect(
      chargeDescription({
        name: "Hosting",
        quantity: 1,
        periodStart: day("2026-12-15"),
        periodEnd: day("2027-03-14"),
      })
    ).toBe("Hosting (Dec 15, 2026 – Mar 14, 2027)")
  })
})
