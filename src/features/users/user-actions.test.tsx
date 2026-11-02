import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const actions = vi.hoisted(() => ({
  manageUserAction: vi.fn(async () => ({ ok: true, message: "Done." })),
  impersonateUserAction: vi.fn(async () => null),
}))

vi.mock("./actions", () => actions)

const { UserActions } = await import("./user-actions")

describe("UserActions", () => {
  beforeEach(() => {
    actions.manageUserAction.mockClear()
    actions.impersonateUserAction.mockClear()
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true)
    )
  })

  it("shows only the actions the viewer may take", () => {
    render(
      <UserActions
        userId="u_1"
        email="ada@example.com"
        actions={["revoke_sessions", "ban"]}
      />
    )

    expect(
      screen.getByRole("button", { name: "Sign out everywhere" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ban" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "View as client" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Reset two-factor" })
    ).not.toBeInTheDocument()
  })

  it("signs a user out everywhere after confirming", async () => {
    const user = userEvent.setup()
    render(
      <UserActions
        userId="u_1"
        email="ada@example.com"
        actions={["revoke_sessions"]}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Sign out everywhere" })
    )

    expect(actions.manageUserAction).toHaveBeenCalledWith(
      "u_1",
      "revoke_sessions",
      ""
    )
    expect(await screen.findByRole("status")).toHaveTextContent("Done.")
  })

  it("asks for a reason before banning", async () => {
    const user = userEvent.setup()
    render(
      <UserActions userId="u_1" email="ada@example.com" actions={["ban"]} />
    )

    await user.click(screen.getByRole("button", { name: "Ban" }))
    await user.type(
      screen.getByLabelText("Reason for the ban"),
      "Chargeback abuse"
    )
    await user.click(screen.getByRole("button", { name: "Ban account" }))

    expect(actions.manageUserAction).toHaveBeenCalledWith(
      "u_1",
      "ban",
      "Chargeback abuse"
    )
  })

  it("opens the client's portal view", async () => {
    const user = userEvent.setup()
    render(
      <UserActions
        userId="u_1"
        email="ada@example.com"
        actions={["impersonate"]}
      />
    )

    await user.click(screen.getByRole("button", { name: "View as client" }))

    expect(actions.impersonateUserAction).toHaveBeenCalledWith("u_1")
  })

  it("does nothing when the confirmation is declined", async () => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => false)
    )
    const user = userEvent.setup()
    render(
      <UserActions
        userId="u_1"
        email="ada@example.com"
        actions={["reset_two_factor"]}
      />
    )

    await user.click(screen.getByRole("button", { name: "Reset two-factor" }))

    expect(actions.manageUserAction).not.toHaveBeenCalled()
  })
})
