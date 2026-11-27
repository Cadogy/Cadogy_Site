import { startOfUtcDay } from "./dates"
import { addInterval, type BillingInterval } from "./recurring"
import type { Currency } from "./schema"

export const MAX_INCLUDED_HOURS = 1_000
export const MAX_LOGGED_HOURS = 24

/** Hours are kept to two decimals (0.25, 1.5), like invoice quantities. */
export const roundHours = (hours: number) => Math.round(hours * 100) / 100

const hoursFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

/** "1.5 h", "3 h". */
export const formatHours = (hours: number) =>
  `${hoursFormatter.format(hours)} h`

export type AllowancePeriod = {
  readonly start: Date
  /** The first day of the next period (exclusive). */
  readonly until: Date
}

type Plan = {
  readonly startDate: Date
  readonly interval: BillingInterval
  readonly anchorDay: number
}

const MAX_PERIODS = 1_200

/**
 * The billing period of a recurring plan that contains `on`, the same
 * periods its renewals are billed for. Null before the plan starts and for
 * one-time services, which have no periods.
 */
export const allowancePeriod = (
  plan: Plan,
  on: Date
): AllowancePeriod | null => {
  if (plan.interval === "one_time") return null
  const interval = plan.interval
  const day = startOfUtcDay(on).getTime()
  const start = startOfUtcDay(plan.startDate)
  if (day < start.getTime()) return null
  const find = (from: Date, step: number): AllowancePeriod | null => {
    if (step > MAX_PERIODS) return null
    const next = addInterval(from, interval, plan.anchorDay)
    return day < next.getTime()
      ? { start: from, until: next }
      : find(next, step + 1)
  }
  return find(start, 0)
}

export const inPeriod = (period: AllowancePeriod, date: Date) => {
  const time = startOfUtcDay(date).getTime()
  return time >= period.start.getTime() && time < period.until.getTime()
}

/** Covers what the allowance still has; the rest is billable. */
export const splitHours = (hours: number, remaining: number) => {
  const included = roundHours(Math.min(hours, Math.max(0, remaining)))
  return { included, overage: roundHours(hours - included) }
}

type ValuedItem = {
  readonly id: string
  readonly pricing: string
  readonly currency: Currency
  readonly interval: BillingInterval
  readonly price: { readonly unitAmount: number } | null
}

/**
 * What a package's included services cost bought separately, counting the
 * fixed-price ones billed on the same schedule and in the same currency.
 */
export const packageValue = (
  pkg: {
    readonly currency: Currency
    readonly interval: BillingInterval
    readonly includedItemIds: readonly string[]
  },
  items: readonly ValuedItem[]
) => {
  const included = new Set(pkg.includedItemIds)
  return items
    .filter(
      (item) =>
        included.has(item.id) &&
        item.pricing === "fixed" &&
        item.currency === pkg.currency &&
        item.interval === pkg.interval &&
        item.price
    )
    .reduce((total, item) => total + (item.price?.unitAmount ?? 0), 0)
}

export const isPackage = (item: {
  readonly includedItemIds: readonly string[]
  readonly includedHours: number | null
}) => item.includedItemIds.length > 0 || (item.includedHours ?? 0) > 0
