export const TURNSTILE_HEADER = "x-turnstile-token"

export const AUTH_COOKIE_PREFIX = "cadogy"

export const loginPath = (returnTo: string) =>
  `/login?callbackUrl=${encodeURIComponent(returnTo)}`
