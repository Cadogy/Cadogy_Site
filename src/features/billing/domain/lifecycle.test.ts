import { describe, expect, it } from "vitest"

import {
  displayStatus,
  invoiceBadge,
  issueInvoice,
  markUncollectible,
  recordPayment,
  updateDraft,
  voidInvoice,
} from "./lifecycle"
import { formatInvoiceNumber } from "./numbering"
import {
  buildClientSnapshot,
  buildInvoice,
  buildLineItem,
  buildPayment,
} from "./test-factories"

const ISSUE_DATE = new Date("2026-11-01T00:00:00.000Z")
const ACTOR = "admin-1"

const issueArgs = {
  number: "CAD-2026-0001",
  client: buildClientSnapshot(),
  issueDate: ISSUE_DATE,
  actorId: ACTOR,
}

const expectOk = <T>(
  result: { ok: true; value: T } | { ok: false; error: string }
) => {
  if (!result.ok) throw new Error(`Expected ok, got: ${result.error}`)
  return result.value
}

const openInvoice = (overrides = {}) =>
  expectOk(
    issueInvoice(buildInvoice({ termsDays: 15, ...overrides }), issueArgs)
  )

describe("issueInvoice", () => {
  it("opens a draft with a number, a frozen client snapshot and a due date from its terms", () => {
    const issued = openInvoice()

    expect(issued.status).toBe("open")
    expect(issued.number).toBe("CAD-2026-0001")
    expect(issued.clientSnapshot).toEqual(buildClientSnapshot())
    expect(issued.issueDate).toEqual(ISSUE_DATE)
    expect(issued.dueDate).toEqual(new Date("2026-11-16T00:00:00.000Z"))
    expect(issued.events.at(-1)).toMatchObject({
      type: "issued",
      actorId: ACTOR,
    })
  })

  it("does not mutate the draft it was given", () => {
    const draft = buildInvoice()
    issueInvoice(draft, issueArgs)
    expect(draft.status).toBe("draft")
    expect(draft.number).toBeNull()
  })

  it.each([
    ["has no line items", { lineItems: [] }, "at least one line item"],
    [
      "totals zero",
      { lineItems: [buildLineItem({ unitAmount: 0 })] },
      "greater than zero",
    ],
  ])("refuses to issue an invoice that %s", (_label, overrides, message) => {
    const result = issueInvoice(buildInvoice(overrides), issueArgs)
    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining(message),
    })
  })

  it("refuses to issue to a client without a billing email", () => {
    const result = issueInvoice(buildInvoice(), {
      ...issueArgs,
      client: buildClientSnapshot({ email: "" }),
    })
    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("email"),
    })
  })

  it("refuses to issue anything that is not a draft", () => {
    const result = issueInvoice(openInvoice(), issueArgs)
    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("draft"),
    })
  })
})

describe("updateDraft", () => {
  it("replaces editable fields on a draft", () => {
    const updated = expectOk(
      updateDraft(buildInvoice(), {
        lineItems: [buildLineItem({ description: "Discovery" })],
        memo: "Thanks!",
      })
    )
    expect(updated.lineItems[0]?.description).toBe("Discovery")
    expect(updated.memo).toBe("Thanks!")
  })

  it("locks issued invoices against edits", () => {
    const result = updateDraft(openInvoice(), { memo: "changed" })
    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("draft"),
    })
  })
})

describe("recordPayment", () => {
  const at = new Date("2026-11-05T12:00:00.000Z")

  it("records a partial payment and keeps the invoice open", () => {
    const invoice = openInvoice({
      lineItems: [buildLineItem({ unitAmount: 100_000 })],
    })
    const paid = expectOk(
      recordPayment(invoice, buildPayment({ amount: 40_000 }), {
        actorId: ACTOR,
        at,
      })
    )

    expect(paid.status).toBe("open")
    expect(paid.payments).toHaveLength(1)
    expect(paid.events.at(-1)).toMatchObject({ type: "payment_recorded" })
  })

  it("marks the invoice paid once nothing is left to pay", () => {
    const invoice = openInvoice({
      lineItems: [buildLineItem({ unitAmount: 100_000 })],
    })
    const paid = expectOk(
      recordPayment(invoice, buildPayment({ amount: 100_000 }), {
        actorId: ACTOR,
        at,
      })
    )

    expect(paid.status).toBe("paid")
    expect(paid.events.map((event) => event.type)).toEqual(
      expect.arrayContaining(["payment_recorded", "paid"])
    )
  })

  it("rejects payments larger than the amount due", () => {
    const invoice = openInvoice({
      lineItems: [buildLineItem({ unitAmount: 100_000 })],
    })
    const result = recordPayment(invoice, buildPayment({ amount: 100_001 }), {
      actorId: ACTOR,
      at,
    })
    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("exceeds"),
    })
  })

  it.each(["draft", "void", "paid"] as const)(
    "rejects payments on a %s invoice",
    (status) => {
      const result = recordPayment(buildInvoice({ status }), buildPayment(), {
        actorId: ACTOR,
        at,
      })
      expect(result.ok).toBe(false)
    }
  )

  it("accepts a late payment on an uncollectible invoice", () => {
    const written_off = expectOk(
      markUncollectible(openInvoice(), { actorId: ACTOR, at })
    )
    const paid = expectOk(
      recordPayment(written_off, buildPayment({ amount: 10_000 }), {
        actorId: ACTOR,
        at,
      })
    )
    expect(paid.status).toBe("paid")
  })

  it("ignores a Stripe event it has already recorded", () => {
    const invoice = openInvoice({
      lineItems: [buildLineItem({ unitAmount: 100_000 })],
    })
    const payment = buildPayment({ amount: 10_000, stripeEventId: "evt_1" })
    const once = expectOk(
      recordPayment(invoice, payment, { actorId: ACTOR, at })
    )
    const twice = expectOk(recordPayment(once, payment, { actorId: ACTOR, at }))

    expect(twice).toBe(once)
    expect(twice.payments).toHaveLength(1)
  })
})

