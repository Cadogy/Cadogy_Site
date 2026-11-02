import { describe, expect, it } from "vitest"

import {
  eventForAuthRequest,
  eventsInGroup,
  securityEventLabel,
} from "./security-events"

const success = (path: string, newSession = false, signedIn = false) =>
  eventForAuthRequest({ path, ok: true, newSession, signedIn })

const failure = (path: string) =>
  eventForAuthRequest({ path, ok: false, newSession: false, signedIn: false })

describe("eventForAuthRequest", () => {
  it.each([
    ["/sign-up/email", "sign_up"],
    ["/sign-out", "sign_out"],
    ["/verify-email", "email_verified"],
    ["/request-password-reset", "password_reset_requested"],
    ["/reset-password", "password_reset"],
    ["/change-password", "password_changed"],
    ["/revoke-session", "session_revoked"],
    ["/revoke-sessions", "sessions_revoked"],
    ["/revoke-other-sessions", "sessions_revoked"],
    ["/two-factor/disable", "two_factor_disabled"],
    ["/two-factor/generate-backup-codes", "backup_codes_regenerated"],
    ["/passkey/verify-registration", "passkey_added"],
    ["/passkey/delete-passkey", "passkey_removed"],
  ] as const)("logs a successful %s as %s", (path, type) => {
    expect(success(path)).toBe(type)
  })

  it("logs a sign-in only once a session exists", () => {
    expect(success("/sign-in/email", true)).toBe("sign_in")
    expect(success("/sign-in/email", false)).toBeNull()
    expect(success("/two-factor/verify-totp", true)).toBe("sign_in")
    expect(success("/two-factor/verify-backup-code", true)).toBe(
      "sign_in_backup_code"
    )
    expect(success("/passkey/verify-authentication", true)).toBe(
      "sign_in_passkey"
    )
    expect(success("/magic-link/verify", true)).toBe("sign_in_magic_link")
    expect(success("/sign-in/magic-link", false)).toBe("magic_link_requested")
  })

  it("logs verifying a code while signed in as turning on two-factor", () => {
    expect(success("/two-factor/verify-totp", true, true)).toBe(
      "two_factor_enabled"
    )
    expect(success("/two-factor/verify-totp", false, true)).toBe(
      "two_factor_enabled"
    )
  })

  it("logs failed password and code attempts", () => {
    expect(failure("/sign-in/email")).toBe("sign_in_failed")
    expect(failure("/two-factor/verify-totp")).toBe("two_factor_failed")
    expect(failure("/two-factor/verify-backup-code")).toBe("two_factor_failed")
  })

  it("ignores other failures and routine requests", () => {
    expect(failure("/change-password")).toBeNull()
    expect(success("/get-session")).toBeNull()
    expect(success("/update-user")).toBeNull()
  })
})

describe("securityEventLabel", () => {
  it("describes events in plain words", () => {
    expect(securityEventLabel("sign_in")).toBe("Signed in")
    expect(securityEventLabel("sign_in_failed")).toBe("Failed sign-in attempt")
    expect(securityEventLabel("sessions_revoked")).toBe(
      "Signed out other devices"
    )
    expect(securityEventLabel("account_locked")).toBe(
      "Password sign-in locked after failed attempts"
    )
    expect(securityEventLabel("sign_in_magic_link")).toBe(
      "Signed in with an email link"
    )
    expect(securityEventLabel("two_factor_enabled")).toBe(
      "Two-factor authentication turned on"
    )
  })
})

describe("eventsInGroup", () => {
  it("groups events for the security log filters", () => {
    expect(eventsInGroup("failures")).toEqual([
      "sign_in_failed",
      "two_factor_failed",
      "account_locked",
    ])
    expect(eventsInGroup("studio")).toContain("role_changed")
    expect(eventsInGroup("studio")).toContain("impersonation_started")
    expect(eventsInGroup("sign_ins")).toContain("sign_in_passkey")
  })

  it("returns nothing for unknown groups", () => {
    expect(eventsInGroup("everything")).toBeNull()
  })
})
