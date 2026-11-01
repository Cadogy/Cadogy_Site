import { describe, expect, it } from "vitest"

import { decodeHtml, extractExcerpt, formatDate } from "./wordpress-api"

describe("decodeHtml", () => {
  it("decodes the entities WordPress emits in titles", () => {
    expect(
      decodeHtml(
        "Tom &amp; Jerry&#8217;s &#8220;guide&#8221; &#8211; part&nbsp;1&hellip;"
      )
    ).toBe("Tom & Jerry’s “guide” – part 1…")
  })
})

describe("extractExcerpt", () => {
  it("strips markup and truncates on a word boundary", () => {
    expect(
      extractExcerpt("<p>Ship small, ship often, ship safely.</p>", 20)
    ).toBe("Ship small, ship…")
  })

  it("returns short text untouched", () => {
    expect(extractExcerpt("<p>Short.</p>")).toBe("Short.")
  })
})

describe("formatDate", () => {
  it("formats WordPress GMT timestamps without depending on the server timezone", () => {
    expect(formatDate("2026-01-29T03:00:00")).toBe("January 29, 2026")
  })
})
