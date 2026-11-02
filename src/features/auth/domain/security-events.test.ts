import { describe, expect, it } from "vitest"

import { eventForAuthRequest, securityEventLabel } from "./security-events"

describe("eventForAuthRequest", () => {
  it.each([
    ["/sign-in/email", true, "sign_in"],
    ["/sign-in/email", false, "sign_in_failed"],
    ["/sign-up/email", true, "sign_up"],
    ["/sign-out", true, "sign_out"],
    ["/verify-email", true, "email_verified"],
    ["/request-password-reset", true, "password_reset_requested"],
    ["/reset-password", true, "password_reset"],
    ["/change-password", true, "password_changed"],
    ["/revoke-session", true, "session_revoked"],
    ["/revoke-sessions", true, "sessions_revoked"],
    ["/revoke-other-sessions", true, "sessions_revoked"],
  ] as const)("logs %s (ok: %s) as %s", (path, ok, type) => {
    expect(eventForAuthRequest({ path, ok })).toBe(type)
  })

  it("ignores failed attempts other than sign-in", () => {
    expect(
      eventForAuthRequest({ path: "/change-password", ok: false })
    ).toBeNull()
    expect(
      eventForAuthRequest({ path: "/reset-password", ok: false })
    ).toBeNull()
  })

  it("ignores routine requests", () => {
    expect(eventForAuthRequest({ path: "/get-session", ok: true })).toBeNull()
    expect(eventForAuthRequest({ path: "/update-user", ok: true })).toBeNull()
  })
})

describe("securityEventLabel", () => {
  it("describes events in plain words", () => {
    expect(securityEventLabel("sign_in")).toBe("Signed in")
    expect(securityEventLabel("sign_in_failed")).toBe("Failed sign-in attempt")
    expect(securityEventLabel("sessions_revoked")).toBe(
      "Signed out other devices"
    )
    expect(securityEventLabel("role_changed")).toBe("Role changed")
  })
})
