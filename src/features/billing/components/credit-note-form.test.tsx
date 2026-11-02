import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CreditNoteForm } from "./credit-note-form"

const ok = async () => ({ ok: true, message: "Refunded as CN-2026-0001." })

const props = (overrides = {}) => ({
  refundable: "100.00",
  owed: null,
  onSubmit: vi.fn(ok),
  ...overrides,
})

describe("CreditNoteForm", () => {
  it("refunds a paid card invoice up to what's refundable", async () => {
    const given = props()
    const user = userEvent.setup()
    render(<CreditNoteForm {...given} />)

    expect(screen.queryByLabelText("Type")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Amount")).toHaveValue("100.00")
    await user.clear(screen.getByLabelText("Amount"))
    await user.type(screen.getByLabelText("Amount"), "40")
    await user.type(screen.getByLabelText("Reason"), "Goodwill")
    await user.click(screen.getByRole("button", { name: "Refund to card" }))

    expect(given.onSubmit).toHaveBeenCalledWith({
      kind: "refund",
      amount: "40",
      reason: "Goodwill",
    })
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Refunded as CN-2026-0001."
    )
  })

  it("lets staff choose between a refund and a credit when both apply", async () => {
    const given = props({ refundable: "50.00", owed: "50.00" })
    const user = userEvent.setup()
    render(<CreditNoteForm {...given} />)

    await user.selectOptions(screen.getByLabelText("Type"), "invoice_credit")
    await user.type(screen.getByLabelText("Reason"), "Late delivery")
    await user.click(screen.getByRole("button", { name: "Issue credit" }))

    expect(given.onSubmit).toHaveBeenCalledWith({
      kind: "invoice_credit",
      amount: "50.00",
      reason: "Late delivery",
    })
  })

  it("shows the error when the credit note is refused", async () => {
    const given = props({
      onSubmit: vi.fn(async () => ({
        ok: false,
        message: "Credit notes over $1,000 need the owner.",
      })),
    })
    const user = userEvent.setup()
    render(<CreditNoteForm {...given} />)

    await user.type(screen.getByLabelText("Reason"), "Goodwill")
    await user.click(screen.getByRole("button", { name: "Refund to card" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Credit notes over $1,000 need the owner."
    )
  })
})
