import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { PayInvoicePanel } from "./pay-invoice-panel"

vi.mock("../server/actions", () => ({ startCheckoutAction: vi.fn() }))

const props = (overrides = {}) => ({
  token: "tok",
  payable: false,
  onlinePaymentAvailable: true,
  amountDueLabel: "$0.00",
  dueLabel: null,
  status: "paid" as const,
  badge: "paid" as const,
  paymentReturned: false,
  ...overrides,
})

describe("PayInvoicePanel", () => {
  it.each([
    ["paid", "Paid in full"],
    ["partially_refunded", "Part of this payment was refunded"],
    ["refunded", "Refunded"],
    ["settled_by_credit", "Settled by credit"],
    ["disputed", "Payment disputed"],
  ] as const)("explains a %s invoice", (badge, text) => {
    render(<PayInvoicePanel {...props({ badge })} />)
    expect(screen.getByText(new RegExp(text))).toBeInTheDocument()
  })

  it("never thanks the client for a payment that was refunded", () => {
    render(<PayInvoicePanel {...props({ badge: "refunded" })} />)
    expect(screen.queryByText(/Paid in full/)).not.toBeInTheDocument()
  })
})
