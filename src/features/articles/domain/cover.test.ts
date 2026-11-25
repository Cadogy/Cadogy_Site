// @vitest-environment node
import { describe, expect, it } from "vitest"

import { coverCells, topicStyle } from "./cover"

const grid = { columns: 40, rows: 22 }

describe("coverCells", () => {
  it("draws the same pattern every time for the same article", () => {
    expect(coverCells({ seed: "modular-monoliths", ...grid })).toEqual(
      coverCells({ seed: "modular-monoliths", ...grid })
    )
  })

  it("gives each article its own pattern", () => {
    expect(coverCells({ seed: "modular-monoliths", ...grid })).not.toEqual(
      coverCells({ seed: "cloudflare-guide", ...grid })
    )
  })

  it("leaves the middle clear for the badge", () => {
    const middle = coverCells({ seed: "any", ...grid }).filter(
      (cell) =>
        Math.abs(cell.column - (grid.columns - 1) / 2) < 3 &&
        Math.abs(cell.row - (grid.rows - 1) / 2) < 3
    )

    expect(middle).toEqual([])
  })

  it("keeps every cell inside the grid with a visible strength", () => {
    for (const cell of coverCells({ seed: "bounds", ...grid })) {
      expect(cell.column).toBeGreaterThanOrEqual(0)
      expect(cell.column).toBeLessThan(grid.columns)
      expect(cell.row).toBeGreaterThanOrEqual(0)
      expect(cell.row).toBeLessThan(grid.rows)
      expect(cell.strength).toBeGreaterThan(0)
      expect(cell.strength).toBeLessThanOrEqual(1)
    }
  })
})

describe("topicStyle", () => {
  it("colors each topic consistently", () => {
    expect(topicStyle("Payments").tone).not.toBe(topicStyle("Security").tone)
    expect(topicStyle("Payments")).toEqual(topicStyle("payments"))
  })

  it("falls back to the brand style for topics it doesn't know", () => {
    expect(topicStyle("Gardening")).toEqual(topicStyle("Engineering"))
  })
})
