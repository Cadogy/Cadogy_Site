import type { InvoiceEvent } from "./invoice"
import type { BillingInterval } from "./recurring"
import type { Currency, Payment } from "./schema"

const MONEY_PATTERN = /^\d+(\.\d+)?$/
const PERCENT_PATTERN = /^\d+(\.\d{1,2})?$/
const MAX_BPS = 10_000

export type AmountsByCurrency = Partial<Record<Currency, number>>

const moneyFormatters = new Map<Currency, Intl.NumberFormat>()

const moneyFormatter = (currency: Currency) => {
  const cached = moneyFormatters.get(currency)
  if (cached) return cached
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  })
  moneyFormatters.set(currency, formatter)
  return formatter
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

export const formatMoney = (minorUnits: number, currency: Currency) =>
  moneyFormatter(currency).format(minorUnits / 100)

export const parseMoneyInput = (input: string): number | null => {
  const normalized = input.trim().replace(/[$€£,\s]/g, "")
  if (!MONEY_PATTERN.test(normalized)) return null
  return Math.round(Number(normalized) * 100)
}

export const toMoneyInput = (minorUnits: number) =>
  (minorUnits / 100).toFixed(2)

export const bpsToPercentText = (bps: number) => String(bps / 100)

export const parsePercentToBps = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === "") return 0
  if (!PERCENT_PATTERN.test(trimmed)) return null
  const bps = Math.round(Number(trimmed) * 100)
  return bps <= MAX_BPS ? bps : null
}

export const formatDate = (date: Date) => dateFormatter.format(date)

export const addByCurrency = (
  totals: AmountsByCurrency,
  currency: Currency,
  amount: number
): AmountsByCurrency => ({
  ...totals,
  [currency]: (totals[currency] ?? 0) + amount,
})

export const sumByCurrency = (
  items: readonly { readonly currency: Currency; readonly amount: number }[]
) =>
  items.reduce<AmountsByCurrency>(
    (totals, item) => addByCurrency(totals, item.currency, item.amount),
    {}
  )

export const formatAmountsByCurrency = (amounts: AmountsByCurrency) => {
  const entries = Object.entries(amounts) as [Currency, number][]
  if (entries.length === 0) return formatMoney(0, "USD")
  return entries
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(" · ")
}

const INTERVAL_LABELS: Record<BillingInterval, { name: string; per: string }> =
  {
    one_time: { name: "One-time", per: "one-time" },
    month: { name: "Monthly", per: "/ month" },
    quarter: { name: "Quarterly", per: "/ quarter" },
    year: { name: "Yearly", per: "/ year" },
  }

export const intervalLabel = (
  interval: BillingInterval,
  style: "name" | "per" = "name"
) => INTERVAL_LABELS[interval][style]

export const PAYMENT_METHOD_LABELS: Record<Payment["method"], string> = {
  stripe: "Card",
  bank_transfer: "Bank transfer",
  check: "Check",
  cash: "Cash",
  credit: "Credit balance",
  other: "Other",
}

export const INVOICE_EVENT_LABELS: Record<InvoiceEvent["type"], string> = {
  created: "Draft created",
  updated: "Draft updated",
  issued: "Issued",
  sent: "Emailed to client",
  viewed: "Viewed by client",
  reminder_sent: "Reminder sent",
  autopay_failed: "Autopay charge failed",
  payment_recorded: "Payment recorded",
  paid: "Paid in full",
  voided: "Voided",
  marked_uncollectible: "Marked uncollectible",
  credited: "Credit note issued",
  refunded: "Refunded",
  disputed: "Payment disputed",
  dispute_closed: "Dispute closed",
}

export const clientDisplayName = (client: {
  readonly company: string
  readonly name: string
}) => client.company || client.name

export const cardSummary = (card: {
  readonly brand: string
  readonly last4: string
  readonly expMonth: number
  readonly expYear: number
}) =>
  `${card.brand} ending ${card.last4}, expires ${card.expMonth}/${card.expYear}`
