import { describe, expect, it } from "vitest"

import { buildInvoiceDraft, buildLineItem } from "./test-factories"
import { calculateInvoiceTotals, calculateLineTotal } from "./totals"

describe("calculateLineTotal", () => {
  it("multiplies quantity by unit amount", () => {
    expect(
      calculateLineTotal(buildLineItem({ quantity: 3, unitAmount: 12_500 }))
    ).toBe(37_500)
  })

  it("rounds fractional cents half-up", () => {
    expect(
      calculateLineTotal(buildLineItem({ quantity: 1.5, unitAmount: 333 }))
    ).toBe(500)
    expect(
      calculateLineTotal(buildLineItem({ quantity: 0.25, unitAmount: 10 }))
    ).toBe(3)
  })
})

describe("calculateInvoiceTotals", () => {
  it("sums line items into the subtotal and total when there is no discount or tax", () => {
    const totals = calculateInvoiceTotals(
      buildInvoiceDraft({
        lineItems: [
          buildLineItem({ quantity: 10, unitAmount: 15_000 }),
          buildLineItem({ quantity: 1, unitAmount: 50_000 }),
        ],
      })
    )

    expect(totals).toEqual({
      subtotal: 200_000,
      discount: 0,
      tax: 0,
      total: 200_000,
      amountPaid: 0,
      credited: 0,
      refunded: 0,
      amountDue: 200_000,
    })
  })

  it("applies a percentage discount in basis points", () => {
    const totals = calculateInvoiceTotals(
      buildInvoiceDraft({
        lineItems: [buildLineItem({ quantity: 1, unitAmount: 100_000 })],
        discount: { type: "percent", value: 1_250 },
      })
    )

    expect(totals.discount).toBe(12_500)
    expect(totals.total).toBe(87_500)
  })

  it("applies a fixed discount and never discounts below zero", () => {
    const fixed = calculateInvoiceTotals(
      buildInvoiceDraft({
        lineItems: [buildLineItem({ quantity: 1, unitAmount: 10_000 })],
        discount: { type: "amount", value: 2_500 },
      })
    )
    const capped = calculateInvoiceTotals(
      buildInvoiceDraft({
        lineItems: [buildLineItem({ quantity: 1, unitAmount: 10_000 })],
        discount: { type: "amount", value: 99_999 },
      })
    )

    expect(fixed.total).toBe(7_500)
    expect(capped.discount).toBe(10_000)
    expect(capped.total).toBe(0)
  })

  it("taxes the discounted subtotal, rounding half-up", () => {
    const totals = calculateInvoiceTotals(
      buildInvoiceDraft({
        lineItems: [buildLineItem({ quantity: 1, unitAmount: 10_005 })],
        discount: { type: "amount", value: 5 },
        taxRateBps: 700,
      })
    )

    expect(totals.tax).toBe(700)
    expect(totals.total).toBe(10_700)
  })

  it("derives the amount due from recorded payments and never goes negative", () => {
    const partial = calculateInvoiceTotals(
      buildInvoiceDraft({
        lineItems: [buildLineItem({ quantity: 1, unitAmount: 50_000 })],
        payments: [{ amount: 20_000 }],
      })
    )
    const over = calculateInvoiceTotals(
      buildInvoiceDraft({
        lineItems: [buildLineItem({ quantity: 1, unitAmount: 50_000 })],
        payments: [{ amount: 30_000 }, { amount: 30_000 }],
      })
    )

    expect(partial.amountPaid).toBe(20_000)
    expect(partial.amountDue).toBe(30_000)
    expect(over.amountDue).toBe(0)
  })

  it("returns zeros for an empty draft", () => {
    expect(
      calculateInvoiceTotals(buildInvoiceDraft({ lineItems: [] })).total
    ).toBe(0)
  })
})
