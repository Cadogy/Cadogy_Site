import { describe, expect, it } from "vitest"

import { buildLineItem } from "../domain/test-factories"
import { calculateInvoiceTotals } from "../domain/totals"
import { createBillingService } from "./billing-service"
import {
  createCredits,
  type CreditNote,
  type CreditNoteRepository,
} from "./credits"
import {
  createInMemoryBillingRepository,
  createRecordingNotifier,
} from "./test-doubles"

const ADMIN = "admin-1"
const NOW = new Date("2026-11-02T12:00:00.000Z")

const createInMemoryCreditNotes = (): CreditNoteRepository => {
  const notes: CreditNote[] = []
  return {
    insert: async (note) => {
      const stored = { ...note, id: `cn_${notes.length + 1}` }
      notes.push(stored)
      return stored
    },
    list: async ({ clientId, invoiceId }) =>
      notes.filter(
        (note) =>
          (!clientId || note.clientId === clientId) &&
          (!invoiceId || note.invoiceId === invoiceId)
      ),
    findByStripeRefundId: async (refundId) =>
      notes.find((note) => note.stripeRefundId === refundId) ?? null,
  }
}

const setup = (refund: "ok" | "declined" = "ok") => {
  const repository = createInMemoryBillingRepository()
  const notifier = createRecordingNotifier()
  const refunds: { paymentIntentId: string; amount: number; key: string }[] = []
  let tokens = 0
  const billing = createBillingService({
    repository,
    notifier,
    clock: () => NOW,
    generateToken: () => `tok_${++tokens}`,
  })
  const credits = createCredits({
    billing,
    billingRepository: repository,
    repository: createInMemoryCreditNotes(),
    clock: () => NOW,
    gateway: {
      refund: async ({ paymentIntentId, amount, idempotencyKey }) => {
        refunds.push({ paymentIntentId, amount, key: idempotencyKey })
        return refund === "ok"
          ? { ok: true, refundId: `re_${refunds.length}` }
          : { ok: false, error: "charge_already_refunded" }
      },
    },
  })
  return { billing, credits, refunds, notifier }
}

const expectOk = <T>(
  result: { ok: true; value: T } | { ok: false; error: string }
) => {
  if (!result.ok) throw new Error(result.error)
  return result.value
}

const openInvoice = async (
  billing: ReturnType<typeof setup>["billing"],
  unitAmount = 10_000
) => {
  const client = expectOk(
    await billing.createClient({
      name: "Ada",
      email: "ada@acme.example",
      company: "Acme",
    })
  )
  const draft = expectOk(
    await billing.createDraft(
      {
        clientId: client.id,
        lineItems: [buildLineItem({ quantity: 1, unitAmount })],
      },
      ADMIN
    )
  )
  return { client, invoice: expectOk(await billing.issue(draft.id, ADMIN)) }
}

const paidByCard = async (billing: ReturnType<typeof setup>["billing"]) => {
  const { client, invoice } = await openInvoice(billing)
  expectOk(
    await billing.recordStripePayment({
      invoiceId: invoice.id,
      amount: 10_000,
      eventId: "evt_1",
      paidAt: NOW,
      paymentIntentId: "pi_1",
    })
  )
  return { client, invoiceId: invoice.id }
}

