import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { SubmissionResult } from "../application/inquiry-service"

const nextResult = vi.hoisted(() => ({
  value: { status: "accepted" } as SubmissionResult,
}))
const submitted = vi.hoisted(() => ({ forms: [] as FormData[] }))

vi.mock("../server/actions", () => ({
  submitInquiry: async (_previous: unknown, formData: FormData) => {
    submitted.forms.push(formData)
    return nextResult.value
  },
}))
vi.mock("@/components/security/human-check", () => ({ HumanCheck: () => null }))

const { ContactForm } = await import("./contact-form")

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Name"), "Grace Hopper")
  await user.type(screen.getByLabelText("Work email"), "grace@navy.example")
  await user.selectOptions(
    screen.getByLabelText("What do you need help with?"),
    "payments"
  )
  await user.type(
    screen.getByLabelText("Tell us about the project"),
    "We need Stripe subscriptions and invoicing for our SaaS."
  )
}

describe("ContactForm", () => {
  beforeEach(() => {
    submitted.forms = []
    nextResult.value = { status: "accepted" }
  })

  it("submits the visitor's details with the anti-spam fields", async () => {
    const user = userEvent.setup()
    render(
      <ContactForm formToken="signed-token" turnstileSiteKey={undefined} />
    )

    await fillValidForm(user)
    await user.click(screen.getByRole("button", { name: "Send message" }))

    const form = submitted.forms[0]
    expect(form?.get("email")).toBe("grace@navy.example")
    expect(form?.get("projectType")).toBe("payments")
    expect(form?.get("formToken")).toBe("signed-token")
    expect(form?.get("website")).toBe("")
  })

  it("confirms success in a live region and hides the form", async () => {
    const user = userEvent.setup()
    render(<ContactForm formToken="t" turnstileSiteKey={undefined} />)

    await fillValidForm(user)
    await user.click(screen.getByRole("button", { name: "Send message" }))

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Thanks — your message is on its way."
    )
    expect(
      screen.queryByRole("button", { name: "Send message" })
    ).not.toBeInTheDocument()
  })

  it("ties server-side field errors to their inputs", async () => {
    nextResult.value = {
      status: "invalid",
      fieldErrors: { email: "Please enter a valid email address." },
    }
    const user = userEvent.setup()
    render(<ContactForm formToken="t" turnstileSiteKey={undefined} />)

    await fillValidForm(user)
    await user.click(screen.getByRole("button", { name: "Send message" }))

    const email = screen.getByLabelText("Work email")
    expect(email).toHaveAttribute("aria-invalid", "true")
    expect(email).toHaveAccessibleDescription(
      "Please enter a valid email address."
    )
  })

  it("explains rate limiting without losing what the visitor typed", async () => {
    nextResult.value = { status: "rate_limited" }
    const user = userEvent.setup()
    render(<ContactForm formToken="t" turnstileSiteKey={undefined} />)

    await fillValidForm(user)
    await user.click(screen.getByRole("button", { name: "Send message" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /too many messages/i
    )
    expect(screen.getByLabelText("Name")).toHaveValue("Grace Hopper")
  })

  it("hides the honeypot from people and assistive technology", () => {
    render(<ContactForm formToken="t" turnstileSiteKey={undefined} />)
    expect(screen.queryByLabelText(/website/i)).not.toBeInTheDocument()
  })
})
