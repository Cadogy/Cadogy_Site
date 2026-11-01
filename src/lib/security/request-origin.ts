type OriginCheckedRequest = {
  readonly url: string
  readonly headers: Headers
}

const originOf = (value: string): string | null => {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export const isSameOriginRequest = (request: OriginCheckedRequest): boolean => {
  const expected = new URL(request.url).origin
  const origin = request.headers.get("origin")
  if (origin) return origin === expected

  const referer = request.headers.get("referer")
  if (!referer) return false
  return originOf(referer) === expected
}
