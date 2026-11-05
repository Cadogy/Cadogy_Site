import { describe, expect, it, vi } from "vitest"

import { verifyWebhook } from "./webhook-verification"

const event = { id: "evt_1", type: "checkout.session.completed" }

describe("verifyWebhook", () => {
  it("returns the event when Stripe's signature matches", () => {
    const construct = vi.fn(() => event)

    expect(
      verifyWebhook({
        payload: "{}",
        signature: "t=1,v1=abc",
        secret: "whsec_live",
        construct,
      })
    ).toEqual({ ok: true, event })
    expect(construct).toHaveBeenCalledWith("{}", "t=1,v1=abc", "whsec_live")
  })

  it("says the webhook isn't configured instead of blaming the signature", () => {
    for (const setup of [
      { secret: undefined, construct: () => event },
      { secret: "whsec_live", construct: null },
      { secret: "   ", construct: () => event },
    ])
      expect(
        verifyWebhook({ payload: "{}", signature: "t=1,v1=abc", ...setup })
      ).toEqual({ ok: false, reason: "not_configured" })
  })

  it("reports a missing signature header", () => {
    expect(
      verifyWebhook({
        payload: "{}",
        signature: null,
        secret: "whsec_live",
        construct: () => event,
      })
    ).toEqual({ ok: false, reason: "missing_signature" })
  })

  it("passes on Stripe's reason when the signature doesn't match", () => {
    expect(
      verifyWebhook({
        payload: "{}",
        signature: "t=1,v1=abc",
        secret: "whsec_live",
        construct: () => {
          throw new Error(
            "No signatures found matching the expected signature for payload."
          )
        },
      })
    ).toEqual({
      ok: false,
      reason: "bad_signature",
      detail:
        "No signatures found matching the expected signature for payload.",
    })
  })

  it("ignores whitespace pasted around the signing secret", () => {
    const construct = vi.fn(() => event)

    verifyWebhook({
      payload: "{}",
      signature: "t=1,v1=abc",
      secret: "  whsec_live\n",
      construct,
    })

    expect(construct).toHaveBeenCalledWith("{}", "t=1,v1=abc", "whsec_live")
  })
})
