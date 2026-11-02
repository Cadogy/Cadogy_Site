import {
  fail,
  ok,
  type ClientSnapshot,
  type DisplayStatus,
  type Invoice,
  type InvoiceBadge,
  type InvoiceEvent,
  type Result,
} from "./invoice"
import type { InvoiceDraftInput, Payment } from "./schema"
import { calculateInvoiceTotals } from "./totals"

const DAY_MS = 86_400_000

type Actor = { readonly actorId: string; readonly at: Date }

type EditableFields = Partial<
  Pick<
    InvoiceDraftInput,
    | "clientId"
    | "currency"
    | "termsDays"
    | "lineItems"
    | "discount"
    | "taxRateBps"
    | "memo"
    | "footer"
    | "internalNotes"
  >
>

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS)

const withEvent = (
  invoice: Invoice,
  event: InvoiceEvent
): readonly InvoiceEvent[] => [...invoice.events, event]

const issueProblem = (
  invoice: Invoice,
  client: ClientSnapshot
): string | null => {
  if (invoice.status !== "draft") return "Only a draft can be issued"
  if (invoice.lineItems.length === 0)
    return "Add at least one line item before issuing"
  if (calculateInvoiceTotals(invoice).total <= 0)
    return "The invoice total must be greater than zero"
  if (!client.email) return "The client needs a billing email before issuing"
  return null
}

export const issueInvoice = (
  invoice: Invoice,
  args: {
    readonly number: string
    readonly client: ClientSnapshot
    readonly issueDate: Date
    readonly actorId: string
  }
): Result<Invoice> => {
  const problem = issueProblem(invoice, args.client)
  if (problem) return fail(problem)

  return ok({
    ...invoice,
    status: "open",
    number: args.number,
    clientSnapshot: args.client,
    issueDate: args.issueDate,
    dueDate: addDays(args.issueDate, invoice.termsDays),
    events: withEvent(invoice, {
      type: "issued",
      at: args.issueDate,
      actorId: args.actorId,
    }),
  })
}

export const updateDraft = (
  invoice: Invoice,
  fields: EditableFields
): Result<Invoice> => {
  if (invoice.status !== "draft")
    return fail("Only a draft can be edited; void and reissue instead")
  return ok({ ...invoice, ...fields })
}

const paymentProblem = (invoice: Invoice, payment: Payment): string | null => {
  if (invoice.status !== "open" && invoice.status !== "uncollectible")
    return `Payments cannot be recorded on a ${invoice.status} invoice`
  if (payment.amount > calculateInvoiceTotals(invoice).amountDue)
    return "Payment exceeds the amount due"
  return null
}

const alreadyRecorded = (invoice: Invoice, payment: Payment) =>
  Boolean(payment.stripeEventId) &&
  invoice.payments.some(
    (existing) => existing.stripeEventId === payment.stripeEventId
  )

export const recordPayment = (
  invoice: Invoice,
  payment: Payment,
  { actorId, at }: Actor
): Result<Invoice> => {
  if (alreadyRecorded(invoice, payment)) return ok(invoice)

  const problem = paymentProblem(invoice, payment)
  if (problem) return fail(problem)

  const withPayment: Invoice = {
    ...invoice,
    payments: [...invoice.payments, payment],
    events: withEvent(invoice, { type: "payment_recorded", at, actorId }),
  }
  const settled = calculateInvoiceTotals(withPayment).amountDue === 0

  if (!settled) return ok(withPayment)
  return ok({
    ...withPayment,
    status: "paid",
    events: withEvent(withPayment, { type: "paid", at, actorId }),
  })
}

export const voidInvoice = (
  invoice: Invoice,
  { actorId, at }: Actor
): Result<Invoice> => {
  if (invoice.status !== "open")
    return fail("Only an open invoice can be voided")
  if (invoice.payments.length > 0)
    return fail(
      "An invoice with recorded payments cannot be voided; issue a refund or credit instead"
    )
  return ok({
    ...invoice,
    status: "void",
    events: withEvent(invoice, { type: "voided", at, actorId }),
  })
}

export const markUncollectible = (
  invoice: Invoice,
  { actorId, at }: Actor
): Result<Invoice> => {
  if (invoice.status !== "open")
    return fail("Only an open invoice can be marked uncollectible")
  return ok({
    ...invoice,
    status: "uncollectible",
    events: withEvent(invoice, { type: "marked_uncollectible", at, actorId }),
  })
}

const isOverdue = (invoice: Invoice, now: Date) =>
  invoice.status === "open" &&
  invoice.dueDate !== null &&
  now.getTime() >= addDays(invoice.dueDate, 1).getTime()

export const displayStatus = (invoice: Invoice, now: Date): DisplayStatus =>
  isOverdue(invoice, now) ? "overdue" : invoice.status

const total = (amounts: readonly number[]) =>
  amounts.reduce((sum, amount) => sum + amount, 0)

const hasOpenDispute = (invoice: Invoice) =>
  invoice.events.filter((event) => event.type === "disputed").length >
  invoice.events.filter((event) => event.type === "dispute_closed").length

const paidBadge = (invoice: Invoice): InvoiceBadge => {
  const received = total(
    invoice.payments
      .filter((payment) => payment.method !== "credit")
      .map((payment) => payment.amount)
  )
  const refunded = total(
    invoice.adjustments
      .filter((adjustment) => adjustment.kind === "refund")
      .map((adjustment) => adjustment.amount)
  )
  const byCredit =
    invoice.adjustments.length > 0 ||
    invoice.payments.some((payment) => payment.method === "credit")
  if (received === 0) return byCredit ? "settled_by_credit" : "paid"
  if (refunded >= received) return "refunded"
  if (refunded > 0) return "partially_refunded"
  return "paid"
}

export const invoiceBadge = (invoice: Invoice, now: Date): InvoiceBadge => {
  if (hasOpenDispute(invoice)) return "disputed"
  if (invoice.status === "paid") return paidBadge(invoice)
  return displayStatus(invoice, now)
}
