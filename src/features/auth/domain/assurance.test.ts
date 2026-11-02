import { describe, expect, it } from "vitest"

import {
  isFreshSession,
  sessionAssurance,
  staffAccess,
  upgradesSession,
} from "./assurance"

describe("sessionAssurance", () => {
  it.each([
    "/two-factor/verify-totp",
    "/two-factor/verify-backup-code",
    "/passkey/verify-authentication",
  ])("treats sessions created by %s as multi-factor", (path) => {
    expect(sessionAssurance({ path, userHasTwoFactor: false })).toBe("multi")
  })

  it("treats a password sign-in on a trusted device as multi-factor", () => {
    expect(
      sessionAssurance({ path: "/sign-in/email", userHasTwoFactor: true })
    ).toBe("multi")
  })

  it("treats a plain password sign-in as single-factor", () => {
    expect(
      sessionAssurance({ path: "/sign-in/email", userHasTwoFactor: false })
    ).toBe("single")
  })

  it("treats sign-in after email verification as single-factor", () => {
    expect(
      sessionAssurance({ path: "/verify-email", userHasTwoFactor: false })
    ).toBe("single")
    expect(sessionAssurance({ path: undefined, userHasTwoFactor: true })).toBe(
      "single"
    )
  })
})

describe("upgradesSession", () => {
  it("upgrades the current session when a second factor is set up", () => {
    expect(upgradesSession("/two-factor/verify-totp")).toBe(true)
    expect(upgradesSession("/passkey/verify-registration")).toBe(true)
    expect(upgradesSession("/change-password")).toBe(false)
  })
})

describe("staffAccess", () => {
  it("lets multi-factor staff sessions in", () => {
    expect(staffAccess({ assurance: "multi", hasSecondFactor: true })).toBe(
      "allowed"
    )
  })

  it("asks staff without a second factor to set one up", () => {
    expect(staffAccess({ assurance: "single", hasSecondFactor: false })).toBe(
      "enroll"
    )
  })

  it("asks staff who signed in with one factor to sign in again", () => {
    expect(staffAccess({ assurance: "single", hasSecondFactor: true })).toBe(
      "reauthenticate"
    )
  })
})

describe("isFreshSession", () => {
  const now = new Date("2026-11-01T12:00:00.000Z")
  const minutesAgo = (minutes: number) =>
    new Date(now.getTime() - minutes * 60_000)

  it("treats sign-ins from the last 10 minutes as fresh", () => {
    expect(isFreshSession(minutesAgo(9), now)).toBe(true)
  })

  it("asks for a new sign-in after that", () => {
    expect(isFreshSession(minutesAgo(11), now)).toBe(false)
  })
})
