const FALLBACK = "/dashboard"

export const safeCallbackPath = (
  target: string | null | undefined,
  origin?: string
): string => {
  if (!target) return FALLBACK
  if (origin && target.startsWith(origin))
    return safeCallbackPath(target.slice(origin.length) || "/")
  if (
    !target.startsWith("/") ||
    target.startsWith("//") ||
    target.startsWith("/\\")
  )
    return FALLBACK
  return target
}
