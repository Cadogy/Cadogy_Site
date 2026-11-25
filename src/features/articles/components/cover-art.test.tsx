import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { coverCells } from "../domain/cover"
import { CoverArt } from "./cover-art"

const size = { width: 1600, height: 900 }

describe("CoverArt", () => {
  it("draws the article's box pattern around a topic badge", () => {
    const { container } = render(
      <CoverArt slug="modular-monoliths" topic="Architecture" {...size} />
    )

    expect(container.querySelectorAll("[data-cell]")).toHaveLength(
      coverCells({ seed: "modular-monoliths", columns: 56, rows: 32 }).length
    )
    const badge = screen.getByRole("img", { name: "Architecture" })
    expect(badge.tagName.toLowerCase()).toBe("svg")
    expect(badge.querySelectorAll("path").length).toBeGreaterThan(0)
  })

  it("adds the title for social sharing", () => {
    render(
      <CoverArt
        slug="modular-monoliths"
        topic="Architecture"
        title="Modular monoliths, done properly"
        {...size}
      />
    )

    expect(screen.getByText("Modular monoliths, done properly")).toBeVisible()
  })
})
