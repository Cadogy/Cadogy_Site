import { describe, expect, it } from "vitest"

import {
  allocatePayment,
  consolidateCharges,
  dueReminders,
  reminderKey,
} from "./collections"
import { buildInvoice, buildLineItem } from "./test-factories"

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

const charge = (
  overrides: Partial<Parameters<typeof consolidateCharges>[0][number]> = {}
) => ({
  id: "ch_1",
  clientId: "client_a",
  description: "Business email (Nov 1 – Nov 30, 2026)",
  quantity: 1,
  unitAmount: 800,
  currency: "USD" as const,
  ...overrides,
})

describe("consolidateCharges", () => {
  it("puts everything a client owes in one currency on a single invoice", () => {
    const groups = consolidateCharges([
      charge({ id: "c1" }),
      charge({ id: "c2", description: "Hosting", unitAmount: 2_000 }),
      charge({ id: "c3", clientId: "client_b" }),
    ])

    expect(groups).toEqual([
      {
        clientId: "client_a",
        currency: "USD",
        chargeIds: ["c1", "c2"],
        lineItems: [
          {
            description: "Business email (Nov 1 – Nov 30, 2026)",
            quantity: 1,
            unitAmount: 800,
          },
          { description: "Hosting", quantity: 1, unitAmount: 2_000 },
        ],
      },
      {
        clientId: "client_b",
        currency: "USD",
        chargeIds: ["c3"],
        lineItems: [
          {
            description: "Business email (Nov 1 – Nov 30, 2026)",
            quantity: 1,
            unitAmount: 800,
          },
        ],
      },
    ])
  })

  it("never mixes currencies on one invoice", () => {
    const groups = consolidateCharges([
      charge({ id: "c1" }),
      charge({ id: "c2", currency: "EUR" }),
    ])
    expect(groups.map((group) => [group.currency, group.chargeIds])).toEqual([
      ["USD", ["c1"]],
      ["EUR", ["c2"]],
    ])
  })
})

describe("allocatePayment", () => {
  const open = (id: string, due: string, amount: number, paid = 0) =>
    buildInvoice({
      id,
      status: "open",
      dueDate: day(due),
      lineItems: [buildLineItem({ unitAmount: amount })],
      payments: paid
        ? [{ amount: paid, method: "stripe", reference: "", paidAt: day(due) }]
        : [],
    })

  it("pays the oldest invoices first, each up to what is still owed", () => {
    const result = allocatePayment(
      [
        open("late", "2026-12-01", 5_000),
        open("early", "2026-11-01", 3_000, 1_000),
      ],
      7_000
    )
    expect(result).toEqual({
      allocations: [
        { invoiceId: "early", amount: 2_000 },
        { invoiceId: "late", amount: 5_000 },
      ],
      unallocated: 0,
    })
  })

  it("reports money it could not apply instead of dropping it", () => {
    expect(allocatePayment([open("a", "2026-11-01", 1_000)], 1_500)).toEqual({
      allocations: [{ invoiceId: "a", amount: 1_000 }],
      unallocated: 500,
    })
  })

  it("skips invoices that are already settled", () => {
    expect(
      allocatePayment(
        [open("a", "2026-11-01", 1_000, 1_000), open("b", "2026-11-02", 400)],
        400
      )
    ).toEqual({
      allocations: [{ invoiceId: "b", amount: 400 }],
      unallocated: 0,
    })
  })
})

describe("dueReminders", () => {
  const invoice = buildInvoice({ status: "open", dueDate: day("2026-11-16") })
  const offsets = [-3, 0, 7]

  it("sends each reminder on its offset from the due date", () => {
    expect(dueReminders(invoice, day("2026-11-12"), offsets)).toEqual([])
    expect(dueReminders(invoice, day("2026-11-13"), offsets)).toEqual([-3])
    expect(dueReminders(invoice, day("2026-11-16"), offsets)).toEqual([0])
  })

  it("never repeats a reminder that was already sent", () => {
    const reminded = {
      ...invoice,
      events: [
        {
          type: "reminder_sent" as const,
          at: day("2026-11-13"),
          detail: reminderKey(-3),
        },
      ],
    }
    expect(dueReminders(reminded, day("2026-11-16"), offsets)).toEqual([0])
  })

  it("only chases open invoices", () => {
    expect(
      dueReminders({ ...invoice, status: "paid" }, day("2026-12-31"), offsets)
    ).toEqual([])
  })

  it("only sends the most recent overdue reminder after a long gap", () => {
    expect(dueReminders(invoice, day("2026-11-30"), offsets)).toEqual([7])
  })
})
