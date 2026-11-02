import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SessionList, type DeviceSession } from "./session-list"

const session = (overrides: Partial<DeviceSession> = {}): DeviceSession => ({
  id: "s_1",
  device: "Chrome on Windows",
  ip: "203.0.113.7",
  lastActiveLabel: "Nov 1, 2026, 2:00 PM",
  current: false,
  ...overrides,
})

const sessions = [
  session({ id: "s_current", device: "Safari on iPhone", current: true }),
  session({ id: "s_laptop" }),
]

const ok = async () => ({ ok: true, message: "Done." })

describe("SessionList", () => {
  it("marks this device and doesn't offer to sign it out", () => {
    render(
      <SessionList
        sessions={sessions}
        onRevoke={vi.fn()}
        onRevokeOthers={vi.fn()}
      />
    )
    const current = screen.getByRole("listitem", { name: /Safari on iPhone/ })

    expect(within(current).getByText("This device")).toBeInTheDocument()
    expect(within(current).queryByRole("button")).not.toBeInTheDocument()
  })

  it("signs out another device", async () => {
    const onRevoke = vi.fn(ok)
    const user = userEvent.setup()
    render(
      <SessionList
        sessions={sessions}
        onRevoke={onRevoke}
        onRevokeOthers={vi.fn()}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Sign out Chrome on Windows" })
    )

    expect(onRevoke).toHaveBeenCalledWith("s_laptop")
  })

  it("signs out every other device at once", async () => {
    const onRevokeOthers = vi.fn(ok)
    const user = userEvent.setup()
    render(
      <SessionList
        sessions={sessions}
        onRevoke={vi.fn()}
        onRevokeOthers={onRevokeOthers}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Sign out all other devices" })
    )

    expect(onRevokeOthers).toHaveBeenCalled()
    expect(await screen.findByRole("status")).toHaveTextContent("Done.")
  })

  it("hides the bulk action when this is the only device", () => {
    render(
      <SessionList
        sessions={[sessions[0]!]}
        onRevoke={vi.fn()}
        onRevokeOthers={vi.fn()}
      />
    )

    expect(
      screen.queryByRole("button", { name: "Sign out all other devices" })
    ).not.toBeInTheDocument()
  })
})
