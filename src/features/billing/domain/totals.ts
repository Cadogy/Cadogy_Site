import type {
  Discount,
  InvoiceAmounts,
  InvoiceTotals,
  LineItem,
} from "./schema"

const BPS = 10_000

const roundHalfUp = (value: number) => Math.round(value)

const sum = (values: readonly number[]) =>
  values.reduce((acc, value) => acc + value, 0)

export const calculateLineTotal = ({
  quantity,
  unitAmount,
}: LineItem): number =>
  roundHalfUp((Math.round(quantity * 100) * unitAmount) / 100)

const discountAmount = (
  subtotal: number,
  discount: Discount | null
): number => {
  if (!discount) return 0
  const raw =
    discount.type === "percent"
      ? roundHalfUp((subtotal * discount.value) / BPS)
      : discount.value
  return Math.min(raw, subtotal)
}

export const calculateInvoiceTotals = (
  invoice: InvoiceAmounts
): InvoiceTotals => {
  const subtotal = sum(invoice.lineItems.map(calculateLineTotal))
  const discount = discountAmount(subtotal, invoice.discount)
  const tax = roundHalfUp(((subtotal - discount) * invoice.taxRateBps) / BPS)
  const total = subtotal - discount + tax
  const amountPaid = sum(invoice.payments.map((payment) => payment.amount))

  return {
    subtotal,
    discount,
    tax,
    total,
    amountPaid,
    amountDue: Math.max(0, total - amountPaid),
  }
}
