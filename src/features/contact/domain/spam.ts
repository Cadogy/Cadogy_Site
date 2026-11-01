import { createHmac, timingSafeEqual } from "node:crypto"

const MIN_FILL_MS = 3_000
const MAX_AGE_MS = 2 * 60 * 60 * 1000
const MAX_LINKS = 3
const LINK_PATTERN = /https?:\/\/|www\./gi
const LETTER_WORD_PATTERN = /\p{L}{3,}/u
const SPAM_PHRASES = [
  /\bbacklinks?\b/i,
  /\bpage one of google\b/i,
  /\bguest post(ing)?\b/i,
  /\bcrypto(currency)? (investment|opportunity)\b/i,
  /\bcasino\b/i,
]

export type FormTimingResult = "ok" | "too_fast" | "expired" | "invalid"

const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url")

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export const issueFormToken = (issuedAt: Date, secret: string) => {
  const payload = String(issuedAt.getTime())
  return `${payload}.${sign(payload, secret)}`
}

export const checkFormTiming = (
  token: string,
  now: Date,
  secret: string
): FormTimingResult => {
  const [payload, signature, ...rest] = token.split(".")
  if (!payload || !signature || rest.length > 0 || !/^\d+$/.test(payload))
    return "invalid"
  if (!safeEqual(signature, sign(payload, secret))) return "invalid"

  const elapsed = now.getTime() - Number(payload)
  if (elapsed < MIN_FILL_MS) return "too_fast"
  if (elapsed > MAX_AGE_MS) return "expired"
  return "ok"
}

export const looksLikeSpam = (message: string) => {
  const links = message.match(LINK_PATTERN)?.length ?? 0
  if (links > MAX_LINKS) return true
  if (!LETTER_WORD_PATTERN.test(message)) return true
  return SPAM_PHRASES.some((pattern) => pattern.test(message))
}
