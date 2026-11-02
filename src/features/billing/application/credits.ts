import { applyCreditNote } from "../domain/credits"
import { formatMoney } from "../domain/format"
import { fail, ok, type Invoice, type Result } from "../domain/invoice"
import type { Currency } from "../domain/schema"
import { calculateInvoiceTotals } from "../domain/totals"
import type { createBillingService } from "./billing-service"
import type { BillingRepository } from "./ports"

export type CreditNoteKind = "refund" | "invoice_credit" | "balance_credit"

export type CreditNote = {
  readonly id: string
  readonly number: string
  readonly clientId: string
  readonly invoiceId: string | null
  readonly kind: CreditNoteKind
  readonly amount: number
  readonly currency: Currency
  readonly reason: string
  readonly stripeRefundId: string | null
  readonly stripePaymentIntentId: string | null
  readonly createdAt: Date
  readonly createdBy: string
}

export type CreditNoteRepository = {
  readonly insert: (note: Omit<CreditNote, "id">) => Promise<CreditNote>
  readonly list: (filter: {
    readonly clientId?: string
    readonly invoiceId?: string
  }) => Promise<CreditNote[]>
  readonly findByStripeRefundId: (
    refundId: string
  ) => Promise<CreditNote | null>
}

type RefundResult =
  | { readonly ok: true; readonly refundId: string }
  | { readonly ok: false; readonly error: string }

type Dependencies = {
  readonly billing: ReturnType<typeof createBillingService>
  readonly billingRepository: BillingRepository
  readonly repository: CreditNoteRepository
  readonly clock: () => Date
  readonly gateway: {
    readonly refund: (request: {
      readonly paymentIntentId: string
      readonly amount: number
      readonly idempotencyKey: string
    }) => Promise<RefundResult>
  }
}

type InvoiceRequest = {
  readonly invoiceId: string
  readonly amount: number
  readonly reason: string
}

const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0)

const pad = (value: number) => String(value).padStart(4, "0")

