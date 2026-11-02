import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const twoFactor = vi.hoisted(() => ({
  verifyTotp: vi.fn(),
  verifyBackupCode: vi.fn(),
}))
const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))

vi.mock("next/navigation", () => ({ useRouter: () => navigation }))
vi.mock("@/features/auth/client", () => ({ authClient: { twoFactor } }))

const { TwoFactorForm } = await import("./two-factor-form")

const ok = { data: { token: "t" }, error: null }

describe("TwoFactorForm", () => {
  beforeEach(() => {
    twoFactor.verifyTotp.mockReset()
    twoFactor.verifyBackupCode.mockReset()
    navigation.replace.mockReset()
  })

  it("verifies the authenticator code and can trust this device", async () => {
    twoFactor.verifyTotp.mockResolvedValue(ok)
    const user = userEvent.setup()
    render(<TwoFactorForm callbackPath="/admin" />)

    await user.type(screen.getByLabelText("Authentication code"), "123456")
    await user.click(screen.getByLabelText(/trust this device/i))
    await user.click(screen.getByRole("button", { name: "Verify" }))

    expect(twoFactor.verifyTotp).toHaveBeenCalledWith({
      code: "123456",
      trustDevice: true,
    })
    expect(navigation.replace).toHaveBeenCalledWith("/admin")
  })

  it("accepts a backup code instead", async () => {
    twoFactor.verifyBackupCode.mockResolvedValue(ok)
    const user = userEvent.setup()
    render(<TwoFactorForm callbackPath="/dashboard" />)

    await user.click(screen.getByRole("button", { name: "Use a backup code" }))
    await user.type(screen.getByLabelText("Backup code"), "abcde-fghij")
    await user.click(screen.getByRole("button", { name: "Verify" }))

    expect(twoFactor.verifyBackupCode).toHaveBeenCalledWith({
      code: "abcde-fghij",
      trustDevice: false,
    })
    expect(navigation.replace).toHaveBeenCalledWith("/dashboard")
  })

  it("explains a wrong code and stays on the step", async () => {
    twoFactor.verifyTotp.mockResolvedValue({
      data: null,
      error: { code: "INVALID_CODE", status: 401 },
    })
    const user = userEvent.setup()
    render(<TwoFactorForm callbackPath="/admin" />)

    await user.type(screen.getByLabelText("Authentication code"), "000000")
    await user.click(screen.getByRole("button", { name: "Verify" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/didn't work/)
    expect(navigation.replace).not.toHaveBeenCalled()
  })
})
