import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  buildClientSnapshot,
  buildInvoice,
  buildLineItem,
  buildPayment,
} from "../domain/test-factories"
import { InvoiceDocument } from "./invoice-document"

const invoice = buildInvoice({
  number: "INV-2026-0001",
  status: "open",
  lineItems: [
    buildLineItem({
      description: "Engineering",
      quantity: 2.5,
      unitAmount: 15_000,
      unit: "hour",
    }),
    buildLineItem({ description: "Hosting setup", quantity: 1 }),
  ],
  payments: [buildPayment({ amount: 5_000, reference: "WIRE-778" })],
})

const renderDocument = (showPaymentReferences: boolean) =>
  render(
    <InvoiceDocument
      invoice={invoice}
      client={buildClientSnapshot()}
      status="open"
      showPaymentReferences={showPaymentReferences}
    />
  )

describe("InvoiceDocument", () => {
  it("shows hourly lines in hours", () => {
    renderDocument(false)
    expect(screen.getAllByText(/2\.50 hrs/).length).toBeGreaterThan(0)
  })

  it("shows payment references to staff only", () => {
    const { unmount } = renderDocument(true)
    expect(screen.getByText(/WIRE-778/)).toBeInTheDocument()
    unmount()

    renderDocument(false)
    expect(screen.queryByText(/WIRE-778/)).not.toBeInTheDocument()
  })
})
