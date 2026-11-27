const FALLBACK = "/dashboard"

/** Only used to resolve paths; it never leaves this module. */
const RESOLVE_BASE = "https://callback.invalid"

// Browsers drop tabs and newlines inside URLs and read "\" as "/", so
// "/\t/evil.example" would pass a prefix check and still leave the site.
const UNSAFE_CHARACTERS = /[\u0000-\u001f\u007f\\]/

/**
 * A same-site path to send someone after signing in, or the dashboard. The
 * target is resolved as a URL and must stay on our origin.
 */
export const safeCallbackPath = (
  target: string | null | undefined,
  origin?: string
): string => {
  if (!target || UNSAFE_CHARACTERS.test(target)) return FALLBACK
  const path =
    origin && (target === origin || target.startsWith(`${origin}/`))
      ? target.slice(origin.length) || "/"
      : target
  if (!path.startsWith("/") || path.startsWith("//")) return FALLBACK
  try {
    const url = new URL(path, RESOLVE_BASE)
    if (url.origin !== RESOLVE_BASE) return FALLBACK
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return FALLBACK
  }
}
