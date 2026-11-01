// @vitest-environment node
import { describe, expect, it } from "vitest"

import { sanitizeArticleHtml } from "./sanitize"

describe("sanitizeArticleHtml", () => {
  it("keeps editorial markup", () => {
    const html =
      '<h2 id="intro">Intro</h2><p>Hello <strong>world</strong> <a href="https://cadogy.com">link</a></p><figure><img src="https://wp.cadogy.com/a.png" alt="Chart" /><figcaption>Chart</figcaption></figure>'
    expect(sanitizeArticleHtml(html)).toBe(html)
  })

  it("removes scripts, inline handlers and javascript URLs", () => {
    const dirty =
      '<p onclick="steal()">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><img src=x onerror="alert(1)">'
    const clean = sanitizeArticleHtml(dirty)
    expect(clean).not.toMatch(/script|onclick|onerror|javascript:/i)
    expect(clean).toContain("<p>Hi</p>")
  })

  it("opens external links safely", () => {
    expect(
      sanitizeArticleHtml('<a href="https://example.com">x</a>')
    ).toContain('rel="noopener noreferrer"')
  })

  it("allows video embeds only from trusted hosts", () => {
    const youtube =
      '<iframe src="https://www.youtube.com/embed/abc" allowfullscreen></iframe>'
    expect(sanitizeArticleHtml(youtube)).toContain("youtube.com/embed/abc")
    expect(
      sanitizeArticleHtml('<iframe src="https://evil.example/x"></iframe>')
    ).not.toContain("evil.example")
  })
})
