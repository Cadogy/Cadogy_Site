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
  clientSnapshot: buildClientSnapshot({ name: "Ada <script>" }),
  issueDate: new Date("2026-11-01T00:00:00.000Z"),
  dueDate: new Date("2026-11-16T00:00:00.000Z"),
  lineItems: [buildLineItem({ quantity: 2, unitAmount: 125_000 })],
  publicToken: "abc123",
})

const render = (
  kind: "issued" | "reminder" | "receipt" | "autopay_failed",
  invoice = issued
) => renderBillingEmail({ kind, invoice, baseUrl: "https://cadogy.com" })

describe("renderBillingEmail", () => {
  it("summarises a new invoice with amount, due date and a pay link", () => {
    const email = render("issued")
    expect(email.subject).toBe(
      "Invoice CAD-2026-0042 from Cadogy — $2,500.00 due Nov 16, 2026"
    )
    expect(email.html).toContain("https://cadogy.com/invoice/abc123")
    expect(email.text).toContain("$2,500.00")
  })

  it("escapes client-provided text", () => {
    const email = render("issued")
    expect(email.html).not.toContain("<script>")
    expect(email.html).toContain("Ada &lt;script&gt;")
  })

  it("words reminders around the remaining balance", () => {
    const partiallyPaid = {
      ...issued,
      payments: [buildPayment({ amount: 50_000 })],
    }
    expect(render("reminder", partiallyPaid).subject).toBe(
      "Reminder: invoice CAD-2026-0042 — $2,000.00 due Nov 16, 2026"
    )
  })

  it("confirms the latest payment on receipts", () => {
    const paid = {
      ...issued,
      status: "paid" as const,
      payments: [buildPayment({ amount: 250_000 })],
    }
    const email = render("receipt", paid)
    expect(email.subject).toBe(
      "Receipt for invoice CAD-2026-0042 — $2,500.00 received"
    )
    expect(email.text).toContain("Paid in full")
  })

  it("asks the client to pay manually when autopay fails", () => {
    const email = render("autopay_failed")
    expect(email.subject).toBe(
      "Action needed: payment for invoice CAD-2026-0042 didn't go through"
    )
    expect(email.text).toContain("We couldn't charge your saved card")
    expect(email.html).toContain("https://cadogy.com/invoice/abc123")
  })
})
