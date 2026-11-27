export type Assurance = "single" | "multi"

const MULTI_FACTOR_PATHS = new Set([
  "/two-factor/verify-totp",
  "/two-factor/verify-backup-code",
  "/passkey/verify-authentication",
])

const ENROLLMENT_PATHS = new Set([
  "/two-factor/verify-totp",
  "/passkey/verify-registration",
])

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

export const upgradesSession = (path: string) => ENROLLMENT_PATHS.has(path)

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
