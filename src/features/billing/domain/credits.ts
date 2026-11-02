import { formatMoney } from "./format"
import {
  fail,
  ok,
  type Invoice,
  type InvoiceAdjustment,
  type Result,
} from "./invoice"
import { calculateInvoiceTotals } from "./totals"

type Actor = { readonly actorId: string; readonly at: Date }

const ISSUED = new Set(["open", "paid", "uncollectible"])

const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0)

export const refundableAmount = (invoice: Invoice) =>
  sum(
    invoice.payments
      .filter((payment) => payment.method === "stripe")
      .map((payment) => payment.amount)
  ) - calculateInvoiceTotals(invoice).refunded

const problemWith = (invoice: Invoice, adjustment: InvoiceAdjustment) => {
  if (!ISSUED.has(invoice.status))
    return "Credit notes only apply to issued invoices."
  if (adjustment.amount <= 0) return "Enter an amount greater than zero."
  if (adjustment.kind === "refund") {
    const refundable = refundableAmount(invoice)
    return adjustment.amount > refundable
      ? `Only ${formatMoney(refundable, invoice.currency)} of card payments can still be refunded.`
      : null
  }
  const { amountDue } = calculateInvoiceTotals(invoice)
  if (invoice.status === "paid" || adjustment.amount > amountDue)
    return `A credit can't be more than the ${formatMoney(amountDue, invoice.currency)} still owed.`
  return null
}

export const applyCreditNote = (
  invoice: Invoice,
  adjustment: InvoiceAdjustment,
  { actorId, at }: Actor
): Result<Invoice> => {
  const problem = problemWith(invoice, adjustment)
  if (problem) return fail(problem)

  const adjusted: Invoice = {
    ...invoice,
    adjustments: [...invoice.adjustments, adjustment],
    events: [
      ...invoice.events,
      {
        type: adjustment.kind === "refund" ? "refunded" : "credited",
        at,
        actorId,
        detail: adjustment.number,
      },
    ],
  }
  const settled =
    adjustment.kind === "invoice_credit" &&
    calculateInvoiceTotals(adjusted).amountDue === 0
  if (!settled) return ok(adjusted)
  return ok({
    ...adjusted,
    status: "paid",
    events: [...adjusted.events, { type: "paid", at, actorId }],
  })
}

const OWNER_APPROVAL_ABOVE = 100_000

export const needsOwnerApproval = (amount: number) =>
  amount > OWNER_APPROVAL_ABOVE
