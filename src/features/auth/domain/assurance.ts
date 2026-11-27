export type Assurance = "single" | "multi"

const MULTI_FACTOR_PATHS = new Set([
  "/two-factor/verify-totp",
  "/two-factor/verify-backup-code",
  "/passkey/verify-authentication",
])

/** Endpoints that add, remove or reveal a second factor. */
const FACTOR_CHANGE_PATHS = new Set([
  "/two-factor/enable",
  "/two-factor/disable",
  "/two-factor/generate-backup-codes",
  "/two-factor/get-totp-uri",
  "/passkey/generate-register-options",
  "/passkey/verify-registration",
  "/passkey/delete-passkey",
])

export const changesFactors = (path: string) => FACTOR_CHANGE_PATHS.has(path)

/**
 * Second factors can only be changed from a session that proved one, unless
 * the account has none yet. Otherwise a session from a password or an email
 * link alone could swap in an attacker's passkey or authenticator, or remove
 * the factor that guards the account.
 */
export const mayChangeFactors = ({
  path,
  assurance,
  factorCount,
}: {
  readonly path: string
  readonly assurance: Assurance
  readonly factorCount: number
}) => !changesFactors(path) || assurance === "multi" || factorCount === 0

export const sessionAssurance = ({
  path,
  userHasTwoFactor,
}: {
  readonly path: string | undefined
  readonly userHasTwoFactor: boolean
}): Assurance => {
  if (path && MULTI_FACTOR_PATHS.has(path)) return "multi"
  if (path === "/sign-in/email" && userHasTwoFactor) return "multi"
  return "single"
}

/**
 * Proving a factor upgrades the current session. A code from an authenticator
 * proves itself; registering a passkey only counts as proof when it's the
 * account's first factor, because then there was nothing else to check.
 */
export const upgradesSession = (path: string, factorsAfter: number) =>
  path === "/two-factor/verify-totp" ||
  (path === "/passkey/verify-registration" && factorsAfter === 1)

export const staffAccess = ({
  assurance,
  hasSecondFactor,
}: {
  readonly assurance: Assurance
  readonly hasSecondFactor: boolean
}) => {
  if (assurance === "multi") return "allowed" as const
  return hasSecondFactor ? ("reauthenticate" as const) : ("enroll" as const)
}

/**
 * Whether shared portal chrome (the sidebar's waiting counts) may load staff
 * data. It must never trigger the strong-auth redirect itself: the portal
 * layout also wraps /account/security, where staff go to set up two-factor,
 * so redirecting from the layout would loop forever.
 */
export const canLoadStaffData = (user: {
  readonly assurance: Assurance
  readonly hasSecondFactor: boolean
}) => staffAccess(user) === "allowed"

const FRESH_FOR_MS = 10 * 60_000

export const isFreshSession = (signedInAt: Date, now: Date) =>
  now.getTime() - signedInAt.getTime() <= FRESH_FOR_MS
