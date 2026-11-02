import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const signInEmail = vi.hoisted(() => vi.fn())
const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))

vi.mock("next/navigation", () => ({ useRouter: () => navigation }))
vi.mock("@/components/security/human-check", () => ({ HumanCheck: () => null }))
vi.mock("@/features/auth/client", () => ({
  authClient: { signIn: { email: signInEmail } },
  humanCheckHeaders: (token: string) => ({ "x-turnstile-token": token }),
}))

const { LoginForm } = await import("./login-form")

const submit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Email"), "ada@example.com")
  await user.type(screen.getByLabelText("Password"), "a-long-passphrase")
  await user.click(screen.getByRole("button", { name: "Sign in" }))
}

const failWith = (error: { code?: string; message?: string; status: number }) =>
  signInEmail.mockResolvedValue({ data: null, error })

describe("LoginForm", () => {
  beforeEach(() => {
    signInEmail.mockReset()
    navigation.replace.mockReset()
  })

  it("signs in with the human check token and returns to the requested page", async () => {
    signInEmail.mockResolvedValue({ data: { user: {} }, error: null })
    const user = userEvent.setup()
    render(
      <LoginForm
        callbackPath="/dashboard/billing"
        turnstileSiteKey={undefined}
      />
    )

    await submit(user)

    expect(signInEmail).toHaveBeenCalledWith(
      { email: "ada@example.com", password: "a-long-passphrase" },
      { headers: { "x-turnstile-token": "" } }
    )
    expect(navigation.replace).toHaveBeenCalledWith("/dashboard/billing")
  })

  it("shows one generic message for bad credentials", async () => {
    failWith({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 })
    const user = userEvent.setup()
    render(<LoginForm callbackPath="/dashboard" turnstileSiteKey={undefined} />)

    await submit(user)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect email or password."
    )
    expect(navigation.replace).not.toHaveBeenCalled()
  })

  it("tells unverified users a fresh link is on its way", async () => {
    failWith({ code: "EMAIL_NOT_VERIFIED", status: 403 })
    const user = userEvent.setup()
    render(<LoginForm callbackPath="/dashboard" turnstileSiteKey={undefined} />)

    await submit(user)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /sent you a new verification link/i
    )
  })

  it("asks people to slow down when rate limited", async () => {
    failWith({ status: 429 })
    const user = userEvent.setup()
    render(<LoginForm callbackPath="/dashboard" turnstileSiteKey={undefined} />)

    await submit(user)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /too many attempts/i
    )
  })

  it("passes through the human check message", async () => {
    failWith({
      message: "We couldn't verify you're human. Please try again.",
      status: 400,
    })
    const user = userEvent.setup()
    render(<LoginForm callbackPath="/dashboard" turnstileSiteKey={undefined} />)

    await submit(user)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't verify you're human."
    )
  })
})
