import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const sent = vi.hoisted(() => ({
  calls: [] as Record<string, string>[],
  result: null as { ok: boolean; message: string } | null,
}))

vi.mock("../server/actions", () => ({
  openTicketAction: async (_previous: unknown, formData: FormData) => {
    sent.calls.push(Object.fromEntries(formData) as Record<string, string>)
    return sent.result
  },
}))

const { NewTicketForm } = await import("./new-ticket-form")

const DRAFT_KEY = "cadogy:support-draft"

describe("NewTicketForm", () => {
  beforeEach(() => {
    sent.calls = []
    sent.result = null
    window.localStorage.clear()
  })

  it("explains what's missing instead of sending an empty request", async () => {
    const user = userEvent.setup()
    render(<NewTicketForm />)

    await user.click(screen.getByRole("button", { name: "Send request" }))

    expect(sent.calls).toEqual([])
    expect(screen.getByText("Add a short subject.")).toBeInTheDocument()
    expect(screen.getByLabelText("Subject")).toHaveFocus()
  })

  it("adapts the guidance to the chosen category", async () => {
    const user = userEvent.setup()
    render(<NewTicketForm />)

    await user.click(screen.getByRole("radio", { name: /Bug report/ }))

    expect(screen.getByLabelText("Subject")).toHaveAttribute(
      "placeholder",
      expect.stringContaining("Totals are wrong")
    )
    expect(screen.getByText(/Steps to reproduce/)).toBeInTheDocument()
  })

  it("sends with Ctrl+Enter and clears the saved draft", async () => {
    const user = userEvent.setup()
    render(<NewTicketForm />)

    await user.type(screen.getByLabelText("Subject"), "Checkout is down")
    await user.type(
      screen.getByLabelText("Details"),
      "The checkout page shows a blank screen."
    )
    expect(window.localStorage.getItem(DRAFT_KEY)).toContain("Checkout is down")
    await user.keyboard("{Control>}{Enter}{/Control}")

    await waitFor(() => expect(sent.calls).toHaveLength(1))
    expect(sent.calls[0]).toMatchObject({
      category: "general",
      subject: "Checkout is down",
      message: "The checkout page shows a blank screen.",
    })
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it("keeps the draft when sending fails", async () => {
    sent.result = { ok: false, message: "Something went wrong." }
    const user = userEvent.setup()
    render(<NewTicketForm />)

    await user.type(screen.getByLabelText("Subject"), "Invoice question")
    await user.type(screen.getByLabelText("Details"), "Is INV-7 correct?")
    await user.click(screen.getByRole("button", { name: "Send request" }))

    expect(await screen.findByText("Something went wrong.")).toBeVisible()
    expect(window.localStorage.getItem(DRAFT_KEY)).toContain("Invoice question")
  })

  it("restores an unsent draft and can start over", async () => {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        category: "billing",
        subject: "Refund for INV-3",
        message: "We were charged twice.",
      })
    )
    const user = userEvent.setup()
    render(<NewTicketForm />)

    expect(screen.getByLabelText("Subject")).toHaveValue("Refund for INV-3")
    expect(screen.getByRole("radio", { name: /Billing/ })).toBeChecked()
    await user.click(screen.getByRole("button", { name: "Start over" }))

    expect(screen.getByLabelText("Subject")).toHaveValue("")
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it("lets a prefilled link win over an old draft", () => {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ category: "technical", subject: "Old", message: "" })
    )
    render(
      <NewTicketForm
        initialCategory="billing"
        initialSubject="Question about invoice INV-2026-0042"
      />
    )

    expect(screen.getByLabelText("Subject")).toHaveValue(
      "Question about invoice INV-2026-0042"
    )
    expect(screen.getByRole("radio", { name: /Billing/ })).toBeChecked()
  })

  it("works when browser storage is blocked", async () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked")
      })
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked")
      })
    const user = userEvent.setup()
    render(<NewTicketForm />)

    await user.type(screen.getByLabelText("Subject"), "Still works")

    expect(screen.getByLabelText("Subject")).toHaveValue("Still works")
    getItem.mockRestore()
    setItem.mockRestore()
  })
})
