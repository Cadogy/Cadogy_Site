import { describe, expect, it } from "vitest"

import { readCheckoutSession, readMoneyEvent } from "./stripe-events"

const paidSession = (metadata: Record<string, string>) => ({
  mode: "payment",
  payment_status: "paid",
  amount_total: 15_000,
  metadata,
})

describe("readCheckoutSession", () => {
  it("reads a single-invoice payment", () => {
    expect(
      readCheckoutSession({
        ...paidSession({ invoiceId: "inv_1" }),
        payment_intent: "pi_1",
      })
    ).toEqual({
      kind: "invoice",
      invoiceId: "inv_1",
      amount: 15_000,
      paymentIntentId: "pi_1",
    })
  })

  it("reads a payment covering several invoices", () => {
    expect(
      readCheckoutSession(
        paidSession({ kind: "batch", invoiceIds: "inv_1,inv_2" })
      )
    ).toEqual({
      kind: "batch",
      invoiceIds: ["inv_1", "inv_2"],
      amount: 15_000,
      paymentIntentId: undefined,
    })
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

describe("readMoneyEvent", () => {
  it("reads refunds, including ones made in the Stripe dashboard", () => {
    expect(
      readMoneyEvent({
        type: "refund.created",
        data: { object: { id: "re_1", amount: 4_000, payment_intent: "pi_1", status: "succeeded" } },
      })
    ).toEqual({ kind: "refund", refundId: "re_1", amount: 4_000, paymentIntentId: "pi_1" })
  })

  it("ignores refunds that failed or have no payment", () => {
    expect(
      readMoneyEvent({
        type: "refund.created",
        data: { object: { id: "re_1", amount: 4_000, payment_intent: "pi_1", status: "failed" } },
      })
    ).toEqual({ kind: "ignored" })
    expect(
      readMoneyEvent({
        type: "refund.created",
        data: { object: { id: "re_1", amount: 4_000, payment_intent: null, status: "succeeded" } },
      })
    ).toEqual({ kind: "ignored" })
  })

  it("reads disputes opening and closing", () => {
    const dispute = (status: string) => ({
      id: "dp_1",
      amount: 10_000,
      payment_intent: { id: "pi_1" },
      status,
    })
    expect(
      readMoneyEvent({ type: "charge.dispute.created", data: { object: dispute("needs_response") } })
    ).toEqual({ kind: "dispute_opened", disputeId: "dp_1", amount: 10_000, paymentIntentId: "pi_1" })
    expect(
      readMoneyEvent({ type: "charge.dispute.closed", data: { object: dispute("lost") } })
    ).toEqual({ kind: "dispute_closed", disputeId: "dp_1", amount: 10_000, paymentIntentId: "pi_1", won: false })
    expect(
      readMoneyEvent({ type: "charge.dispute.closed", data: { object: dispute("won") } })
    ).toMatchObject({ won: true })
  })

  it("ignores other events", () => {
    expect(readMoneyEvent({ type: "customer.created", data: { object: {} } })).toEqual({
      kind: "ignored",
    })
  })
})

