export type SecurityEventType =
  | "sign_in"
  | "sign_in_failed"
  | "sign_up"
  | "sign_out"
  | "email_verified"
  | "password_reset_requested"
  | "password_reset"
  | "password_changed"
  | "session_revoked"
  | "sessions_revoked"
  | "role_changed"
  | "owner_bootstrapped"

const ON_SUCCESS: Record<string, SecurityEventType> = {
  "/sign-in/email": "sign_in",
  "/sign-up/email": "sign_up",
  "/sign-out": "sign_out",
  "/verify-email": "email_verified",
  "/request-password-reset": "password_reset_requested",
  "/reset-password": "password_reset",
  "/change-password": "password_changed",
  "/revoke-session": "session_revoked",
  "/revoke-sessions": "sessions_revoked",
  "/revoke-other-sessions": "sessions_revoked",
}

const ON_FAILURE: Record<string, SecurityEventType> = {
  "/sign-in/email": "sign_in_failed",
}

export const eventForAuthRequest = ({
  path,
  ok,
}: {
  readonly path: string
  readonly ok: boolean
}): SecurityEventType | null => (ok ? ON_SUCCESS : ON_FAILURE)[path] ?? null
