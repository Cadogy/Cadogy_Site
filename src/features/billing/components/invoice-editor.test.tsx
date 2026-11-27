import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { saveDraftAction } from "../server/actions"
import type { CatalogOption, EditorState } from "./editor-model"
import { InvoiceEditor } from "./invoice-editor"

vi.mock("../server/actions", () => ({
  saveDraftAction: vi.fn(async () => ({ ok: true, message: "Draft saved." })),
  issueInvoiceAction: vi.fn(),
  deleteDraftAction: vi.fn(),
}))

const initial: EditorState = {
  clientId: "c1",
  currency: "USD",
  termsDays: "15",
  lineItems: [],
  discountType: "none",
  discountValue: "",
  taxRate: "",
  memo: "",
  footer: "",
  internalNotes: "",
  dueDate: "",
}

const clients = [
  { id: "c1", label: "Analytical", currency: "USD" as const, termsDays: 15 },
  { id: "c2", label: "Euro Client", currency: "EUR" as const, termsDays: 30 },
]

const catalog: CatalogOption[] = [
  {
    id: "eng",
    name: "Engineering",
    categoryId: "dev",
    categoryName: "Development",
    currency: "USD",
    hourly: true,
    unitAmount: 15_000,
  },
  {
    id: "host",
    name: "Hosting setup",
    categoryId: null,
    categoryName: null,
    currency: "USD",
    hourly: false,
    unitAmount: 25_000,
  },
  {
    id: "eur",
    name: "Euro audit",
    categoryId: null,
    categoryName: null,
    currency: "EUR",
    hourly: false,
    unitAmount: 40_000,
  },
]

const renderEditor = () =>
  render(
    <InvoiceEditor
      invoiceId="inv_1"
      initial={initial}
      clients={clients}
      catalog={catalog}
    />
  )

const picker = () => screen.getByLabelText("Add from your services")

describe("InvoiceEditor catalog picker", () => {
  beforeEach(() => vi.mocked(saveDraftAction).mockClear())

  it("groups services by category and hides other currencies", () => {
    renderEditor()
    const groups = within(picker()).getAllByRole("group")
    expect(groups.map((group) => group.getAttribute("label"))).toEqual([
      "Development",
      "Uncategorized",
    ])
    expect(
      within(picker()).queryByRole("option", { name: /Euro audit/ })
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/1 service priced in other currencies is hidden/)
    ).toBeInTheDocument()
  })

  it("adds a priced line, replacing the empty starter line", async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.selectOptions(picker(), "eng")

    expect(screen.getAllByLabelText(/^Line \d description$/)).toHaveLength(1)
    expect(screen.getByLabelText("Line 1 description")).toHaveValue(
      "Engineering"
    )
    expect(screen.getAllByLabelText("Unit price")[0]).toHaveValue("150.00")
    expect(screen.getByText("hrs")).toBeInTheDocument()
    expect(picker()).toHaveValue("")
  })

  it("saves hourly lines with their unit and the hours entered", async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.selectOptions(picker(), "eng")
    await user.selectOptions(picker(), "host")
    const [hours] = screen.getAllByLabelText("Quantity")
    await user.clear(hours!)
    await user.type(hours!, "2.5")
    await user.click(screen.getByRole("button", { name: "Save draft" }))

    await waitFor(() => expect(saveDraftAction).toHaveBeenCalled())
    expect(vi.mocked(saveDraftAction).mock.calls[0]?.[1]).toMatchObject({
      lineItems: [
        {
          description: "Engineering",
          quantity: 2.5,
          unitAmount: 15_000,
          unit: "hour",
        },
        { description: "Hosting setup", quantity: 1, unitAmount: 25_000 },
      ],
    })
    // Subtotal and total: 2.5 h × $150 + $250, no tax or discount.
    expect(screen.getAllByText("$625.00")).toHaveLength(2)
  })

  it("switches currency, terms and the catalog when the client changes", async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.selectOptions(screen.getByLabelText("Client"), "c2")

    expect(screen.getByLabelText("Currency")).toHaveValue("EUR")
    expect(screen.getByLabelText("Payment terms (days)")).toHaveValue("30")
    expect(
      within(picker()).getByRole("option", { name: /Euro audit/ })
    ).toBeInTheDocument()
    expect(
      within(picker()).queryByRole("option", { name: /Engineering/ })
    ).not.toBeInTheDocument()
  })

  it("blocks quantities the server would reject", async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.selectOptions(picker(), "host")
    const [quantity] = screen.getAllByLabelText("Quantity")
    await user.clear(quantity!)
    await user.type(quantity!, "1.555")
    await user.click(screen.getByRole("button", { name: "Save draft" }))

    expect(saveDraftAction).not.toHaveBeenCalled()
    expect(
      screen.getAllByText(
        "Check line 1: quantity can have at most two decimal places."
      ).length
    ).toBeGreaterThan(0)
  })

  it("reorders lines with the move buttons", async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.selectOptions(picker(), "eng")
    await user.selectOptions(picker(), "host")

    expect(
      screen.getByRole("button", { name: "Move line 1 up" })
    ).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Move line 2 up" }))
    await user.click(screen.getByRole("button", { name: "Save draft" }))

    await waitFor(() => expect(saveDraftAction).toHaveBeenCalled())
    const payload = vi.mocked(saveDraftAction).mock.calls[0]?.[1] as {
      lineItems: { description: string }[]
    }
    expect(payload.lineItems.map((line) => line.description)).toEqual([
      "Hosting setup",
      "Engineering",
    ])
  })

  it("sends a fixed due date when one is set", async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.selectOptions(picker(), "host")

    await user.type(screen.getByLabelText(/Due date/), "2026-12-31")
    await user.click(screen.getByRole("button", { name: "Save draft" }))

    await waitFor(() => expect(saveDraftAction).toHaveBeenCalled())
    expect(vi.mocked(saveDraftAction).mock.calls[0]?.[1]).toMatchObject({
      dueDate: "2026-12-31",
    })
  })
})
