export type SecurityEventType =
  | "sign_in"
  | "sign_in_backup_code"
  | "sign_in_passkey"
  | "sign_in_magic_link"
  | "magic_link_requested"
  | "sign_in_failed"
  | "two_factor_failed"
  | "account_locked"
  | "sign_up"
  | "sign_out"
  | "email_verified"
  | "password_reset_requested"
  | "password_reset"
  | "password_changed"
  | "session_revoked"
  | "sessions_revoked"
  | "two_factor_enabled"
  | "two_factor_disabled"
  | "backup_codes_regenerated"
  | "passkey_added"
  | "passkey_removed"
  | "role_changed"
  | "owner_bootstrapped"
  | "user_banned"
  | "user_unbanned"
  | "user_signed_out"
  | "two_factor_reset"
  | "impersonation_started"
  | "impersonation_stopped"
  | "email_change_requested"
  | "account_deleted"

const ON_SUCCESS: Record<string, SecurityEventType> = {
  "/sign-up/email": "sign_up",
  "/sign-out": "sign_out",
  "/verify-email": "email_verified",
  "/request-password-reset": "password_reset_requested",
  "/reset-password": "password_reset",
  "/change-password": "password_changed",
  "/revoke-session": "session_revoked",
  "/revoke-sessions": "sessions_revoked",
  "/revoke-other-sessions": "sessions_revoked",
  "/two-factor/disable": "two_factor_disabled",
  "/two-factor/generate-backup-codes": "backup_codes_regenerated",
  "/passkey/verify-registration": "passkey_added",
  "/passkey/delete-passkey": "passkey_removed",
  "/sign-in/magic-link": "magic_link_requested",
  "/change-email": "email_change_requested",
}

const ON_NEW_SESSION: Record<string, SecurityEventType> = {
  "/sign-in/email": "sign_in",
  "/two-factor/verify-totp": "sign_in",
  "/two-factor/verify-backup-code": "sign_in_backup_code",
  "/passkey/verify-authentication": "sign_in_passkey",
  "/magic-link/verify": "sign_in_magic_link",
}

const WHILE_SIGNED_IN: Record<string, SecurityEventType> = {
  "/two-factor/verify-totp": "two_factor_enabled",
}

const ON_FAILURE: Record<string, SecurityEventType> = {
  "/sign-in/email": "sign_in_failed",
  "/two-factor/verify-totp": "two_factor_failed",
  "/two-factor/verify-backup-code": "two_factor_failed",
}

const SESSION_CREATING_PATHS = new Set(Object.keys(ON_NEW_SESSION))

export const eventForAuthRequest = ({
  path,
  ok,
  newSession,
  signedIn,
}: {
  readonly path: string
  readonly ok: boolean
  readonly newSession: boolean
  readonly signedIn: boolean
}): SecurityEventType | null => {
  if (!ok) return ON_FAILURE[path] ?? null
  if (signedIn && WHILE_SIGNED_IN[path]) return WHILE_SIGNED_IN[path]
  if (newSession) return ON_NEW_SESSION[path] ?? ON_SUCCESS[path] ?? null
  if (SESSION_CREATING_PATHS.has(path)) return null
  return ON_SUCCESS[path] ?? null
}

const LABELS: Record<SecurityEventType, string> = {
  sign_in: "Signed in",
  sign_in_backup_code: "Signed in with a backup code",
  sign_in_passkey: "Signed in with a passkey",
  sign_in_magic_link: "Signed in with an email link",
  magic_link_requested: "Sign-in link requested",
  sign_in_failed: "Failed sign-in attempt",
  two_factor_failed: "Wrong two-factor code entered",
  account_locked: "Password sign-in locked after failed attempts",
  sign_up: "Account created",
  sign_out: "Signed out",
  email_verified: "Email verified",
  password_reset_requested: "Password reset requested",
  password_reset: "Password reset",
  password_changed: "Password changed",
  session_revoked: "Signed out a device",
  sessions_revoked: "Signed out other devices",
  two_factor_enabled: "Two-factor authentication turned on",
  two_factor_disabled: "Two-factor authentication turned off",
  backup_codes_regenerated: "New backup codes created",
  passkey_added: "Passkey added",
  passkey_removed: "Passkey removed",
  role_changed: "Role changed",
  owner_bootstrapped: "Became owner",
  user_banned: "Account banned",
  user_unbanned: "Account unbanned",
  user_signed_out: "Signed out everywhere by the studio",
  two_factor_reset: "Two-factor reset by the studio",
  impersonation_started: "Studio viewed the portal as this account",
  impersonation_stopped: "Studio stopped viewing as this account",
  email_change_requested: "Email change requested",
  account_deleted: "Account deleted",
}

export const securityEventLabel = (type: SecurityEventType) => LABELS[type]

const GROUPS: Record<string, readonly SecurityEventType[]> = {
  sign_ins: [
    "sign_in",
    "sign_in_backup_code",
    "sign_in_passkey",
    "sign_in_magic_link",
    "sign_out",
  ],
  failures: ["sign_in_failed", "two_factor_failed", "account_locked"],
  studio: [
    "role_changed",
    "owner_bootstrapped",
    "user_banned",
    "user_unbanned",
    "user_signed_out",
    "two_factor_reset",
    "impersonation_started",
    "impersonation_stopped",
  ],
  account: [
    "sign_up",
    "email_verified",
    "password_changed",
    "password_reset",
    "two_factor_enabled",
    "two_factor_disabled",
    "backup_codes_regenerated",
    "passkey_added",
    "passkey_removed",
    "email_change_requested",
    "account_deleted",
  ],
}

export const eventsInGroup = (group: string) => GROUPS[group] ?? null
