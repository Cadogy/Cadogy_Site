import { beforeEach, describe, expect, it, vi } from "vitest"

const client = vi.hoisted(() => ({
  signUp: { email: vi.fn() },
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock("@/features/auth/client", () => ({
  authClient: client,
  humanCheckHeaders: (token: string) => ({ "x-turnstile-token": token }),
}))

const actions = await import("./auth-actions")

const form = (values: Record<string, string>) => {
  const data = new FormData()
  Object.entries(values).forEach(([key, value]) => data.set(key, value))
  return data
}

const ok = { data: {}, error: null }

describe("account actions", () => {
  beforeEach(() => {
    Object.values(client).forEach((fn) =>
      "mockReset" in fn ? fn.mockReset() : fn.email.mockReset()
    )
  })

  it("registers with name, email and the human check, then lands on verification", async () => {
    client.signUp.email.mockResolvedValue(ok)

    const result = await actions.registerAction(
      null,
      form({
        name: "Ada",
        email: "ada@example.com",
        password: "correct horse battery",
        turnstileToken: "tok",
      })
    )

    expect(result).toEqual({ ok: true })
    expect(client.signUp.email).toHaveBeenCalledWith(
      {
        name: "Ada",
        email: "ada@example.com",
        password: "correct horse battery",
        callbackURL: "/verify-email",
      },
      { headers: { "x-turnstile-token": "tok" } }
    )
  })

  it("checks password length before calling the server", async () => {
    const result = await actions.registerAction(
      null,
      form({ name: "Ada", email: "ada@example.com", password: "short" })
    )

    expect(result).toEqual({
      ok: false,
      error: "Use at least 12 characters.",
      field: "password",
    })
    expect(client.signUp.email).not.toHaveBeenCalled()
  })

  it("explains breached passwords", async () => {
    client.signUp.email.mockResolvedValue({
      data: null,
      error: { code: "PASSWORD_COMPROMISED", status: 400 },
    })

    const result = await actions.registerAction(
      null,
      form({
        name: "Ada",
        email: "ada@example.com",
        password: "password123456",
      })
    )

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/data breach/),
    })
  })

  it("requests a reset link that returns to the reset page", async () => {
    client.requestPasswordReset.mockResolvedValue(ok)

    expect(
      await actions.requestPasswordResetAction(
        null,
        form({ email: "ada@example.com", turnstileToken: "tok" })
      )
    ).toEqual({ ok: true })
    expect(client.requestPasswordReset).toHaveBeenCalledWith(
      { email: "ada@example.com", redirectTo: "/reset-password" },
      { headers: { "x-turnstile-token": "tok" } }
    )
  })

  it("requires matching passwords to reset", async () => {
    const result = await actions.resetPasswordAction(
      null,
      form({
        token: "t",
        password: "correct horse battery",
        confirmPassword: "different horse battery",
      })
    )

    expect(result).toEqual({
      ok: false,
      error: "Passwords don't match.",
      field: "confirmPassword",
    })
    expect(client.resetPassword).not.toHaveBeenCalled()
  })

  it("resets the password with the emailed token", async () => {
    client.resetPassword.mockResolvedValue(ok)

    await actions.resetPasswordAction(
      null,
      form({
        token: "t",
        password: "correct horse battery",
        confirmPassword: "correct horse battery",
      })
    )

    expect(client.resetPassword).toHaveBeenCalledWith({
      newPassword: "correct horse battery",
      token: "t",
    })
  })

  it("signs out other devices when the password changes", async () => {
    client.changePassword.mockResolvedValue(ok)

    await actions.changePasswordAction(
      null,
      form({
        currentPassword: "old pass phrase",
        password: "correct horse battery",
        confirmPassword: "correct horse battery",
      })
    )

    expect(client.changePassword).toHaveBeenCalledWith({
      currentPassword: "old pass phrase",
      newPassword: "correct horse battery",
      revokeOtherSessions: true,
    })
  })

  it("updates the display name", async () => {
    client.updateUser.mockResolvedValue(ok)

    expect(
      await actions.updateNameAction(null, form({ name: "  Ada Lovelace " }))
    ).toEqual({ ok: true })
    expect(client.updateUser).toHaveBeenCalledWith({ name: "Ada Lovelace" })
  })
})
