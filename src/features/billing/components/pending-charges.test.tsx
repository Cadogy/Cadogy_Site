import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PendingCharges } from "./pending-charges"

const charges = [
  {
    id: "ch_1",
    description: "Business email × 3 (Nov 1 – Nov 30, 2026)",
    amountLabel: "$24.00",
  },
  { id: "ch_2", description: "Logo refresh", amountLabel: "$500.00" },
]

const ok = { ok: true, message: "Invoice issued and emailed." }

describe("PendingCharges", () => {
  it("bills everything pending on one invoice", async () => {
    const onBill = vi.fn(async () => ok)
    const user = userEvent.setup()
    render(
      <PendingCharges charges={charges} onBill={onBill} onRemove={vi.fn()} />
    )

    await user.click(screen.getByRole("button", { name: "Bill all" }))

    expect(onBill).toHaveBeenCalledWith("all")
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Invoice issued and emailed."
    )
  })

  it("bills only the selected charges", async () => {
    const onBill = vi.fn(async () => ok)
    const user = userEvent.setup()
    render(
      <PendingCharges charges={charges} onBill={onBill} onRemove={vi.fn()} />
    )

    expect(screen.getByRole("button", { name: "Bill selected" })).toBeDisabled()
    await user.click(screen.getByRole("checkbox", { name: /Logo refresh/ }))
    await user.click(screen.getByRole("button", { name: "Bill selected" }))

    expect(onBill).toHaveBeenCalledWith(["ch_2"])
  })

  it("removes a charge that shouldn't be billed", async () => {
    const onRemove = vi.fn(async () => ({
      ok: true,
      message: "Charge removed.",
    }))
    const user = userEvent.setup()
    render(
      <PendingCharges charges={charges} onBill={vi.fn()} onRemove={onRemove} />
    )

    await user.click(
      screen.getByRole("button", { name: "Remove Logo refresh" })
    )

    expect(onRemove).toHaveBeenCalledWith("ch_2")
  })

  it("says when nothing is waiting to be billed", () => {
    render(<PendingCharges charges={[]} onBill={vi.fn()} onRemove={vi.fn()} />)

    expect(
      screen.getByText("Nothing waiting to be billed.")
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Bill all" })
    ).not.toBeInTheDocument()
  })
})
