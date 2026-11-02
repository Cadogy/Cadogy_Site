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

export const displayIp = (ip: string | null | undefined) =>
  (ip ?? "").replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, "")
