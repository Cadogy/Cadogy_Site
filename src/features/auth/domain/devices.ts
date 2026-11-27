const BROWSERS: readonly (readonly [RegExp, string])[] = [
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/Firefox\/|FxiOS/, "Firefox"],
  [/Chrome\/|CriOS/, "Chrome"],
  [/Safari\//, "Safari"],
]

const SYSTEMS: readonly (readonly [RegExp, string])[] = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/CrOS/, "ChromeOS"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Linux/, "Linux"],
]

const match = (
  table: readonly (readonly [RegExp, string])[],
  userAgent: string
) => table.find(([pattern]) => pattern.test(userAgent))?.[1]

export const describeDevice = (userAgent: string | null | undefined) => {
  if (!userAgent) return "Unknown device"
  const browser = match(BROWSERS, userAgent)
  const system = match(SYSTEMS, userAgent)
  if (!browser) return "Unknown browser"
  return system ? `${browser} on ${system}` : browser
}

/** Shortens a fully written-out IPv6 address the standard way (RFC 5952). */
const hideUnspecified = (ip: string) => (ip === "::" ? "" : ip)

const compressIpv6 = (ip: string) => {
  const groups = ip.split(":")
  if (groups.length !== 8 || !groups.every((g) => /^[0-9a-f]{1,4}$/i.test(g)))
    return ip
  const short = groups.map((group) =>
    group.replace(/^0+(?=.)/, "").toLowerCase()
  )
  // Longest run of zero groups (at least two) becomes "::".
  const best = short.reduce(
    (acc, group, index) => {
      if (group !== "0") return { ...acc, run: 0 }
      const run = acc.run + 1
      return run > acc.length
        ? { run, length: run, start: index - run + 1 }
        : { ...acc, run }
    },
    { run: 0, length: 0, start: -1 }
  )
  if (best.length < 2) return short.join(":")
  const head = short.slice(0, best.start).join(":")
  const tail = short.slice(best.start + best.length).join(":")
  return `${head}::${tail}`
}

/** "" when unknown; the all-zero address means no real address was seen. */
export const displayIp = (ip: string | null | undefined) =>
  hideUnspecified(
    compressIpv6((ip ?? "").replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, ""))
  )
