import { describe, expect, it } from "vitest"

import {
  clientInputSchema,
  invoiceDraftInputSchema,
  lineItemSchema,
} from "./schema"

describe("lineItemSchema", () => {
  it("accepts quantities with up to two decimals", () => {
    expect(
      lineItemSchema.safeParse({
        description: "Design",
        quantity: 2.75,
        unitAmount: 100,
      }).success
    ).toBe(true)
  })

  it("rejects quantities with more precision than a cent can carry", () => {
    expect(
      lineItemSchema.safeParse({
        description: "Design",
        quantity: 1.333,
        unitAmount: 100,
      }).success
    ).toBe(false)
  })

  it("rejects negative and fractional unit amounts", () => {
    const base = { description: "Design", quantity: 1 }
    expect(lineItemSchema.safeParse({ ...base, unitAmount: -1 }).success).toBe(
      false
    )
    expect(lineItemSchema.safeParse({ ...base, unitAmount: 1.5 }).success).toBe(
      false
    )
  })
})

describe("invoiceDraftInputSchema", () => {
  const base = { clientId: "c1", currency: "USD", termsDays: 15, lineItems: [] }

  it("caps percentage discounts at 100%", () => {
    expect(
      invoiceDraftInputSchema.safeParse({
        ...base,
        discount: { type: "percent", value: 10_001 },
      }).success
    ).toBe(false)
  })

  it("rejects unsupported currencies", () => {
    expect(
      invoiceDraftInputSchema.safeParse({ ...base, currency: "BTC" }).success
    ).toBe(false)
  })
})

describe("clientInputSchema", () => {
  it("normalises emails and fills sensible defaults", () => {
    const parsed = clientInputSchema.parse({
      name: "Ada",
      email: " Ada@Example.COM ",
    })
    expect(parsed.email).toBe("ada@example.com")
    expect(parsed.currency).toBe("USD")
    expect(parsed.defaultTermsDays).toBe(15)
  })
})
