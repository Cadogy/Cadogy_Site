import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PayBalance, type PayableInvoice } from "./pay-balance"

const invoice = (overrides: Partial<PayableInvoice> = {}): PayableInvoice => ({
  id: "inv_1",
  number: "INV-2026-0001",
  amountDue: 10_000,
  currency: "USD",
  dueLabel: "Nov 16, 2026",
  overdue: false,
  href: "/invoice/tok_1",
  ...overrides,
})

const twoInvoices = [
  invoice(),
  invoice({
    id: "inv_2",
    number: "INV-2026-0002",
    amountDue: 5_000,
    href: "/invoice/tok_2",
  }),
]

describe("PayBalance", () => {
  it("pays every open invoice in one checkout by default", async () => {
    const onPay = vi.fn(async () => null)
    const user = userEvent.setup()
    render(
      <PayBalance invoices={twoInvoices} onPay={onPay} onlinePaymentAvailable />
    )

    await user.click(screen.getByRole("button", { name: "Pay $150.00" }))

    expect(onPay).toHaveBeenCalledWith(["inv_1", "inv_2"])
  })

  it("pays only the invoices the client selects", async () => {
    const onPay = vi.fn(async () => null)
    const user = userEvent.setup()
    render(
      <PayBalance invoices={twoInvoices} onPay={onPay} onlinePaymentAvailable />
    )

    await user.click(screen.getByRole("checkbox", { name: /INV-2026-0001/ }))
    await user.click(screen.getByRole("button", { name: "Pay $50.00" }))

    expect(onPay).toHaveBeenCalledWith(["inv_2"])
  })

  it("can't pay when nothing is selected", async () => {
    const user = userEvent.setup()
    render(
      <PayBalance
        invoices={[invoice()]}
        onPay={vi.fn()}
        onlinePaymentAvailable
      />
    )

    await user.click(screen.getByRole("checkbox", { name: /INV-2026-0001/ }))

    expect(
      screen.getByRole("button", { name: "Select invoices to pay" })
    ).toBeDisabled()
  })

  it("explains why a payment couldn't start", async () => {
    const onPay = vi.fn(async () => ({
      ok: false,
      message: "Pay invoices in different currencies separately",
    }))
    const user = userEvent.setup()
    render(
      <PayBalance invoices={[invoice()]} onPay={onPay} onlinePaymentAvailable />
    )

    await user.click(screen.getByRole("button", { name: "Pay $100.00" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Pay invoices in different currencies separately"
    )
  })

  it("points to the invoice instructions when online payment is off", () => {
    render(
      <PayBalance
        invoices={[invoice()]}
        onPay={vi.fn()}
        onlinePaymentAvailable={false}
      />
    )

    expect(
      screen.queryByRole("button", { name: /Pay/ })
    ).not.toBeInTheDocument()
    expect(screen.getByText(/payment instructions/i)).toBeInTheDocument()
  })
})
