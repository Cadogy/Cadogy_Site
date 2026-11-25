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

const BADGE_CLEARANCE = 0.16

export const coverCells = ({
  seed,
  columns,
  rows,
}: {
  seed: string
  columns: number
  rows: number
}): readonly CoverCell[] => {
  const salt = hash(seed)
  const angle = (salt % 360) * (Math.PI / 180)
  const centerX = (columns - 1) / 2
  const centerY = (rows - 1) / 2
  const reach = Math.hypot(centerX, centerY)
  return Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const dx = (column - centerX) / reach
    const dy = (row - centerY) / reach
    const distance = Math.hypot(dx, dy)
    const sweep = 0.5 + 0.5 * Math.cos(Math.atan2(dy, dx) - angle)
    const ring = Math.exp(-((distance - 0.42) ** 2) / 0.06)
    const value = noise(salt, column, row)
    const strength = ring * (0.35 + 0.65 * sweep) * value
    return { column, row, strength, distance }
  })
    .filter(
      (cell) => cell.distance > BADGE_CLEARANCE * 1.6 && cell.strength > 0.16
    )
    .map(({ column, row, strength }) => ({
      column,
      row,
      strength: Math.min(1, strength * 1.4),
    }))
}
