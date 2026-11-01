import { describe, expect, it } from "vitest"

import { readCheckoutSession } from "./stripe-events"

const paidSession = (metadata: Record<string, string>) => ({
  mode: "payment",
  payment_status: "paid",
  amount_total: 15_000,
  metadata,
})

describe("readCheckoutSession", () => {
  it("reads a single-invoice payment", () => {
    expect(readCheckoutSession(paidSession({ invoiceId: "inv_1" }))).toEqual({
      kind: "invoice",
      invoiceId: "inv_1",
      amount: 15_000,
    })
  })

  it("reads a payment covering several invoices", () => {
    expect(
      readCheckoutSession(
        paidSession({ kind: "batch", invoiceIds: "inv_1,inv_2" })
      )
    ).toEqual({ kind: "batch", invoiceIds: ["inv_1", "inv_2"], amount: 15_000 })
  })

  it("reads a completed card setup", () => {
    expect(
      readCheckoutSession({
        mode: "setup",
        payment_status: "no_payment_required",
        amount_total: null,
        metadata: { kind: "setup", clientId: "client_1" },
        setup_intent: "seti_1",
      })
    ).toEqual({ kind: "setup", clientId: "client_1", setupIntentId: "seti_1" })
  })

  it("ignores unpaid or unrecognized sessions", () => {
    expect(
      readCheckoutSession({
        ...paidSession({ invoiceId: "inv_1" }),
        payment_status: "unpaid",
      })
    ).toEqual({ kind: "ignored" })
    expect(readCheckoutSession(paidSession({}))).toEqual({ kind: "ignored" })
    expect(
      readCheckoutSession({
        mode: "setup",
        payment_status: "no_payment_required",
        amount_total: null,
        metadata: {},
      })
    ).toEqual({ kind: "ignored" })
  })
})
