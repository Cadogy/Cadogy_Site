import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PendingCharges } from "./pending-charges"

const charges = [
  {
    id: "ch_1",
    description: "Business email × 3 (Nov 1 – Nov 30, 2026)",
    amountLabel: "$24.00",
    quantity: 3,
    unitAmount: 800,
  },
  {
    id: "ch_2",
    description: "Logo refresh",
    amountLabel: "$500.00",
    quantity: 1,
    unitAmount: 50_000,
  },
]

const ok = { ok: true, message: "Invoice issued and emailed." }

describe("PendingCharges", () => {
  it("bills everything pending on one invoice", async () => {
    const onBill = vi.fn(async () => ok)
    const user = userEvent.setup()
    render(
      <PendingCharges
        charges={charges}
        onBill={onBill}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
      />
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
      <PendingCharges
        charges={charges}
        onBill={onBill}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
      />
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
      <PendingCharges
        charges={charges}
        onBill={vi.fn()}
        onRemove={onRemove}
        onUpdate={vi.fn()}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Remove Logo refresh" })
    )

    expect(onRemove).toHaveBeenCalledWith("ch_2")
  })

  it("says when nothing is waiting to be billed", () => {
    render(
      <PendingCharges
        charges={[]}
        onBill={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
      />
    )

    expect(
      screen.getByText("Nothing waiting to be billed.")
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Bill all" })
    ).not.toBeInTheDocument()
  })

  it("edits a pending charge before it's billed", async () => {
    const onUpdate = vi.fn(async () => ({
      ok: true,
      message: "Charge updated.",
    }))
    const user = userEvent.setup()
    render(
      <PendingCharges
        charges={charges}
        onBill={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={onUpdate}
      />
    )

    const [, logo] = screen.getAllByText("Edit")
    await user.click(logo!)
    const price = document.getElementById("charge-ch_2-price")!
    expect(price).toHaveValue("500.00")
    await user.clear(price)
    await user.type(price, "450")
    await user.click(
      within(price.closest("form")!).getByRole("button", {
        name: "Save charge",
      })
    )

    expect(onUpdate).toHaveBeenCalledTimes(1)
    const [chargeId, , formData] = onUpdate.mock.calls[0] as unknown as [
      string,
      unknown,
      FormData,
    ]
    expect(chargeId).toBe("ch_2")
    expect(formData.get("price")).toBe("450")
    expect(formData.get("description")).toBe("Logo refresh")
  })

  it("shows pending charges read-only for an archived client", () => {
    render(
      <PendingCharges
        charges={charges}
        onBill={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
        readOnly
      />
    )

    expect(screen.getByText("Logo refresh")).toBeInTheDocument()
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Bill all" })
    ).not.toBeInTheDocument()
    expect(screen.queryByText("Edit")).not.toBeInTheDocument()
  })
})
