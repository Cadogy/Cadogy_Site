import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

type Outcome = { ok: true } | { ok: false; error: string; field?: string }

const changePassword = vi.hoisted((): { result: Outcome } => ({
  result: { ok: true },
}))

vi.mock("./auth-actions", () => ({
  updateNameAction: async () => ({ ok: true }),
  changePasswordAction: async () => changePassword.result,
}))

const { ChangePasswordForm } = await import("./settings-forms")

const fillAndSubmit = async () => {
  const user = userEvent.setup()
  render(<ChangePasswordForm />)
  await user.type(screen.getByLabelText("Current password"), "old-password-1")
  await user.type(screen.getByLabelText("New password"), "new-password-12")
  await user.type(
    screen.getByLabelText("Confirm new password"),
    "new-password-12"
  )
  await user.click(screen.getByRole("button", { name: "Update password" }))
}

describe("ChangePasswordForm", () => {
  it("keeps what you typed when the change fails", async () => {
    changePassword.result = {
      ok: false,
      error: "Your current password is incorrect",
      field: "currentPassword",
    }

    await fillAndSubmit()

    expect(
      await screen.findByText("Your current password is incorrect")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Current password")).toHaveValue(
      "old-password-1"
    )
    expect(screen.getByLabelText("New password")).toHaveValue("new-password-12")
  })

  it("clears the form once the password is updated", async () => {
    changePassword.result = { ok: true }

    await fillAndSubmit()

    expect(await screen.findByText("Password updated.")).toBeInTheDocument()
    expect(screen.getByLabelText("Current password")).toHaveValue("")
    expect(screen.getByLabelText("New password")).toHaveValue("")
  })
})
