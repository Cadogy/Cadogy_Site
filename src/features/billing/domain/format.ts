import type { BillingInterval } from "./recurring"
import type { Currency } from "./schema"

const MONEY_PATTERN = /^\d+(\.\d+)?$/

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

export const formatDate = (date: Date) => dateFormatter.format(date)

export const formatAmountsByCurrency = (
  amounts: Partial<Record<Currency, number>>
) => {
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
