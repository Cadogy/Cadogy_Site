import { themeColors } from "@/config/theme-colors"

export type CoverCell = {
  readonly column: number
  readonly row: number
  readonly strength: number
}

export type TopicIcon = "boxes" | "shield" | "card" | "sparkles" | "code"

export type TopicStyle = { readonly tone: string; readonly icon: TopicIcon }

const TOPICS: Record<string, TopicStyle> = {
  engineering: { tone: themeColors.brand, icon: "code" },
  architecture: { tone: themeColors.brand, icon: "boxes" },
  security: { tone: themeColors.warning, icon: "shield" },
  payments: { tone: themeColors.success, icon: "card" },
  ai: { tone: themeColors.violet, icon: "sparkles" },
}

const FALLBACK: TopicStyle = { tone: themeColors.brand, icon: "code" }

export const topicStyle = (topic: string): TopicStyle =>
  TOPICS[topic.trim().toLowerCase()] ?? FALLBACK

const hash = (text: string) =>
  [...text].reduce(
    (value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0,
    2166136261
  )

const noise = (seed: number, column: number, row: number) => {
  const n = Math.sin(column * 127.1 + row * 311.7 + seed * 0.0001) * 43758.5453
  return n - Math.floor(n)
}

export const COVER_VARIANTS = ["ring", "band", "skyline", "clusters"] as const

export type CoverVariant = (typeof COVER_VARIANTS)[number]

export const coverVariant = (seed: string): CoverVariant =>
  COVER_VARIANTS[hash(seed) % COVER_VARIANTS.length] ?? "ring"

type Point = {
  readonly dx: number
  readonly dy: number
  readonly distance: number
  readonly y: number
  readonly value: number
  readonly coarse: number
}

const gauss = (offset: number, width: number) =>
  Math.exp(-(offset ** 2) / width)

const SHAPES: Record<CoverVariant, (point: Point, angle: number) => number> = {
  ring: ({ dx, dy, distance, value }, angle) =>
    gauss(distance - 0.42, 0.06) *
    (0.35 + 0.65 * (0.5 + 0.5 * Math.cos(Math.atan2(dy, dx) - angle))) *
    value,
  band: ({ dx, dy, value }, angle) => {
    const across = dx * Math.sin(angle) - dy * Math.cos(angle)
    return (gauss(across, 0.035) + 0.5 * gauss(across - 0.38, 0.02)) * value
  },
  skyline: ({ y, coarse, value }) => {
    const height = 0.25 + 0.45 * coarse
    const rise = (y - (1 - height)) / height
    return rise > 0 ? (0.4 + 0.6 * rise) * value : 0
  },
  clusters: ({ coarse, value, distance }) =>
    coarse > 0.62 ? (coarse - 0.45) * 1.8 * value * (0.6 + distance) : 0,
}

const BADGE_CLEARANCE = 0.26

export const coverCells = ({
  seed,
  columns,
  rows,
  variant = coverVariant(seed),
}: {
  seed: string
  columns: number
  rows: number
  variant?: CoverVariant
}): readonly CoverCell[] => {
  const salt = hash(seed)
  const angle = (salt % 360) * (Math.PI / 180)
  const centerX = (columns - 1) / 2
  const centerY = (rows - 1) / 2
  const reach = Math.hypot(centerX, centerY)
  const shape = SHAPES[variant]
  return Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const dx = (column - centerX) / reach
    const dy = (row - centerY) / reach
    const point: Point = {
      dx,
      dy,
      distance: Math.hypot(dx, dy),
      y: row / Math.max(rows - 1, 1),
      value: noise(salt, column, row),
      coarse: noise(salt + 7, Math.floor(column / 4), Math.floor(row / 4)),
    }
    return {
      column,
      row,
      distance: point.distance,
      strength: shape(point, angle),
    }
  })
    .filter((cell) => cell.distance > BADGE_CLEARANCE && cell.strength > 0.16)
    .map(({ column, row, strength }) => ({
      column,
      row,
      strength: Math.min(1, strength * 1.4),
    }))
}
