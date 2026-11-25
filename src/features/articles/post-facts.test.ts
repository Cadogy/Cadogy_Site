// @vitest-environment node
import { describe, expect, it } from "vitest"

import { countWords, readingMinutes } from "./post-facts"

const words = (count: number) =>
  Array.from({ length: count }, () => "word").join(" ")

describe("reading time", () => {
  it("reads prose at about 230 words a minute", () => {
    expect(readingMinutes(`<p>${words(690)}</p>`)).toBe(3)
  })

  it("doesn't count code as prose, since readers skim it", () => {
    const html = `<p>${words(460)}</p><pre><code>${words(2000)}</code></pre>`

    expect(countWords(html)).toBe(460)
    expect(readingMinutes(html)).toBeLessThanOrEqual(4)
  })

  it("adds a little time for each image and video", () => {
    const prose = `<p>${words(460)}</p>`
    const media = `${prose}<img src="a.webp"><img src="b.webp"><iframe src="v"></iframe><iframe src="w"></iframe>`

    expect(readingMinutes(media)).toBeGreaterThan(readingMinutes(prose))
  })
})
