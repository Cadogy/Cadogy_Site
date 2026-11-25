// @vitest-environment node
import { describe, expect, it } from "vitest"

import { compileArticle } from "./compile"

const source = (body: string, front = "") => `---
title: Modular monoliths, done properly
description: How to draw module boundaries that hold up.
topic: Architecture
tags: [Architecture, TypeScript]
${front}---
${body}`

describe("compileArticle", () => {
  it("reads the metadata the site and search engines need", () => {
    const article = compileArticle(source("Intro."), "modular-monoliths")

    expect(article.meta).toEqual({
      slug: "modular-monoliths",
      title: "Modular monoliths, done properly",
      description: "How to draw module boundaries that hold up.",
      topic: "Architecture",
      tags: ["Architecture", "TypeScript"],
    })
  })

  it("turns markdown into html with linkable section headings", () => {
    const { html } = compileArticle(
      source("## Why boundaries matter\n\nText with `code`."),
      "x"
    )

    expect(html).toContain(
      '<h2 id="why-boundaries-matter">Why boundaries matter</h2>'
    )
    expect(html).toContain("<code>code</code>")
  })

  it("wraps the key takeaways in a summary block", () => {
    const { html } = compileArticle(
      source(":::summary\n- Draw boundaries first\n- Split later\n:::"),
      "x"
    )

    expect(html).toContain('<aside data-block="summary">')
    expect(html).toContain("<li>Draw boundaries first</li>")
  })

  it("marks callouts with their tone", () => {
    const { html } = compileArticle(
      source(":::callout warning\nNever trust the client.\n:::"),
      "x"
    )

    expect(html).toContain('<aside data-block="callout" data-tone="warning">')
    expect(html).toContain("<p>Never trust the client.</p>")
  })

  it("keeps questions and answers in a faq block", () => {
    const { html } = compileArticle(
      source(
        ":::faq\n### Is a monolith slow?\n\nNo. Bad boundaries are.\n\n### When should I split?\n\nWhen a module needs to scale on its own.\n:::"
      ),
      "x"
    )

    expect(html).toContain('<section data-block="faq">')
    expect(html).toContain(
      '<h3 id="is-a-monolith-slow">Is a monolith slow?</h3>'
    )
    expect(html).toContain("<p>No. Bad boundaries are.</p>")
  })

  it("lists sources with links that open safely", () => {
    const { html } = compileArticle(
      source(
        ":::sources\n- [Shopify engineering](https://shopify.engineering/x)\n:::"
      ),
      "x"
    )

    expect(html).toContain('<aside data-block="sources">')
    expect(html).toContain('href="https://shopify.engineering/x"')
  })

  it("rejects an article without a meta description", () => {
    expect(() =>
      compileArticle("---\ntitle: No description\n---\nBody", "x")
    ).toThrow(/description/)
  })

  it("rejects an unknown block so typos never reach readers", () => {
    expect(() => compileArticle(source(":::sumary\n- a\n:::"), "x")).toThrow(
      /sumary/
    )
  })

  it("lets an article choose its cover pattern", () => {
    expect(
      compileArticle(source("Body", "cover: skyline\n"), "x").meta.cover
    ).toBe("skyline")
  })

  it("rejects a cover pattern that doesn't exist", () => {
    expect(() =>
      compileArticle(source("Body", "cover: zigzag\n"), "x")
    ).toThrow(/cover/)
  })
})
