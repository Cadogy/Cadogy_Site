// @vitest-environment node
import { describe, expect, it } from "vitest"

import { coverArt } from "./cover-art"

const mark = (name: string) =>
  `<svg viewBox="0 0 24 24" color="#635BFF" fill="currentColor"><title>${name}</title><path d="M0 0h24v24H0z"/></svg>`

const art = (marks: readonly string[] = [mark("Stripe")]) =>
  coverArt({
    width: 1200,
    height: 675,
    cell: 25,
    shade: () => [200, 210, 230],
    marks,
  })

const cells = (overlay: string, kind: "photo" | "brand") =>
  [
    ...overlay.matchAll(
      new RegExp(`<rect data-cell="${kind}" x="([\\d.]+)" y="([\\d.]+)"`, "g")
    ),
  ].map((match) => ({ x: Number(match[1]), y: Number(match[2]) }))

describe("coverArt", () => {
  it("fades the photo out along a straight line, not a vignette", () => {
    const { fade } = art()

    expect(fade).toContain("<linearGradient")
    expect(fade).not.toContain("radialGradient")
  })

  it("breaks the photo into blocks only where it fades", () => {
    const photo = cells(art().overlay, "photo")

    expect(photo.length).toBeGreaterThan(20)
    expect(Math.min(...photo.map((cell) => cell.y))).toBeGreaterThan(675 * 0.3)
  })

  it("trails off into brand blocks below the photo", () => {
    const brand = cells(art().overlay, "brand")

    expect(brand.length).toBeGreaterThan(10)
    expect(Math.min(...brand.map((cell) => cell.y))).toBeGreaterThan(675 * 0.5)
  })

  it("centers one tile per mark so portrait crops keep every logo", () => {
    const { overlay } = art([mark("Next.js"), mark("Lighthouse")])
    const tiles = [
      ...overlay.matchAll(
        /<rect data-tile="mark" x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/g
      ),
    ].map((match) => Number(match[1]) + Number(match[2]) / 2)

    expect(tiles).toHaveLength(2)
    expect(tiles.reduce((sum, center) => sum + center, 0) / 2).toBeCloseTo(600)
  })

  it("places each mark inside its tile in its own brand color", () => {
    const { overlay } = art()

    expect(overlay).toMatch(
      /<svg x="[\d.]+" y="[\d.]+" width="[\d.]+" height="[\d.]+" viewBox="0 0 24 24" color="#635BFF"/
    )
  })

  it("draws the same cover every time", () => {
    expect(art()).toEqual(art())
  })
})
