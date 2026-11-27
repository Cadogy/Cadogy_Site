import { describe, expect, it } from "vitest"

import {
  catalogPriceLabel,
  groupByCategory,
  resolveCatalogPrice,
  type PricedItem,
} from "./catalog"

const hourly = (overrides: Partial<PricedItem> = {}): PricedItem => ({
  pricing: "hourly",
  unitAmount: null,
  currency: "USD",
  categoryId: "design",
  ...overrides,
})

const usd = (amount: number) => ({ amount, currency: "USD" as const })

describe("resolveCatalogPrice", () => {
  it("uses a fixed service's own price", () => {
    expect(
      resolveCatalogPrice(
        { ...hourly(), pricing: "fixed", unitAmount: 800 },
        usd(1),
        usd(2)
      )
    ).toEqual({ unitAmount: 800, source: "service" })
  })

  it("never invents a price for a fixed service without one", () => {
    expect(
      resolveCatalogPrice({ ...hourly(), pricing: "fixed" }, usd(1), usd(2))
    ).toBeNull()
  })

  it("prefers the service rate, then the category rate, then the default", () => {
    expect(
      resolveCatalogPrice(hourly({ unitAmount: 20_000 }), usd(15_000), usd(9))
    ).toEqual({ unitAmount: 20_000, source: "service" })
    expect(resolveCatalogPrice(hourly(), usd(15_000), usd(9_000))).toEqual({
      unitAmount: 15_000,
      source: "category",
    })
    expect(resolveCatalogPrice(hourly(), null, usd(9_000))).toEqual({
      unitAmount: 9_000,
      source: "default",
    })
  })

  it("skips inherited rates in another currency", () => {
    const euro = hourly({ currency: "EUR" })
    expect(resolveCatalogPrice(euro, usd(15_000), usd(9_000))).toBeNull()
    expect(
      resolveCatalogPrice(euro, usd(15_000), { amount: 8_000, currency: "EUR" })
    ).toEqual({ unitAmount: 8_000, source: "default" })
  })

  it("returns null when an hourly service has no usable rate", () => {
    expect(resolveCatalogPrice(hourly(), null, null)).toBeNull()
  })
})

describe("groupByCategory", () => {
  const categories = [
    { id: "web", name: "Web" },
    { id: "design", name: "Design" },
    { id: "empty", name: "Empty" },
  ]

  it("sorts categories by name, skips empty ones, and puts loose items last", () => {
    const groups = groupByCategory(
      [
        { id: "a", categoryId: "web" },
        { id: "b", categoryId: null },
        { id: "c", categoryId: "design" },
        { id: "d", categoryId: "deleted" },
      ],
      categories
    )
    expect(
      groups.map((group) => [group.name, group.items.map((item) => item.id)])
    ).toEqual([
      ["Design", ["c"]],
      ["Web", ["a"]],
      ["Uncategorized", ["b", "d"]],
    ])
  })

  it("lists each category once even if it is passed more than once", () => {
    const groups = groupByCategory(
      [
        { id: "a", categoryId: "web" },
        { id: "b", categoryId: "web" },
      ],
      [categories[0]!, categories[0]!]
    )
    expect(groups).toHaveLength(1)
    expect(groups[0]?.items).toHaveLength(2)
  })
})

describe("catalogPriceLabel", () => {
  it.each([
    [
      {
        pricing: "fixed" as const,
        interval: "month" as const,
        price: { unitAmount: 800, source: "service" as const },
      },
      "$8.00 / month",
    ],
    [
      {
        pricing: "hourly" as const,
        interval: "one_time" as const,
        price: { unitAmount: 15_000, source: "category" as const },
      },
      "$150.00 / hour · category rate",
    ],
    [
      {
        pricing: "hourly" as const,
        interval: "month" as const,
        price: { unitAmount: 15_000, source: "service" as const },
      },
      "$150.00 / hour · Monthly",
    ],
    [
      {
        pricing: "hourly" as const,
        interval: "one_time" as const,
        price: null,
      },
      "Hourly · no rate set",
    ],
    [
      {
        pricing: "fixed" as const,
        interval: "one_time" as const,
        price: { unitAmount: 150_000, source: "service" as const },
        priceFrom: true,
      },
      "From $1,500.00 one-time",
    ],
    [
      {
        pricing: "fixed" as const,
        interval: "one_time" as const,
        price: { unitAmount: 10_000, source: "service" as const },
        unit: "page",
      },
      "$100.00 / page",
    ],
    [
      {
        pricing: "fixed" as const,
        interval: "month" as const,
        price: { unitAmount: 1_500, source: "service" as const },
        unit: "user",
      },
      "$15.00 / user / month",
    ],
    [
      {
        pricing: "hourly" as const,
        interval: "one_time" as const,
        price: { unitAmount: 50_000, source: "service" as const },
        priceFrom: true,
      },
      "From $500.00 / hour",
    ],
    [
      {
        pricing: "at_cost" as const,
        interval: "month" as const,
        price: null,
      },
      "At cost / month",
    ],
    [
      {
        pricing: "at_cost" as const,
        interval: "year" as const,
        price: { unitAmount: 1_200, source: "service" as const },
        unit: "domain",
      },
      "At cost / domain / year · typically $12.00",
    ],
  ])("labels %o as %s", (item, label) => {
    expect(catalogPriceLabel({ ...item, currency: "USD" })).toBe(label)
  })
})
