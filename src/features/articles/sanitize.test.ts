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

  it("keeps the article blocks our compiler produces", () => {
    const html =
      '<aside data-block="callout" data-tone="warning"><p>Careful</p></aside><section data-block="faq"><h3 id="q">Q?</h3><p>A.</p></section>'
    const clean = sanitizeArticleHtml(html)

    expect(clean).toContain('<aside data-block="callout" data-tone="warning">')
    expect(clean).toContain('<section data-block="faq">')
  })

  it("drops block markers it doesn't know", () => {
    expect(
      sanitizeArticleHtml('<aside data-block="ad" data-tone="loud">x</aside>')
    ).toBe("<aside>x</aside>")
  })

  it("keeps lazily loaded, cookie-free YouTube embeds and figure credits", () => {
    const html =
      '<figure><iframe src="https://www.youtube-nocookie.com/embed/47sSju0UhPk" title="Webhooks" loading="lazy" allowfullscreen></iframe><figcaption>Webhooks <span>Stripe</span></figcaption></figure>'
    const clean = sanitizeArticleHtml(html)

    expect(clean).toContain(
      'src="https://www.youtube-nocookie.com/embed/47sSju0UhPk"'
    )
    expect(clean).toContain('loading="lazy"')
    expect(clean).toContain("<span>Stripe</span>")
  })
})

describe("highlighted code", () => {
  it("keeps token colors but drops any other inline style", () => {
    const clean = sanitizeArticleHtml(
      '<pre class="shiki" style="background-color:#24292e"><code><span style="color:#F97583">const</span><span style="position:fixed">x</span></code></pre>'
    )

    expect(clean).toContain('<span style="color:#F97583">const</span>')
    expect(clean).not.toContain("position")
    expect(clean).not.toContain("background-color")
  })
})
