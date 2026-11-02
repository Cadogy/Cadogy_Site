import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { BalanceCreditForm } from "./credit-balance"
import { CreditNoteList } from "./credit-note-list"

const note = (overrides = {}) => ({
  id: "cn_1",
  number: "CN-2026-0001",
  invoiceId: "inv_1",
  kind: "refund" as const,
  amount: 4_000,
  currency: "USD" as const,
  reason: "Goodwill",
  createdAt: new Date("2026-11-02T12:00:00.000Z"),
  ...overrides,
})

describe("BalanceCreditForm", () => {
  it("adds credit in the client's currency", async () => {
    const onSubmit = vi.fn(async () => ({
      ok: true,
      message: "Added as CN-2026-0002.",
    }))
    const user = userEvent.setup()
    render(<BalanceCreditForm currency="EUR" onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText("Amount"), "250")
    await user.type(screen.getByLabelText("Reason"), "Service credit")
    await user.click(screen.getByRole("button", { name: "Add credit" }))

    expect(onSubmit).toHaveBeenCalledWith({
      amount: "250",
      reason: "Service credit",
      currency: "EUR",
    })
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Added as CN-2026-0002."
    )
  })
})

describe("CreditNoteList", () => {
  it("lists each credit note with its type, amount and invoice", () => {
    render(
      <CreditNoteList
        notes={[
          note(),
          note({
            id: "cn_2",
            number: "CN-2026-0002",
            kind: "balance_credit",
            invoiceId: null,
            amount: 25_000,
            reason: "Service credit",
          }),
        ]}
        hrefFor={(invoiceId) => `/admin/billing/invoices/${invoiceId}`}
      />
    )

    const refund = screen.getByRole("listitem", { name: /CN-2026-0001/ })
    expect(within(refund).getByText("Refund · Goodwill")).toBeInTheDocument()
    expect(within(refund).getByText("$40.00")).toBeInTheDocument()
    expect(within(refund).getByRole("link")).toHaveAttribute(
      "href",
      "/admin/billing/invoices/inv_1"
    )

    const balance = screen.getByRole("listitem", { name: /CN-2026-0002/ })
    expect(
      within(balance).getByText("Account credit · Service credit")
    ).toBeInTheDocument()
    expect(within(balance).queryByRole("link")).not.toBeInTheDocument()
  })

  it("says so when there are none", () => {
    render(<CreditNoteList notes={[]} hrefFor={() => "/"} />)
    expect(screen.getByText("No credit notes yet.")).toBeInTheDocument()
  })
})
