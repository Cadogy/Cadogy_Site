import { describe, expect, it } from "vitest"

import {
  buildClientSnapshot,
  buildInvoice,
  buildLineItem,
  buildPayment,
} from "../domain/test-factories"
import { renderBillingEmail } from "./templates"

const issued = buildInvoice({
  status: "open",
  number: "CAD-2026-0042",
  clientSnapshot: buildClientSnapshot({ name: "Ada<script> Lovelace" }),
  issueDate: new Date("2026-11-01T00:00:00.000Z"),
  dueDate: new Date("2026-11-16T00:00:00.000Z"),
  lineItems: [buildLineItem({ quantity: 2, unitAmount: 125_000 })],
  publicToken: "abc123",
})

type Kind = "issued" | "reminder" | "receipt" | "autopay_failed"

const render = (
  kind: Kind,
  invoice = issued,
  extra: { attached?: boolean; now?: Date } = {}
) =>
  renderBillingEmail({
    kind,
    invoice,
    baseUrl: "https://cadogy.com",
    ...extra,
  })

describe("renderBillingEmail", () => {
  it("leads a new invoice with the amount due and a pay link", async () => {
    const email = await render("issued")

    expect(email.subject).toBe(
      "Invoice CAD-2026-0042 from Cadogy — $2,500.00 due Nov 16, 2026"
    )
    expect(email.html).toContain("https://cadogy.com/invoice/abc123")
    expect(email.text).toMatch(/Amount due\s+\$2,500\.00\s+Due Nov 16, 2026/)
    expect(email.text).toContain("View and pay invoice")
  })

  it("summarises the invoice lines and totals", async () => {
    const many = {
      ...issued,
      lineItems: Array.from({ length: 6 }, (_, index) =>
        buildLineItem({ description: `Line ${index + 1}`, unitAmount: 1_000 })
      ),
    }
    const { text } = await render("issued", many)

    expect(text).toContain("Line 4")
    expect(text).not.toContain("Line 5")
    expect(text).toContain("and 2 more items")
    expect(text).toMatch(/Total\s+\$60\.00/)
  })

  it("mentions the PDF only when one is attached", async () => {
    expect((await render("issued", issued, { attached: true })).text).toContain(
      "A PDF copy is attached."
    )
    expect((await render("issued")).text).not.toContain("PDF")
  })

  it("escapes client-provided text", async () => {
    const email = await render("issued")

    expect(email.html).not.toContain("<script>")
    expect(email.html).toContain("Ada&lt;script&gt;")
  })

  it("says why the email was sent", async () => {
    const { text } = await render("issued")

    expect(text).toContain("because you're a billing contact")
  })

  it("words reminders around the remaining balance", async () => {
    const partiallyPaid = {
      ...issued,
      payments: [buildPayment({ amount: 50_000 })],
    }

    expect((await render("reminder", partiallyPaid)).subject).toBe(
      "Reminder: invoice CAD-2026-0042 — $2,000.00 due Nov 16, 2026"
    )
  })

  it("firms up the reminder once the invoice is late", async () => {
    const before = await render("reminder", issued, {
      now: new Date("2026-11-13T12:00:00.000Z"),
    })
    const onTheDay = await render("reminder", issued, {
      now: new Date("2026-11-16T20:00:00.000Z"),
    })
    const late = await render("reminder", issued, {
      now: new Date("2026-11-23T09:00:00.000Z"),
    })

    expect(before.text).toContain("Invoice CAD-2026-0042 is due Nov 16, 2026")
    expect(onTheDay.text).toContain("Invoice CAD-2026-0042 is due today")
    expect(late.text).toContain("Invoice CAD-2026-0042 is 7 days overdue")
    expect(late.text).toContain("If something's holding it up")
  })

  it("confirms the latest payment on receipts", async () => {
    const paid = {
      ...issued,
      status: "paid" as const,
      payments: [buildPayment({ amount: 250_000 })],
    }
    const email = await render("receipt", paid)

    expect(email.subject).toBe(
      "Receipt for invoice CAD-2026-0042 — $2,500.00 received"
    )
    expect(email.text).toContain("Payment received")
    expect(email.text).toContain("Paid in full")
  })

  it("asks the client to pay manually when autopay fails", async () => {
    const email = await render("autopay_failed")

    expect(email.subject).toBe(
      "Action needed: payment for invoice CAD-2026-0042 didn't go through"
    )
    expect(email.text).toContain("We couldn't charge your saved card")
    expect(email.html).toContain("https://cadogy.com/invoice/abc123")
    expect(email.html).toContain("https://cadogy.com/dashboard/billing")
  })
})
