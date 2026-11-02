import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const twoFactor = vi.hoisted(() => ({
  enable: vi.fn(),
  verifyTotp: vi.fn(),
  disable: vi.fn(),
  generateBackupCodes: vi.fn(),
}))
const navigation = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock("next/navigation", () => ({ useRouter: () => navigation }))
vi.mock("@/features/auth/client", () => ({ authClient: { twoFactor } }))

const { TwoFactorSettings } = await import("./two-factor-settings")

const URI =
  "otpauth://totp/Cadogy:ada%40example.com?secret=JBSWY3DPEHPK3PXPJBSWY3DP&issuer=Cadogy"
const CODES = ["aaaaa-bbbbb", "ccccc-ddddd"]

const confirmPassword = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Password"), "correct horse battery")
  await user.click(screen.getByRole("button", { name: "Continue" }))
}

describe("TwoFactorSettings", () => {
  beforeEach(() => {
    Object.values(twoFactor).forEach((fn) => fn.mockReset())
    navigation.refresh.mockReset()
  })

  it("sets up an authenticator app and hands over backup codes", async () => {
    twoFactor.enable.mockResolvedValue({
      data: { totpURI: URI, backupCodes: CODES },
      error: null,
    })
    twoFactor.verifyTotp.mockResolvedValue({ data: {}, error: null })
    const user = userEvent.setup()
    render(<TwoFactorSettings enabled={false} />)

    await user.click(screen.getByRole("button", { name: "Turn on two-factor" }))
    await confirmPassword(user)

    expect(twoFactor.enable).toHaveBeenCalledWith({
      password: "correct horse battery",
    })
    expect(
      await screen.findByRole("img", { name: /QR code/ })
    ).toBeInTheDocument()
    expect(
      screen.getByText("JBSW Y3DP EHPK 3PXP JBSW Y3DP")
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText("Code from your app"), "123456")
    await user.click(screen.getByRole("button", { name: "Verify and turn on" }))

    expect(twoFactor.verifyTotp).toHaveBeenCalledWith({ code: "123456" })
    expect(await screen.findByText("aaaaa-bbbbb")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "I've saved my codes" })
    )
    expect(navigation.refresh).toHaveBeenCalled()
  })

  it("turns two-factor off after confirming the password", async () => {
    twoFactor.disable.mockResolvedValue({ data: {}, error: null })
    const user = userEvent.setup()
    render(<TwoFactorSettings enabled />)

    await user.click(screen.getByRole("button", { name: "Turn off" }))
    await confirmPassword(user)

    expect(twoFactor.disable).toHaveBeenCalledWith({
      password: "correct horse battery",
    })
    expect(navigation.refresh).toHaveBeenCalled()
  })

  it("creates new backup codes", async () => {
    twoFactor.generateBackupCodes.mockResolvedValue({
      data: { backupCodes: CODES },
      error: null,
    })
    const user = userEvent.setup()
    render(<TwoFactorSettings enabled />)

    await user.click(screen.getByRole("button", { name: "New backup codes" }))
    await confirmPassword(user)

    expect(await screen.findByText("ccccc-ddddd")).toBeInTheDocument()
  })

  it("shows a wrong password without leaving the step", async () => {
    twoFactor.disable.mockResolvedValue({
      data: null,
      error: { code: "INVALID_PASSWORD", status: 400 },
    })
    const user = userEvent.setup()
    render(<TwoFactorSettings enabled />)

    await user.click(screen.getByRole("button", { name: "Turn off" }))
    await confirmPassword(user)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your current password is incorrect."
    )
    expect(navigation.refresh).not.toHaveBeenCalled()
  })
})
