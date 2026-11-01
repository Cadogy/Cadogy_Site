// @vitest-environment node
import { describe, expect, it } from "vitest"

import { checkFormTiming, issueFormToken, looksLikeSpam } from "./spam"

const SECRET = "x".repeat(32)
const T0 = new Date("2026-11-01T12:00:00.000Z")
const later = (ms: number) => new Date(T0.getTime() + ms)

describe("form timing tokens", () => {
  it("accepts a form submitted by a human after a few seconds", () => {
    const token = issueFormToken(T0, SECRET)
    expect(checkFormTiming(token, later(8_000), SECRET)).toBe("ok")
  })

  it("rejects submissions faster than a person can type", () => {
    const token = issueFormToken(T0, SECRET)
    expect(checkFormTiming(token, later(1_500), SECRET)).toBe("too_fast")
  })

  it("rejects stale forms so tokens cannot be harvested and replayed forever", () => {
    const token = issueFormToken(T0, SECRET)
    expect(checkFormTiming(token, later(2 * 60 * 60 * 1000 + 1), SECRET)).toBe(
      "expired"
    )
  })

  it.each([
    [
      "a tampered timestamp",
      () => issueFormToken(T0, SECRET).replace(/^\d+/, "1"),
    ],
    [
      "a token signed with another secret",
      () => issueFormToken(T0, "y".repeat(32)),
    ],
    ["garbage", () => "not-a-token"],
    ["an empty string", () => ""],
  ])("rejects %s", (_label, makeToken) => {
    expect(checkFormTiming(makeToken(), later(8_000), SECRET)).toBe("invalid")
  })
})

describe("looksLikeSpam", () => {
  it("allows a normal project description with a link or two", () => {
    expect(
      looksLikeSpam(
        "We run https://example.com and need help adding Stripe subscriptions. Docs: https://example.com/docs"
      )
    ).toBe(false)
  })

  it("flags link farms", () => {
    expect(
      looksLikeSpam(
        "Great site! https://a.example https://b.example https://c.example http://d.example"
      )
    ).toBe(true)
  })

  it("flags messages without any real words", () => {
    expect(looksLikeSpam("$$$ 1234 5678 !!! ???? ---- ++++ 9999")).toBe(true)
  })

  it("flags common SEO and crypto pitch phrases", () => {
    expect(
      looksLikeSpam(
        "We can get you to page one of Google with our SEO backlinks package"
      )
    ).toBe(true)
  })
})
