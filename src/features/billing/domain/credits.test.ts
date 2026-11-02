import { describe, expect, it } from "vitest"

import { applyCreditNote, needsOwnerApproval, refundableAmount } from "./credits"
import type { Invoice } from "./invoice"
import { buildLineItem } from "./test-factories"
import { calculateInvoiceTotals } from "./totals"

const AT = new Date("2026-11-02T12:00:00.000Z")
const actor = { actorId: "admin-1", at: AT }

const invoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: "inv_1",
  number: "INV-2026-0001",
  clientId: "client_1",
  clientSnapshot: null,
  status: "open",
  currency: "USD",
  issueDate: AT,
  dueDate: AT,
  termsDays: 15,
  lineItems: [buildLineItem({ quantity: 1, unitAmount: 10_000 })],
  discount: null,
  taxRateBps: 0,
  memo: "",
  footer: "",
  internalNotes: "",
  payments: [],
  adjustments: [],
  events: [],
  publicToken: "tok",
  ...overrides,
})

const stripePayment = (amount: number) => ({
  amount,
  method: "stripe" as const,
  reference: "pi_1",
  paidAt: AT,
  stripeEventId: "evt_1",
  stripePaymentIntentId: "pi_1",
})

const note = (kind: "refund" | "invoice_credit", amount: number) => ({
  creditNoteId: "cn_1",
  number: "CN-2026-0001",
  kind,
  amount,
})

describe("invoice totals with credit notes", () => {
  it("reduces what's owed by credits on an open invoice", () => {
    const totals = calculateInvoiceTotals(
      invoice({ adjustments: [note("invoice_credit", 2_500)] })
    )
    expect(totals).toMatchObject({ credited: 2_500, refunded: 0, amountDue: 7_500 })
  })

  it("keeps a refunded paid invoice settled", () => {
    const totals = calculateInvoiceTotals(
      invoice({
        status: "paid",
        payments: [stripePayment(10_000)],
        adjustments: [note("refund", 4_000)],
      })
    )
    expect(totals).toMatchObject({ amountPaid: 10_000, refunded: 4_000, amountDue: 0 })
  })
})

describe("applyCreditNote", () => {
  it("credits an open invoice and settles it when nothing is left", () => {
    const partial = applyCreditNote(invoice(), note("invoice_credit", 4_000), actor)
    expect(partial).toMatchObject({ ok: true, value: { status: "open" } })

    const full = applyCreditNote(invoice(), note("invoice_credit", 10_000), actor)
    expect(full).toMatchObject({ ok: true, value: { status: "paid" } })
    expect(full.ok && full.value.events.map((event) => event.type)).toEqual([
      "credited",
      "paid",
    ])
  })

  it("never credits more than is owed", () => {
    expect(
      applyCreditNote(invoice(), note("invoice_credit", 10_001), actor)
    ).toEqual({ ok: false, error: "A credit can't be more than the $100.00 still owed." })
  })

  it("refunds card payments up to what's left to refund", () => {
    const paid = invoice({ status: "paid", payments: [stripePayment(10_000)] })
    const first = applyCreditNote(paid, note("refund", 6_000), actor)
    expect(first).toMatchObject({ ok: true, value: { status: "paid" } })
    if (!first.ok) return
    expect(refundableAmount(first.value)).toBe(4_000)
    expect(applyCreditNote(first.value, note("refund", 4_001), actor)).toEqual({
      ok: false,
      error: "Only $40.00 of card payments can still be refunded.",
    })
  })

  it("only refunds card payments made through Stripe", () => {
    const paidByTransfer = invoice({
      status: "paid",
      payments: [{ amount: 10_000, method: "bank_transfer", reference: "", paidAt: AT }],
    })
    expect(refundableAmount(paidByTransfer)).toBe(0)
    expect(applyCreditNote(paidByTransfer, note("refund", 100), actor)).toMatchObject({
      ok: false,
    })
  })

  it("doesn't touch drafts or voided invoices", () => {
    for (const status of ["draft", "void"] as const)
      expect(
        applyCreditNote(invoice({ status }), note("invoice_credit", 100), actor)
      ).toEqual({ ok: false, error: "Credit notes only apply to issued invoices." })
  })
})

describe("needsOwnerApproval", () => {
  it("lets staff issue credit notes up to $1,000 and sends larger ones to the owner", () => {
    expect(needsOwnerApproval(100_000)).toBe(false)
    expect(needsOwnerApproval(100_001)).toBe(true)
  })
})