describe("voidInvoice and markUncollectible", () => {
  const at = new Date("2026-11-20T00:00:00.000Z")

  it("voids an open invoice with no payments", () => {
    const voided = expectOk(voidInvoice(openInvoice(), { actorId: ACTOR, at }))
    expect(voided.status).toBe("void")
    expect(voided.events.at(-1)).toMatchObject({ type: "voided" })
  })

  it("refuses to void an invoice that has received payments", () => {
    const invoice = openInvoice({
      lineItems: [buildLineItem({ unitAmount: 100_000 })],
    })
    const partiallyPaid = expectOk(
      recordPayment(invoice, buildPayment({ amount: 1_000 }), {
        actorId: ACTOR,
        at,
      })
    )
    expect(voidInvoice(partiallyPaid, { actorId: ACTOR, at })).toEqual({
      ok: false,
      error: expect.stringContaining("payments"),
    })
  })

  it("refuses to void drafts, which are deleted instead", () => {
    expect(voidInvoice(buildInvoice(), { actorId: ACTOR, at }).ok).toBe(false)
  })

  it("only writes off open invoices", () => {
    expect(markUncollectible(openInvoice(), { actorId: ACTOR, at }).ok).toBe(
      true
    )
    expect(markUncollectible(buildInvoice(), { actorId: ACTOR, at }).ok).toBe(
      false
    )
  })
})

describe("displayStatus", () => {
  it("reports open invoices past their due date as overdue", () => {
    const invoice = openInvoice()
    expect(displayStatus(invoice, new Date("2026-11-16T23:59:59.000Z"))).toBe(
      "open"
    )
    expect(displayStatus(invoice, new Date("2026-11-17T00:00:00.000Z"))).toBe(
      "overdue"
    )
  })

  it("passes every other status through", () => {
    expect(displayStatus(buildInvoice(), new Date("2030-01-01"))).toBe("draft")
  })
})

describe("invoiceBadge", () => {
  const NOW = new Date("2026-11-10T00:00:00.000Z")
  const card = buildPayment({ amount: 10_000, method: "stripe" })
  const adjustment = (kind: "refund" | "invoice_credit", amount: number) => ({
    creditNoteId: `cn_${amount}`,
    number: "CN-2026-0001",
    kind,
    amount,
  })
  const paid = (overrides = {}) =>
    buildInvoice({
      status: "paid",
      lineItems: [buildLineItem({ quantity: 1, unitAmount: 10_000 })],
      payments: [card],
      ...overrides,
    })

  it("shows a plain paid invoice as paid and an overdue one as overdue", () => {
    expect(invoiceBadge(paid(), NOW)).toBe("paid")
    expect(invoiceBadge(paid({ lineItems: [], payments: [] }), NOW)).toBe(
      "paid"
    )
    expect(invoiceBadge(openInvoice(), new Date("2026-12-01"))).toBe("overdue")
  })

  it("shows partly and fully refunded invoices", () => {
    expect(
      invoiceBadge(paid({ adjustments: [adjustment("refund", 4_000)] }), NOW)
    ).toBe("partially_refunded")
    expect(
      invoiceBadge(
        paid({
          adjustments: [
            adjustment("refund", 4_000),
            adjustment("refund", 6_000),
          ],
        }),
        NOW
      )
    ).toBe("refunded")
  })

  it("shows invoices settled without card or cash as settled by credit", () => {
    expect(
      invoiceBadge(
        paid({
          payments: [],
          adjustments: [adjustment("invoice_credit", 10_000)],
        }),
        NOW
      )
    ).toBe("settled_by_credit")
    expect(
      invoiceBadge(
        paid({
          payments: [buildPayment({ amount: 10_000, method: "credit" })],
        }),
        NOW
      )
    ).toBe("settled_by_credit")
  })

  it("flags an open dispute until it closes", () => {
    const disputed = { type: "disputed" as const, at: NOW, detail: "dp_1" }
    const closed = {
      type: "dispute_closed" as const,
      at: NOW,
      detail: "dp_1:won",
    }
    expect(invoiceBadge(paid({ events: [disputed] }), NOW)).toBe("disputed")
    expect(invoiceBadge(paid({ events: [disputed, closed] }), NOW)).toBe("paid")
  })
})

describe("formatInvoiceNumber", () => {
  it("pads the yearly sequence to four digits", () => {
    expect(formatInvoiceNumber({ year: 2026, sequence: 7 })).toBe(
      "CAD-2026-0007"
    )
    expect(formatInvoiceNumber({ year: 2027, sequence: 12_345 })).toBe(
      "CAD-2027-12345"
    )
  })
})
