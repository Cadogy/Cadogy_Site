import { describe, expect, it } from "vitest"

import {
  formatAmountsByCurrency,
  formatDate,
  formatMoney,
  intervalLabel,
  parseMoneyInput,
} from "./format"

describe("formatMoney", () => {
  it("formats minor units in the invoice currency", () => {
    expect(formatMoney(123_456, "USD")).toBe("$1,234.56")
    expect(formatMoney(0, "EUR")).toBe("€0.00")
    expect(formatMoney(5, "GBP")).toBe("£0.05")
    expect(formatMoney(100, "USD")).toBe("$1.00")
  })
})

describe("parseMoneyInput", () => {
  it.each([
    ["1234.56", 123_456],
    ["$1,234.5", 123_450],
    ["  10 ", 1_000],
    ["0.005", 1],
  ])("parses %s into %i minor units", (input, expected) => {
    expect(parseMoneyInput(input)).toBe(expected)
  })

  it.each(["", "abc", "-5", "1.2.3"])("rejects %s", (input) => {
    expect(parseMoneyInput(input)).toBeNull()
  })
})

describe("formatDate", () => {
  it("formats dates in UTC so the server and browser agree", () => {
    expect(formatDate(new Date("2026-11-16T00:00:00.000Z"))).toBe(
      "Nov 16, 2026"
    )
    expect(formatDate(new Date("2026-01-01T23:30:00.000Z"))).toBe("Jan 1, 2026")
  })
})

describe("formatAmountsByCurrency", () => {
  it("shows zero dollars when nothing is owed", () => {
    expect(formatAmountsByCurrency({})).toBe("$0.00")
  })

  it("lists each currency separately instead of mixing them", () => {
    expect(formatAmountsByCurrency({ USD: 150_000, EUR: 20_000 })).toBe(
      "$1,500.00 · €200.00"
    )
  })
})

describe("intervalLabel", () => {
  it("names each billing interval for people", () => {
    expect(intervalLabel("one_time")).toBe("One-time")
    expect(intervalLabel("month")).toBe("Monthly")
    expect(intervalLabel("quarter")).toBe("Quarterly")
    expect(intervalLabel("year")).toBe("Yearly")
  })

  it("prices recurring services per period", () => {
    expect(intervalLabel("month", "per")).toBe("/ month")
    expect(intervalLabel("one_time", "per")).toBe("one-time")
  })
})
