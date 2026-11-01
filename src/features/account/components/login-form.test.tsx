import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const signIn = vi.hoisted(() => vi.fn())
const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))
const resend = vi.hoisted(() => vi.fn(async () => ({ ok: true })))

vi.mock("next-auth/react", () => ({ signIn }))
vi.mock("next/navigation", () => ({ useRouter: () => navigation }))
vi.mock("@/components/security/human-check", () => ({ HumanCheck: () => null }))
vi.mock("../server/actions", () => ({ resendVerificationAction: resend }))

const { LoginForm } = await import("./login-form")

const submit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Email"), "ada@example.com")
  await user.type(screen.getByLabelText("Password"), "Str0ngPassword")
  await user.click(screen.getByRole("button", { name: "Sign in" }))
}

describe("LoginForm", () => {
  beforeEach(() => {
    signIn.mockReset()
    navigation.replace.mockReset()
  })

  it("signs in and returns to the requested page", async () => {
    signIn.mockResolvedValue({ ok: true, error: null })
    const user = userEvent.setup()
    render(
      <LoginForm
        callbackPath="/dashboard/invoices"
        turnstileSiteKey={undefined}
      />
    )

    await submit(user)

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "ada@example.com",
      password: "Str0ngPassword",
      turnstileToken: "",
      redirect: false,
    })
    expect(navigation.replace).toHaveBeenCalledWith("/dashboard/invoices")
  })

  it("shows one generic message for bad credentials", async () => {
    signIn.mockResolvedValue({ ok: false, error: "InvalidCredentials" })
    const user = userEvent.setup()
    render(<LoginForm callbackPath="/dashboard" turnstileSiteKey={undefined} />)

    await submit(user)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect email or password."
    )
    expect(navigation.replace).not.toHaveBeenCalled()
  })

  it("offers to resend the verification email for unverified accounts", async () => {
    signIn.mockResolvedValue({ ok: false, error: "EmailNotVerified" })
    const user = userEvent.setup()
    render(<LoginForm callbackPath="/dashboard" turnstileSiteKey={undefined} />)

    await submit(user)
    await user.click(
      await screen.findByRole("button", { name: "Resend verification email" })
    )

    expect(resend).toHaveBeenCalledWith("ada@example.com")
    expect(await screen.findByRole("status")).toHaveTextContent(
      /check your inbox/i
    )
  })
})
