// @vitest-environment node
import { describe, expect, it } from "vitest"

import { faqFromArticleHtml } from "./faq"

describe("faqFromArticleHtml", () => {
  it("reads each question and its full answer from the faq block", () => {
    const html = `<p>Intro</p><section data-block="faq">
<h3 id="a">Is a monolith &amp; slow?</h3>
<p>No.</p><p>Bad <strong>boundaries</strong> are.</p>
<h3 id="b">When should I split?</h3>
<ul><li>When it scales alone</li></ul>
</section>`

    expect(faqFromArticleHtml(html)).toEqual([
      { question: "Is a monolith & slow?", answer: "No. Bad boundaries are." },
      { question: "When should I split?", answer: "When it scales alone" },
    ])
  })

  it("finds nothing when the article has no faq block", () => {
    expect(faqFromArticleHtml("<h3>Not a faq</h3><p>x</p>")).toEqual([])
  })
})
