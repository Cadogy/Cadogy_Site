import { describe, expect, it } from "vitest"

import {
  canLoadStaffData,
  isFreshSession,
  mayChangeFactors,
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
  it("upgrades the session when an authenticator code is verified", () => {
    expect(upgradesSession("/two-factor/verify-totp", 1)).toBe(true)
    expect(upgradesSession("/change-password", 0)).toBe(false)
  })

  it("counts a new passkey as proof only when it's the first factor", () => {
    expect(upgradesSession("/passkey/verify-registration", 1)).toBe(true)
    // An account that already had TOTP or a passkey: the new passkey proves
    // nothing about the factor that was never checked.
    expect(upgradesSession("/passkey/verify-registration", 2)).toBe(false)
  })
})

describe("mayChangeFactors", () => {
  const change = (
    path: string,
    assurance: "single" | "multi",
    factorCount: number
  ) => mayChangeFactors({ path, assurance, factorCount })

  it("lets an account without a second factor set one up", () => {
    expect(change("/passkey/generate-register-options", "single", 0)).toBe(true)
    expect(change("/two-factor/enable", "single", 0)).toBe(true)
  })

  it("blocks adding or removing factors from a session that skipped the existing one", () => {
    for (const path of [
      "/two-factor/enable",
      "/two-factor/disable",
      "/two-factor/generate-backup-codes",
      "/two-factor/get-totp-uri",
      "/passkey/generate-register-options",
      "/passkey/verify-registration",
      "/passkey/delete-passkey",
    ])
      expect(change(path, "single", 1)).toBe(false)
  })

  it("allows changes once the session has proved a factor", () => {
    expect(change("/passkey/delete-passkey", "multi", 2)).toBe(true)
  })

  it("leaves other endpoints alone", () => {
    expect(change("/change-password", "single", 1)).toBe(true)
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

describe("canLoadStaffData", () => {
  it("only loads staff data once the session is two-factor strong", () => {
    expect(
      canLoadStaffData({ assurance: "multi", hasSecondFactor: true })
    ).toBe(true)
    // Not enrolled yet: on the way to set up two-factor.
    expect(
      canLoadStaffData({ assurance: "single", hasSecondFactor: false })
    ).toBe(false)
    // Enrolled but signed in with a password only: must sign in again.
    expect(
      canLoadStaffData({ assurance: "single", hasSecondFactor: true })
    ).toBe(false)
  })
})
