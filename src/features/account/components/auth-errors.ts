type AuthError = {
  readonly code?: string
  readonly message?: string
  readonly status: number
}

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Incorrect email or password.",
  EMAIL_NOT_VERIFIED:
    "Verify your email to sign in. We've sent you a new verification link.",
  PASSWORD_COMPROMISED:
    "This password has appeared in a data breach. Please choose a different one.",
  PASSWORD_TOO_SHORT: "Use at least 12 characters.",
  PASSWORD_TOO_LONG: "Use at most 128 characters.",
  INVALID_PASSWORD: "Your current password is incorrect.",
  INVALID_TOKEN: "This link is invalid or has expired. Request a new one.",
  SESSION_EXPIRED: "For your security, please sign in again to do this.",
  SESSION_NOT_FRESH:
    "For your security, sign out and sign in again, then try this within 10 minutes.",
  INVALID_CODE:
    "That code didn't work. Check that your device's clock is correct and try again.",
  INVALID_BACKUP_CODE:
    "That backup code didn't work, or it's already been used.",
  INVALID_TWO_FACTOR_COOKIE: "Your sign-in timed out. Please start again.",
  TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE:
    "Too many wrong codes. Please sign in again.",
  AUTH_CANCELLED: "Passkey sign-in was cancelled.",
  AUTHENTICATION_FAILED:
    "That passkey didn't work. Try again or use your password.",
  REGISTRATION_CANCELLED: "Adding the passkey was cancelled.",
  PREVIOUSLY_REGISTERED: "This passkey is already on your account.",
}

export const authErrorMessage = (error: AuthError) => {
  if (error.status === 429)
    return "Too many attempts. Wait a minute and try again."
  const known = error.code ? MESSAGES[error.code] : undefined
  return known ?? error.message ?? "Something went wrong. Please try again."
}
