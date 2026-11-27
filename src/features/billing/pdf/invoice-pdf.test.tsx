import { describe, expect, it } from "vitest"

import {
  buildClientSnapshot,
  buildInvoice,
  buildLineItem,
  buildPayment,
} from "../domain/test-factories"
import { invoicePdfFilename, renderInvoicePdf } from "./invoice-pdf"

const invoice = buildInvoice({
  status: "open",
  number: "CAD-2026-0042",
  clientSnapshot: buildClientSnapshot({ name: "Ada Lovelace" }),
  issueDate: new Date("2026-11-01T00:00:00.000Z"),
  dueDate: new Date("2026-11-16T00:00:00.000Z"),
  lineItems: [
    buildLineItem({ description: "Website design", unitAmount: 150_000 }),
    buildLineItem({
      description: "Custom development",
      quantity: 2.5,
      unitAmount: 15_000,
      unit: "hour",
    }),
  ],
})

describe("invoice PDF", () => {
  it("renders a PDF document", async () => {
    const pdf = await renderInvoicePdf(invoice)

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-")
    expect(pdf.length).toBeGreaterThan(1_000)
  })

  it("is named as an invoice, or a receipt once paid", () => {
    expect(invoicePdfFilename(invoice)).toBe("Invoice CAD-2026-0042.pdf")
    expect(
      invoicePdfFilename({
        ...invoice,
        status: "paid",
        payments: [buildPayment({ amount: 187_500 })],
      })
    ).toBe("Receipt CAD-2026-0042.pdf")
  })
})