export const createCredits = ({
  billing,
  billingRepository,
  repository,
  clock,
  gateway,
}: Dependencies) => {
  const nextNumber = async () => {
    const year = clock().getUTCFullYear()
    const sequence = await billingRepository.nextSequence(`credit-note-${year}`)
    return `CN-${year}-${pad(sequence)}`
  }

  const precheck = (
    invoice: Invoice,
    kind: "refund" | "invoice_credit",
    amount: number
  ) =>
    applyCreditNote(
      invoice,
      { creditNoteId: "pending", number: "pending", kind, amount },
      { actorId: "check", at: clock() }
    )

  const record = async (
    invoice: Invoice,
    note: Omit<CreditNote, "id" | "number" | "createdAt">
  ): Promise<Result<CreditNote>> => {
    const stored = await repository.insert({
      ...note,
      number: await nextNumber(),
      createdAt: clock(),
    })
    if (note.kind === "balance_credit") return ok(stored)
    const applied = applyCreditNote(
      invoice,
      {
        creditNoteId: stored.id,
        number: stored.number,
        kind: note.kind,
        amount: note.amount,
      },
      { actorId: note.createdBy, at: clock() }
    )
    if (!applied.ok) return applied
    await billingRepository.saveInvoice(applied.value)
    return ok(stored)
  }

  const creditInvoice = async (
    { invoiceId, amount, reason }: InvoiceRequest,
    actorId: string
  ): Promise<Result<CreditNote>> => {
    const invoice = await billingRepository.findInvoice(invoiceId)
    if (!invoice) return fail("Invoice not found.")
    const check = precheck(invoice, "invoice_credit", amount)
    if (!check.ok) return check
    return record(invoice, {
      clientId: invoice.clientId,
      invoiceId,
      kind: "invoice_credit",
      amount,
      currency: invoice.currency,
      reason,
      stripeRefundId: null,
      stripePaymentIntentId: null,
      createdBy: actorId,
    })
  }

  const refundableByIntent = async (invoice: Invoice) => {
    const notes = await repository.list({ invoiceId: invoice.id })
    return invoice.payments
      .filter(
        (payment) =>
          payment.method === "stripe" && payment.stripePaymentIntentId
      )
      .map((payment) => {
        const refunds = notes.filter(
          (note) => note.stripePaymentIntentId === payment.stripePaymentIntentId
        )
        return {
          paymentIntentId: payment.stripePaymentIntentId ?? "",
          refundable: payment.amount - sum(refunds.map((note) => note.amount)),
          refundCount: refunds.length,
        }
      })
      .reverse()
  }

  const refundInvoice = async (
    { invoiceId, amount, reason }: InvoiceRequest,
    actorId: string
  ): Promise<Result<CreditNote>> => {
    const invoice = await billingRepository.findInvoice(invoiceId)
    if (!invoice) return fail("Invoice not found.")
    const check = precheck(invoice, "refund", amount)
    if (!check.ok) return check
    const intents = await refundableByIntent(invoice)
    const source = intents.find((intent) => intent.refundable >= amount)
    if (!source) {
      const largest = Math.max(0, ...intents.map((intent) => intent.refundable))
      return fail(
        `Refund at most ${formatMoney(largest, invoice.currency)} at a time: that's the most left on a single card payment.`
      )
    }
    const refunded = await gateway.refund({
      paymentIntentId: source.paymentIntentId,
      amount,
      idempotencyKey: `refund:${invoiceId}:${source.paymentIntentId}:${source.refundCount}:${amount}`,
    })
    if (!refunded.ok)
      return fail(`Stripe couldn't refund this payment: ${refunded.error}`)
    return record(invoice, {
      clientId: invoice.clientId,
      invoiceId,
      kind: "refund",
      amount,
      currency: invoice.currency,
      reason,
      stripeRefundId: refunded.refundId,
      stripePaymentIntentId: source.paymentIntentId,
      createdBy: actorId,
    })
  }

  const creditBalance = async (
    input: {
      readonly clientId: string
      readonly amount: number
      readonly currency: Currency
      readonly reason: string
    },
    actorId: string
  ): Promise<Result<CreditNote>> => {
    if (input.amount <= 0) return fail("Enter an amount greater than zero.")
    if (!(await billingRepository.findClient(input.clientId)))
      return fail("Client not found.")
    return ok(
      await repository.insert({
        clientId: input.clientId,
        invoiceId: null,
        kind: "balance_credit",
        amount: input.amount,
        currency: input.currency,
        reason: input.reason,
        stripeRefundId: null,
        stripePaymentIntentId: null,
        number: await nextNumber(),
        createdAt: clock(),
        createdBy: actorId,
      })
    )
  }

  const balanceFor = async (clientId: string, currency: Currency) => {
    const [notes, invoices] = await Promise.all([
      repository.list({ clientId }),
      billingRepository.listInvoices({ clientIds: [clientId] }),
    ])
    const credited = sum(
      notes
        .filter(
          (note) => note.kind === "balance_credit" && note.currency === currency
        )
        .map((note) => note.amount)
    )
    const used = sum(
      invoices
        .filter((invoice) => invoice.currency === currency)
        .flatMap((invoice) => invoice.payments)
        .filter((payment) => payment.method === "credit")
        .map((payment) => payment.amount)
    )
    return Math.max(0, credited - used)
  }

  const applyBalance = async (
    invoiceId: string,
    actorId: string
  ): Promise<Result<Invoice>> => {
    const invoice = await billingRepository.findInvoice(invoiceId)
    if (!invoice) return fail("Invoice not found.")
    if (invoice.status !== "open") return ok(invoice)
    const available = await balanceFor(invoice.clientId, invoice.currency)
    const amount = Math.min(
      available,
      calculateInvoiceTotals(invoice).amountDue
    )
    if (amount <= 0) return ok(invoice)
    return billing.recordCreditPayment(
      invoiceId,
      amount,
      "Credit balance",
      actorId
    )
  }

  const stripeRefund = async (
    input: {
      readonly paymentIntentId: string
      readonly refundId: string
      readonly amount: number
    },
    reason: string
  ): Promise<Result<CreditNote | null>> => {
    if (await repository.findByStripeRefundId(input.refundId)) return ok(null)
    const invoice = await billingRepository.findInvoiceByPaymentIntent(
      input.paymentIntentId
    )
    if (!invoice) return fail("No invoice for that payment.")
    return record(invoice, {
      clientId: invoice.clientId,
      invoiceId: invoice.id,
      kind: "refund",
      amount: input.amount,
      currency: invoice.currency,
      reason,
      stripeRefundId: input.refundId,
      stripePaymentIntentId: input.paymentIntentId,
      createdBy: "stripe",
    })
  }

  const markDispute = async (
    paymentIntentId: string,
    detail: string,
    type: "disputed" | "dispute_closed"
  ) => {
    const invoice =
      await billingRepository.findInvoiceByPaymentIntent(paymentIntentId)
    if (!invoice) return fail<Invoice>("No invoice for that payment.")
    if (
      invoice.events.some(
        (event) => event.type === type && event.detail === detail
      )
    )
      return ok(invoice)
    return ok(
      await billingRepository.saveInvoice({
        ...invoice,
        events: [
          ...invoice.events,
          { type, at: clock(), actorId: "stripe", detail },
        ],
      })
    )
  }

  const openDispute = async (input: {
    readonly paymentIntentId: string
    readonly disputeId: string
    readonly amount: number
  }) => {
    const marked = await markDispute(
      input.paymentIntentId,
      input.disputeId,
      "disputed"
    )
    if (!marked.ok) return marked
    const client = await billingRepository.findClient(marked.value.clientId)
    if (client?.autopay.enabled) await billing.setAutopay(client.id, false)
    return marked
  }

  const closeDispute = async (input: {
    readonly paymentIntentId: string
    readonly disputeId: string
    readonly amount: number
    readonly won: boolean
  }) => {
    const marked = await markDispute(
      input.paymentIntentId,
      `${input.disputeId}:${input.won ? "won" : "lost"}`,
      "dispute_closed"
    )
    if (!marked.ok || input.won) return marked
    const refunded = await stripeRefund(
      {
        paymentIntentId: input.paymentIntentId,
        refundId: input.disputeId,
        amount: input.amount,
      },
      "Dispute lost"
    )
    return refunded.ok ? marked : refunded
  }

  return {
    creditInvoice,
    refundInvoice,
    creditBalance,
    balanceFor,
    applyBalance,
    recordStripeRefund: (input: {
      readonly paymentIntentId: string
      readonly refundId: string
      readonly amount: number
    }) => stripeRefund(input, "Refunded in Stripe"),
    openDispute,
    closeDispute,
    notesFor: repository.list,
  }
}
