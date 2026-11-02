import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const passkey = vi.hoisted(() => ({
  addPasskey: vi.fn(),
  deletePasskey: vi.fn(),
}))
const navigation = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock("next/navigation", () => ({ useRouter: () => navigation }))
vi.mock("@/features/auth/client", () => ({ authClient: { passkey } }))

const { PasskeySettings } = await import("./passkey-settings")

const saved = [
  { id: "pk_1", name: "Safari on iPhone", createdLabel: "Nov 1, 2026" },
]

describe("PasskeySettings", () => {
  beforeEach(() => {
    passkey.addPasskey.mockReset()
    passkey.deletePasskey.mockReset()
    navigation.refresh.mockReset()
  })

  it("lists saved passkeys", () => {
    render(<PasskeySettings passkeys={saved} />)

    expect(screen.getByText("Safari on iPhone")).toBeInTheDocument()
    expect(screen.getByText(/Added Nov 1, 2026/)).toBeInTheDocument()
  })

  it("adds a passkey named after this device", async () => {
    passkey.addPasskey.mockResolvedValue({ data: {}, error: null })
    const user = userEvent.setup()
    render(<PasskeySettings passkeys={[]} />)

    await user.click(screen.getByRole("button", { name: "Add a passkey" }))

    expect(passkey.addPasskey).toHaveBeenCalledWith({
      name: expect.any(String),
    })
    expect(navigation.refresh).toHaveBeenCalled()
  })

  it("asks for a fresh sign-in when the session is too old", async () => {
    passkey.addPasskey.mockResolvedValue({
      data: null,
      error: { code: "SESSION_NOT_FRESH", status: 403 },
    })
    const user = userEvent.setup()
    render(<PasskeySettings passkeys={[]} />)

    await user.click(screen.getByRole("button", { name: "Add a passkey" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/sign in again/i)
  })

  it("removes a passkey", async () => {
    passkey.deletePasskey.mockResolvedValue({ data: {}, error: null })
    const user = userEvent.setup()
    render(<PasskeySettings passkeys={saved} />)

    await user.click(
      screen.getByRole("button", { name: "Remove Safari on iPhone" })
    )

    expect(passkey.deletePasskey).toHaveBeenCalledWith({ id: "pk_1" })
    expect(navigation.refresh).toHaveBeenCalled()
  })
})
