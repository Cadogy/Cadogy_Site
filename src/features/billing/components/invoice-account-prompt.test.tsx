import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { InvoiceAccountPrompt } from "./invoice-account-prompt"

describe("InvoiceAccountPrompt", () => {
  it("invites guests to sign in or create an account and come back", () => {
    render(
      <InvoiceAccountPrompt
        state="guest"
        invoicePath="/invoice/tok_1"
        onRequest={vi.fn()}
      />
    )

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?callbackUrl=%2Finvoice%2Ftok_1"
    )
    expect(
      screen.getByRole("link", { name: "Create an account" })
    ).toHaveAttribute("href", "/register")
  })

  it("tells contacts the invoice is already in their account", () => {
    render(
      <InvoiceAccountPrompt
        state="member"
        invoicePath="/invoice/tok_1"
        onRequest={vi.fn()}
      />
    )

    expect(
      screen.getByText("This invoice is in your account.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Open your billing" })
    ).toHaveAttribute("href", "/dashboard/billing")
  })

  it("lets other signed-in people ask for access", async () => {
    const onRequest = vi.fn(async () => ({
      ok: true,
      message: "Request sent.",
    }))
    const user = userEvent.setup()
    render(
      <InvoiceAccountPrompt
        state="outsider"
        invoicePath="/invoice/tok_1"
        onRequest={onRequest}
      />
    )

    await user.click(screen.getByRole("button", { name: "Request access" }))

    expect(onRequest).toHaveBeenCalled()
    expect(await screen.findByRole("status")).toHaveTextContent("Request sent.")
    expect(
      screen.queryByRole("button", { name: "Request access" })
    ).not.toBeInTheDocument()
  })
})
