// @vitest-environment node
import { describe, expect, it } from "vitest"

import { issueFormToken } from "../domain/spam"
import {
  createInquiryService,
  type InquiryDependencies,
} from "./inquiry-service"

const SECRET = "s".repeat(32)
const NOW = new Date("2026-11-01T12:00:00.000Z")
const FORM_OPENED = new Date(NOW.getTime() - 30_000)

const validInput = (overrides: Record<string, unknown> = {}) => ({
  name: "Grace Hopper",
  email: "grace@navy.example",
  company: "Navy",
  projectType: "new-product",
  budget: "25k-50k",
  timeline: "1-3-months",
  message:
    "We need a scheduling platform for our fleet with Stripe billing and an admin panel.",
  website: "",
  formToken: issueFormToken(FORM_OPENED, SECRET),
  turnstileToken: "turnstile-ok",
  ...overrides,
})

const setup = (overrides: Partial<InquiryDependencies> = {}) => {
  const saved: unknown[] = []
  const notified: unknown[] = []
  const hits = new Map<string, number>()
  const deps: InquiryDependencies = {
    clock: () => NOW,
    formSecret: SECRET,
    verifyTurnstile: async (token) => token === "turnstile-ok",
    rateLimiter: {
      hit: async (key) => {
        const count = (hits.get(key) ?? 0) + 1
        hits.set(key, count)
        return count
      },
    },
    store: {
      save: async (inquiry) => {
        saved.push(inquiry)
      },
    },
    notifyAdmin: async (inquiry) => {
      notified.push(inquiry)
    },
    ...overrides,
  }
  return { service: createInquiryService(deps), saved, notified }
}

const context = { ip: "203.0.113.7", userAgent: "Mozilla/5.0" }

describe("inquiry intake", () => {
  it("stores a genuine inquiry and notifies the founders", async () => {
    const { service, saved, notified } = setup()

    const result = await service.submit(validInput(), context)

    expect(result).toEqual({ status: "accepted" })
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      name: "Grace Hopper",
      email: "grace@navy.example",
      projectType: "new-product",
      status: "new",
      ip: "203.0.113.7",
      createdAt: NOW,
    })
    expect(notified).toHaveLength(1)
  })

  it("returns field errors for invalid input without storing anything", async () => {
    const { service, saved } = setup()

    const result = await service.submit(
      validInput({ email: "nope", message: "hi" }),
      context
    )

    expect(result.status).toBe("invalid")
    expect(
      result.status === "invalid" && Object.keys(result.fieldErrors).sort()
    ).toEqual(["email", "message"])
    expect(saved).toEqual([])
  })

  it.each([
    ["the honeypot is filled", { website: "https://spam.example" }],
    [
      "the form was submitted instantly",
      { formToken: issueFormToken(new Date(NOW.getTime() - 500), SECRET) },
    ],
    ["the form token is forged", { formToken: "123.forged" }],
    [
      "the message is a link farm",
      {
        message:
          "Buy now https://a.example https://b.example https://c.example https://d.example",
      },
    ],
  ])("silently discards bots when %s", async (_label, overrides) => {
    const { service, saved, notified } = setup()

    const result = await service.submit(validInput(overrides), context)

    expect(result).toEqual({ status: "accepted" })
    expect(saved).toEqual([])
    expect(notified).toEqual([])
  })

  it("asks the visitor to reload when their form has expired", async () => {
    const { service } = setup()
    const result = await service.submit(
      validInput({
        formToken: issueFormToken(
          new Date(NOW.getTime() - 3 * 60 * 60 * 1000),
          SECRET
        ),
      }),
      context
    )
    expect(result).toEqual({ status: "expired" })
  })

  it("rejects failed human verification", async () => {
    const { service, saved } = setup()
    const result = await service.submit(
      validInput({ turnstileToken: "bad" }),
      context
    )
    expect(result).toEqual({ status: "verification_failed" })
    expect(saved).toEqual([])
  })

  it("rate limits repeated submissions from one address", async () => {
    const { service, saved } = setup()

    const results = []
    for (const index of [1, 2, 3, 4]) {
      results.push(
        await service.submit(
          validInput({ email: `person${index}@example.com` }),
          context
        )
      )
    }

    expect(results.map((result) => result.status)).toEqual([
      "accepted",
      "accepted",
      "accepted",
      "rate_limited",
    ])
    expect(saved).toHaveLength(3)
  })

  it("rate limits repeated submissions for one email across addresses", async () => {
    const { service } = setup()
    const statuses = []
    for (const index of [1, 2, 3, 4, 5, 6]) {
      const result = await service.submit(validInput(), {
        ...context,
        ip: `198.51.100.${index}`,
      })
      statuses.push(result.status)
    }
    expect(statuses.at(-1)).toBe("rate_limited")
    expect(statuses.filter((status) => status === "accepted")).toHaveLength(5)
  })

  it("still accepts the inquiry when the notification email fails", async () => {
    const { service, saved } = setup({
      notifyAdmin: async () => {
        throw new Error("Resend down")
      },
    })
    expect(await service.submit(validInput(), context)).toEqual({
      status: "accepted",
    })
    expect(saved).toHaveLength(1)
  })
})
