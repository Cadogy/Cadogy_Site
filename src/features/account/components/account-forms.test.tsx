import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

const sent = vi.hoisted(() => ({ forms: [] as FormData[] }))

vi.mock("@/components/security/human-check", () => ({
  HumanCheck: ({ onToken }: { onToken: (token: string) => void }) => (
    <button type="button" onClick={() => onToken("token-123")}>
      Pass the human check
    </button>
  ),
}))
vi.mock("./auth-actions", () => {
  const record = async (_previous: unknown, formData: FormData) => {
    sent.forms.push(formData)
    return null
  }
  return {
    registerAction: record,
    requestPasswordResetAction: record,
    resetPasswordAction: record,
  }
})

const { ForgotPasswordForm, RegisterForm } = await import("./account-forms")

describe("account forms behind the human check", () => {
  it("lets you create an account only after the background check passes", async () => {
    const user = userEvent.setup()
    render(<RegisterForm turnstileSiteKey="site-key" />)

    expect(
      screen.getByRole("button", { name: "Create account" })
    ).toBeDisabled()
    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking you're human"
    )

    await user.click(
      screen.getByRole("button", { name: "Pass the human check" })
    )

    expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("sends the reset request with the check's token", async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm turnstileSiteKey="site-key" />)

    expect(
      screen.getByRole("button", { name: "Send reset link" })
    ).toBeDisabled()

    await user.click(
      screen.getByRole("button", { name: "Pass the human check" })
    )
    await user.type(screen.getByLabelText("Email"), "ada@example.com")
    await user.click(screen.getByRole("button", { name: "Send reset link" }))

    expect(sent.forms.at(-1)?.get("turnstileToken")).toBe("token-123")
  })

  it("needs no check when none is configured", () => {
    render(<RegisterForm turnstileSiteKey={undefined} />)

    expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled()
  })
})
