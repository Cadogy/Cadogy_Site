import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ContactsManager } from "./contacts-manager"

const ok = async () => ({ ok: true, message: "Saved." })

const props = (overrides = {}) => ({
  primary: { email: "finance@acme.example", name: "Ada" },
  contacts: [
    {
      email: "lead@acme.example",
      name: "Project Lead",
      role: "viewer" as const,
    },
  ],
  canManage: true,
  onInvite: vi.fn(ok),
  onRoleChange: vi.fn(ok),
  onRemove: vi.fn(ok),
  ...overrides,
})

describe("ContactsManager", () => {
  it("shows the primary contact as fixed billing", () => {
    render(<ContactsManager {...props()} />)
    const primary = screen.getByRole("listitem", {
      name: /finance@acme.example/,
    })

    expect(within(primary).getByText("Primary · Billing")).toBeInTheDocument()
    expect(within(primary).queryByRole("button")).not.toBeInTheDocument()
  })

  it("invites someone with a role", async () => {
    const given = props()
    const user = userEvent.setup()
    render(<ContactsManager {...given} />)

    await user.type(screen.getByLabelText("Email"), "ap@acme.example")
    await user.type(screen.getByLabelText(/^Name/), "Accounts Payable")
    await user.selectOptions(screen.getByLabelText("Access"), "billing")
    await user.click(screen.getByRole("button", { name: "Invite" }))

    expect(given.onInvite).toHaveBeenCalledWith({
      email: "ap@acme.example",
      name: "Accounts Payable",
      role: "billing",
    })
    expect(await screen.findByRole("status")).toHaveTextContent("Saved.")
  })

  it("changes a role and removes a contact", async () => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true)
    )
    const given = props()
    const user = userEvent.setup()
    render(<ContactsManager {...given} />)

    await user.selectOptions(
      screen.getByLabelText("Access for lead@acme.example"),
      "billing"
    )
    await user.click(
      screen.getByRole("button", { name: "Remove lead@acme.example" })
    )

    expect(given.onRoleChange).toHaveBeenCalledWith(
      "lead@acme.example",
      "billing"
    )
    expect(given.onRemove).toHaveBeenCalledWith("lead@acme.example")
  })

  it("is read-only for people who can't manage the team", () => {
    render(<ContactsManager {...props({ canManage: false })} />)

    expect(
      screen.queryByRole("button", { name: "Invite" })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(
      screen.getByText("Only billing contacts can change who has access.")
    ).toBeInTheDocument()
  })
})
