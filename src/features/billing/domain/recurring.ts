import type { Currency } from "./schema"

export const BILLING_INTERVALS = [
  "one_time",
  "month",
  "quarter",
  "year",
] as const
export const ADD_ON_STATUSES = [
  "active",
  "paused",
  "canceled",
  "completed",
] as const

export type BillingInterval = (typeof BILLING_INTERVALS)[number]
export type AddOnStatus = (typeof ADD_ON_STATUSES)[number]

export type AddOn = {
  readonly id: string
  readonly clientId: string
  readonly name: string
  readonly unitAmount: number
  readonly quantity: number
  readonly currency: Currency
  readonly interval: BillingInterval
  readonly anchorDay: number
  readonly nextBillingDate: Date
  readonly status: AddOnStatus
}

export type NewCharge = {
  readonly addOnId: string | null
  readonly clientId: string
  readonly description: string
  readonly quantity: number
  readonly unitAmount: number
  readonly currency: Currency
  readonly periodStart: Date | null
  readonly periodEnd: Date | null
}

const DAY_MS = 86_400_000
const MONTHS: Record<Exclude<BillingInterval, "one_time">, number> = {
  month: 1,
  quarter: 3,
  year: 12,
}
const MAX_CATCH_UP = 120

const lastDayOfMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

export const addInterval = (
  date: Date,
  interval: Exclude<BillingInterval, "one_time">,
  anchorDay: number
) => {
  const months = date.getUTCMonth() + MONTHS[interval]
  const year = date.getUTCFullYear() + Math.floor(months / 12)
  const month = months % 12
  return new Date(
    Date.UTC(year, month, Math.min(anchorDay, lastDayOfMonth(year, month)))
  )
}

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
})
const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

export const chargeDescription = ({
  name,
  quantity,
  periodStart,
  periodEnd,
}: {
  name: string
  quantity: number
  periodStart: Date | null
  periodEnd: Date | null
}) => {
  const label = quantity > 1 ? `${name} × ${quantity}` : name
  if (!periodStart || !periodEnd) return label
  const sameYear = periodStart.getUTCFullYear() === periodEnd.getUTCFullYear()
  const range = sameYear
    ? `${shortDate.format(periodStart)} – ${longDate.format(periodEnd)}`
    : `${longDate.format(periodStart)} – ${longDate.format(periodEnd)}`
  return `${label} (${range})`
}

const chargeFor = (
  addOn: AddOn,
  periodStart: Date | null,
  periodEnd: Date | null
): NewCharge => ({
  addOnId: addOn.id,
  clientId: addOn.clientId,
  description: chargeDescription({
    name: addOn.name,
    quantity: addOn.quantity,
    periodStart,
    periodEnd,
  }),
  quantity: addOn.quantity,
  unitAmount: addOn.unitAmount,
  currency: addOn.currency,
  periodStart,
  periodEnd,
})

export const dueCharges = (addOn: AddOn, today: Date) => {
  const idle = {
    charges: [] as NewCharge[],
    nextBillingDate: addOn.nextBillingDate,
    completed: false,
  }
  if (
    addOn.status !== "active" ||
    addOn.nextBillingDate.getTime() > today.getTime()
  )
    return idle

  if (addOn.interval === "one_time") {
    return {
      charges: [chargeFor(addOn, null, null)],
      nextBillingDate: addOn.nextBillingDate,
      completed: true,
    }
  }

  const interval = addOn.interval
  const periods = Array.from({ length: MAX_CATCH_UP }).reduce<{
    start: Date
    charges: NewCharge[]
  }>(
    (acc) => {
      if (acc.start.getTime() > today.getTime()) return acc
      const next = addInterval(acc.start, interval, addOn.anchorDay)
      return {
        start: next,
        charges: [
          ...acc.charges,
          chargeFor(addOn, acc.start, new Date(next.getTime() - DAY_MS)),
        ],
      }
    },
    { start: addOn.nextBillingDate, charges: [] }
  )

  return {
    charges: periods.charges,
    nextBillingDate: periods.start,
    completed: false,
  }
}
