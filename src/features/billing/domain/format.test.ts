import { describe, expect, it } from "vitest"

import {
  bpsToPercentText,
  cardSummary,
  clientDisplayName,
  formatAmountsByCurrency,
  formatDate,
  formatMoney,
  intervalLabel,
  INVOICE_EVENT_LABELS,
  parseMoneyInput,
  parsePercentToBps,
  PAYMENT_METHOD_LABELS,
  sumByCurrency,
  toMoneyInput,
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

describe("money and percent inputs", () => {
  it("shows minor units as an editable amount", () => {
    expect(toMoneyInput(150_000)).toBe("1500.00")
    expect(toMoneyInput(5)).toBe("0.05")
  })

  it("shows basis points as a percentage", () => {
    expect(bpsToPercentText(825)).toBe("8.25")
    expect(bpsToPercentText(0)).toBe("0")
  })

  it("reads a percentage of up to two decimals as basis points", () => {
    expect(parsePercentToBps("8.25")).toBe(825)
    expect(parsePercentToBps(" ")).toBe(0)
    expect(parsePercentToBps("100")).toBe(10_000)
  })

  it("rejects percentages that aren't between 0 and 100", () => {
    expect(parsePercentToBps("100.01")).toBeNull()
    expect(parsePercentToBps("-1")).toBeNull()
    expect(parsePercentToBps("8.255")).toBeNull()
    expect(parsePercentToBps("ten")).toBeNull()
  })
})

describe("sumByCurrency", () => {
  it("totals amounts separately for each currency", () => {
    expect(
      sumByCurrency([
        { currency: "USD", amount: 100 },
        { currency: "EUR", amount: 50 },
        { currency: "USD", amount: 25 },
      ])
    ).toEqual({ USD: 125, EUR: 50 })
  })

  it("is empty when there is nothing to total", () => {
    expect(sumByCurrency([])).toEqual({})
  })
})

describe("display labels", () => {
  it("names every payment method", () => {
    expect(PAYMENT_METHOD_LABELS.bank_transfer).toBe("Bank transfer")
    expect(PAYMENT_METHOD_LABELS.stripe).toBe("Card")
  })

  it("names every invoice event for the audit timeline", () => {
    expect(INVOICE_EVENT_LABELS.sent).toBe("Emailed to client")
    expect(INVOICE_EVENT_LABELS.dispute_closed).toBe("Dispute closed")
  })

  it("prefers a client's company over the contact name", () => {
    expect(clientDisplayName({ company: "Acme", name: "Ada" })).toBe("Acme")
    expect(clientDisplayName({ company: "", name: "Ada" })).toBe("Ada")
  })

  it("summarizes a saved card", () => {
    expect(
      cardSummary({ brand: "visa", last4: "4242", expMonth: 4, expYear: 2030 })
    ).toBe("visa ending 4242, expires 4/2030")
  })
})
