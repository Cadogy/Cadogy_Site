import { formatMoney, intervalLabel } from "./format"
import type { BillingInterval } from "./recurring"
import type { Currency } from "./schema"

export const PRICING_MODELS = ["fixed", "hourly"] as const

export type PricingModel = (typeof PRICING_MODELS)[number]

export type Money = { readonly amount: number; readonly currency: Currency }

type RateSource = "service" | "category" | "default"

export type PricedItem = {
  readonly pricing: PricingModel
  readonly unitAmount: number | null
  readonly currency: Currency
  readonly categoryId: string | null
}

export type ResolvedPrice = {
  readonly unitAmount: number
  readonly source: RateSource
}

const inCurrency = (rate: Money | null, currency: Currency) =>
  rate && rate.currency === currency ? rate.amount : null

/**
 * Fixed services always carry their own price. Hourly services use their own
 * rate if set, then their category's rate, then the global default. Inherited
 * rates only apply when they are in the service's currency, so a EUR service
 * never silently bills a USD rate.
 */
export const resolveCatalogPrice = (
  item: PricedItem,
  categoryRate: Money | null,
  defaultHourlyRate: Money | null
): ResolvedPrice | null => {
  if (item.unitAmount !== null)
    return { unitAmount: item.unitAmount, source: "service" }
  if (item.pricing !== "hourly") return null
  const fromCategory = inCurrency(categoryRate, item.currency)
  if (fromCategory !== null)
    return { unitAmount: fromCategory, source: "category" }
  const fromDefault = inCurrency(defaultHourlyRate, item.currency)
  if (fromDefault !== null)
    return { unitAmount: fromDefault, source: "default" }
  return null
}

const RATE_SOURCE_LABELS: Record<RateSource, string> = {
  service: "",
  category: "category rate",
  default: "default rate",
}

export type CatalogGroup<T> = {
  readonly categoryId: string | null
  readonly name: string
  readonly items: readonly T[]
}

/** Groups items under their categories (alphabetical), uncategorized last. */
export const groupByCategory = <
  T extends { readonly categoryId: string | null },
>(
  items: readonly T[],
  categories: readonly { readonly id: string; readonly name: string }[]
): CatalogGroup<T>[] => {
  const unique = [
    ...new Map(categories.map((category) => [category.id, category])).values(),
  ]
  const known = new Set(unique.map((category) => category.id))
  const named = unique
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((category) => ({
      categoryId: category.id,
      name: category.name,
      items: items.filter((item) => item.categoryId === category.id),
    }))
  const loose = items.filter(
    (item) => item.categoryId === null || !known.has(item.categoryId)
  )
  return [
    ...named.filter((group) => group.items.length > 0),
    ...(loose.length > 0
      ? [{ categoryId: null, name: "Uncategorized", items: loose }]
      : []),
  ]
}

/** "$150.00 / hour · category rate", "$8.00 / month", "Hourly · no rate set". */
export const catalogPriceLabel = (item: {
  readonly pricing: PricingModel
  readonly currency: Currency
  readonly interval: BillingInterval
  readonly price: ResolvedPrice | null
}) => {
  if (!item.price) return "Hourly · no rate set"
  const amount = formatMoney(item.price.unitAmount, item.currency)
  if (item.pricing === "fixed")
    return `${amount} ${intervalLabel(item.interval, "per")}`
  return [
    `${amount} / hour`,
    item.interval === "one_time" ? "" : intervalLabel(item.interval),
    RATE_SOURCE_LABELS[item.price.source],
  ]
    .filter(Boolean)
    .join(" · ")
}
