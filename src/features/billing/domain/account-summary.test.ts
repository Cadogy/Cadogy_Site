import { describe, expect, it } from "vitest"

import { accountSummary } from "./account-summary"

describe("accountSummary", () => {
  it("tells a client with nothing open that they are paid up", () => {
    expect(accountSummary({ open: 0, overdue: 0 })).toBe("You're all paid up.")
  })

  it("counts open invoices in plain words", () => {
    expect(accountSummary({ open: 1, overdue: 0 })).toBe(
      "You have 1 open invoice."
    )
    expect(accountSummary({ open: 3, overdue: 0 })).toBe(
      "You have 3 open invoices."
    )
  })

  it("calls out how many are overdue", () => {
    expect(accountSummary({ open: 2, overdue: 1 })).toBe(
      "You have 2 open invoices, 1 overdue."
    )
  })
})