describe("credits and refunds", () => {
  it("credits an open invoice with a numbered credit note", async () => {
    const { billing, credits } = setup()
    const { invoice } = await openInvoice(billing)

    const note = expectOk(
      await credits.creditInvoice(
        { invoiceId: invoice.id, amount: 2_500, reason: "Late delivery" },
        ADMIN
      )
    )

    expect(note).toMatchObject({
      number: "CN-2026-0001",
      kind: "invoice_credit",
      amount: 2_500,
    })
    const updated = await billing.getInvoice(invoice.id)
    expect(updated && calculateInvoiceTotals(updated).amountDue).toBe(7_500)
  })

  it("refunds a card payment through Stripe, then records it", async () => {
    const { billing, credits, refunds } = setup()
    const { invoiceId } = await paidByCard(billing)

    const note = expectOk(
      await credits.refundInvoice(
        { invoiceId, amount: 4_000, reason: "Goodwill" },
        ADMIN
      )
    )

    expect(refunds).toEqual([
      {
        paymentIntentId: "pi_1",
        amount: 4_000,
        key: `refund:${invoiceId}:pi_1:0:4000`,
      },
    ])
    expect(note).toMatchObject({ kind: "refund", stripeRefundId: "re_1" })
    const updated = await billing.getInvoice(invoiceId)
    expect(updated?.status).toBe("paid")
    expect(updated && calculateInvoiceTotals(updated).refunded).toBe(4_000)
  })

  it("records nothing when Stripe declines the refund", async () => {
    const { billing, credits } = setup("declined")
    const { invoiceId } = await paidByCard(billing)

    expect(
      await credits.refundInvoice(
        { invoiceId, amount: 4_000, reason: "Goodwill" },
        ADMIN
      )
    ).toEqual({
      ok: false,
      error: "Stripe couldn't refund this payment: charge_already_refunded",
    })
    expect(await credits.notesFor({ invoiceId })).toEqual([])
  })

  it("never skips a credit note number when Stripe declines", async () => {
    const { billing, credits } = setup("declined")
    const { invoiceId } = await paidByCard(billing)
    const { invoice } = await openInvoice(billing)

    await credits.refundInvoice(
      { invoiceId, amount: 4_000, reason: "Goodwill" },
      ADMIN
    )
    const note = expectOk(
      await credits.creditInvoice(
        { invoiceId: invoice.id, amount: 1_000, reason: "Late" },
        ADMIN
      )
    )

    expect(note.number).toBe("CN-2026-0001")
  })

  it("keeps a credit balance and applies it to the next invoice", async () => {
    const { billing, credits } = setup()
    const { client } = await openInvoice(billing)

    expectOk(
      await credits.creditBalance(
        {
          clientId: client.id,
          amount: 3_000,
          currency: "USD",
          reason: "Service credit",
        },
        ADMIN
      )
    )
    expect(await credits.balanceFor(client.id, "USD")).toBe(3_000)

    const draft = expectOk(
      await billing.createDraft(
        {
          clientId: client.id,
          lineItems: [buildLineItem({ quantity: 1, unitAmount: 2_000 })],
        },
        ADMIN
      )
    )
    const next = expectOk(await billing.issue(draft.id, ADMIN))
    const applied = expectOk(await credits.applyBalance(next.id, ADMIN))

    expect(applied.status).toBe("paid")
    expect(applied.payments.at(-1)).toMatchObject({
      method: "credit",
      amount: 2_000,
    })
    expect(await credits.balanceFor(client.id, "USD")).toBe(1_000)
  })

  it("records refunds made in Stripe once", async () => {
    const { billing, credits } = setup()
    const { invoiceId } = await paidByCard(billing)
    const external = {
      paymentIntentId: "pi_1",
      refundId: "re_ext",
      amount: 10_000,
    }

    expectOk(await credits.recordStripeRefund(external))
    expectOk(await credits.recordStripeRefund(external))

    const notes = await credits.notesFor({ invoiceId })
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({
      reason: "Refunded in Stripe",
      stripeRefundId: "re_ext",
    })
  })

  it("flags disputes, pauses autopay and settles lost ones as refunds", async () => {
    const { billing, credits } = setup()
    const { client, invoiceId } = await paidByCard(billing)
    expectOk(
      await billing.saveCard(client.id, {
        stripeCustomerId: "cus_1",
        paymentMethodId: "pm_1",
        brand: "visa",
        last4: "4242",
        expMonth: 1,
        expYear: 2030,
      })
    )

    expectOk(
      await credits.openDispute({
        paymentIntentId: "pi_1",
        disputeId: "dp_1",
        amount: 10_000,
      })
    )
    expect((await billing.getClient(client.id))?.autopay.enabled).toBe(false)

    expectOk(
      await credits.closeDispute({
        paymentIntentId: "pi_1",
        disputeId: "dp_1",
        amount: 10_000,
        won: false,
      })
    )
    const notes = await credits.notesFor({ invoiceId })
    expect(notes).toMatchObject([
      { kind: "refund", reason: "Dispute lost", stripeRefundId: "dp_1" },
    ])
    const events = (await billing.getInvoice(invoiceId))?.events.map(
      (event) => event.type
    )
    expect(events).toEqual(
      expect.arrayContaining(["disputed", "dispute_closed", "refunded"])
    )
  })
})
