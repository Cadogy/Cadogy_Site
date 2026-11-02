import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const changeEmail = vi.hoisted(() => vi.fn())

vi.mock("@/features/auth/client", () => ({ authClient: { changeEmail } }))

const { ChangeEmailForm, DeleteAccount } = await import("./account-lifecycle")

describe("ChangeEmailForm", () => {
  beforeEach(() => changeEmail.mockReset())

  it("asks the current address to confirm the change", async () => {
    changeEmail.mockResolvedValue({ data: { status: true }, error: null })
    const user = userEvent.setup()
    render(<ChangeEmailForm currentEmail="ada@example.com" />)

    await user.type(screen.getByLabelText("New email"), "ada@newco.example")
    await user.click(screen.getByRole("button", { name: "Change email" }))

    expect(changeEmail).toHaveBeenCalledWith({
      newEmail: "ada@newco.example",
      callbackURL: "/account",
    })
    expect(await screen.findByRole("status")).toHaveTextContent(
      "We've sent a confirmation link to ada@example.com."
    )
  })

  it("rejects the address already on the account", async () => {
    const user = userEvent.setup()
    render(<ChangeEmailForm currentEmail="ada@example.com" />)

    await user.type(screen.getByLabelText("New email"), "ADA@example.com")
    await user.click(screen.getByRole("button", { name: "Change email" }))

    expect(changeEmail).not.toHaveBeenCalled()
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That's already your email."
    )
  })
})

describe("DeleteAccount", () => {
  beforeEach(() =>
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true)
    )
  )

  it("sends a confirmation email after the person confirms", async () => {
    const onRequest = vi.fn(async () => ({
      ok: true,
      message: "Check your email to confirm.",
    }))
    const user = userEvent.setup()
    render(<DeleteAccount allowed onRequest={onRequest} />)

    await user.click(screen.getByRole("button", { name: "Delete my account" }))

    expect(onRequest).toHaveBeenCalled()
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Check your email to confirm."
    )
  })

  it("explains why deletion isn't available", () => {
    render(
      <DeleteAccount
        allowed={false}
        reason="Please pay your 1 open invoice before deleting your account."
        onRequest={vi.fn()}
      />
    )

    expect(
      screen.queryByRole("button", { name: "Delete my account" })
    ).not.toBeInTheDocument()
    expect(screen.getByText(/1 open invoice/)).toBeInTheDocument()
  })
})
