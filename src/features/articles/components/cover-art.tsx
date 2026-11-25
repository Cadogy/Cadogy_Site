import { themeColors } from "@/config/theme-colors"

import { coverCells, topicStyle } from "../domain/cover"
import { TOPIC_ICON_PATHS } from "../domain/topic-icons"

const COLUMNS = 56

const rgba = (hex: string, alpha: number) => {
  const value = Number.parseInt(hex.slice(1), 16)
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha.toFixed(3)})`
}

export function CoverArt({
  slug,
  topic,
  title,
  width,
  height,
}: {
  slug: string
  topic: string
  title?: string
  width: number
  height: number
}) {
  const { tone, icon } = topicStyle(topic)
  const cell = width / COLUMNS
  const rows = Math.ceil(height / cell)
  const artHeight = title ? height * 0.58 : height
  const badge = Math.round(Math.min(width, artHeight) * 0.2)
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width,
        height,
        background: themeColors.canvas,
        fontFamily: "Geist",
      }}
    >
      {coverCells({ seed: slug, columns: COLUMNS, rows }).map((box) => (
        <div
          key={`${box.column}-${box.row}`}
          data-cell=""
          style={{
            position: "absolute",
            left: box.column * cell + 1.5,
            top: box.row * cell + 2 - (title ? (height - artHeight) / 2 : 0),
            width: cell - 3,
            height: cell - 3,
            borderRadius: 3,
            background: rgba(tone, 0.05 + box.strength * 0.33),
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: (width - badge) / 2,
          top: (artHeight - badge) / 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: badge,
          height: badge,
          borderRadius: badge * 0.22,
          background: themeColors.card,
          border: `1px solid ${rgba(themeColors.ink, 0.1)}`,
        }}
      >
        <svg
          role="img"
          aria-label={topic}
          width={badge * 0.46}
          height={badge * 0.46}
          viewBox="0 0 24 24"
          fill="none"
          stroke={tone}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {TOPIC_ICON_PATHS[icon].map((path) => (
            <path key={path} d={path} />
          ))}
        </svg>
      </div>
      {title ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: height - artHeight,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 18,
            padding: "0 72px",
            background: themeColors.canvas,
            borderTop: `1px solid ${rgba(themeColors.ink, 0.08)}`,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 14,
              fontSize: 26,
              color: themeColors.muted,
            }}
          >
            <span style={{ color: themeColors.ink }}>Cadogy</span>
            <span>·</span>
            <span style={{ color: tone }}>{topic}</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 54,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: themeColors.ink,
            }}
          >
            {title}
          </div>
        </div>
      ) : null}
    </div>
  )
}
