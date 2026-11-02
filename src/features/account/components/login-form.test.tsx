import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const signInEmail = vi.hoisted(() => vi.fn())
const signInPasskey = vi.hoisted(() => vi.fn())
const signInMagicLink = vi.hoisted(() => vi.fn())
const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock("next/navigation", () => ({ useRouter: () => navigation }))
vi.mock("@/components/security/human-check", () => ({ HumanCheck: () => null }))
vi.mock("@/features/auth/client", () => ({
  authClient: {
    signIn: {
      email: signInEmail,
      passkey: signInPasskey,
      magicLink: signInMagicLink,
    },
  },
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
    signInPasskey.mockReset()
    signInMagicLink.mockReset()
    navigation.replace.mockReset()
    navigation.push.mockReset()
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

  it("sends people with two-factor on to the code step", async () => {
    signInEmail.mockResolvedValue({
      data: { twoFactorRedirect: true },
      error: null,
    })
    const user = userEvent.setup()
    render(
      <LoginForm callbackPath="/admin/users" turnstileSiteKey={undefined} />
    )

    await submit(user)

    expect(navigation.push).toHaveBeenCalledWith(
      "/login/verify?callbackUrl=%2Fadmin%2Fusers"
    )
    expect(navigation.replace).not.toHaveBeenCalled()
  })

  it("signs in with a passkey", async () => {
    signInPasskey.mockResolvedValue({ data: { session: {} }, error: null })
    const user = userEvent.setup()
    render(<LoginForm callbackPath="/admin" turnstileSiteKey={undefined} />)

    await user.click(
      screen.getByRole("button", { name: "Sign in with a passkey" })
    )

    expect(navigation.replace).toHaveBeenCalledWith("/admin")
  })

  it("explains a cancelled passkey prompt", async () => {
    signInPasskey.mockResolvedValue({
      data: null,
      error: { code: "AUTH_CANCELLED", status: 400 },
    })
    const user = userEvent.setup()
    render(<LoginForm callbackPath="/admin" turnstileSiteKey={undefined} />)

    await user.click(
      screen.getByRole("button", { name: "Sign in with a passkey" })
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(/cancelled/)
  })

  it("emails a sign-in link that returns to the requested page", async () => {
    signInMagicLink.mockResolvedValue({ data: { status: true }, error: null })
    const user = userEvent.setup()
    render(
      <LoginForm
        callbackPath="/dashboard/billing"
        turnstileSiteKey={undefined}
      />
    )

    await user.type(screen.getByLabelText("Email"), "ada@example.com")
    await user.click(
      screen.getByRole("button", { name: "Email me a sign-in link" })
    )

    expect(signInMagicLink).toHaveBeenCalledWith(
      {
        email: "ada@example.com",
        callbackURL: "/dashboard/billing",
        errorCallbackURL: "/login",
      },
      { headers: { "x-turnstile-token": "" } }
    )
    expect(await screen.findByRole("status")).toHaveTextContent(
      /If there's an account for ada@example.com/
    )
  })

  it("asks for an email before sending a link", async () => {
    const user = userEvent.setup()
    render(<LoginForm callbackPath="/dashboard" turnstileSiteKey={undefined} />)

    await user.click(
      screen.getByRole("button", { name: "Email me a sign-in link" })
    )

    expect(signInMagicLink).not.toHaveBeenCalled()
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /enter your email/i
    )
  })
})
