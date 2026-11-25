// @vitest-environment node
import { describe, expect, it } from "vitest"

import { compileArticle } from "./compile"

const source = (body: string, front = "") => `---
title: Modular monoliths, done properly
description: How to draw module boundaries that hold up.
topic: Architecture
tags: [Architecture, TypeScript]
cover:
  image: media/modular/cover.jpg
  alt: Shipping containers stacked in rows
  credit: Photo by Jane Doe on Unsplash
  creditUrl: https://unsplash.com/photos/abc
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
      cover: {
        image: "media/modular/cover.jpg",
        alt: "Shipping containers stacked in rows",
        credit: "Photo by Jane Doe on Unsplash",
        creditUrl: "https://unsplash.com/photos/abc",
        marks: [],
      },
    })
  })

  it("reads the logos to brand the cover with", () => {
    const article = compileArticle(
      source("Intro.").replace(
        "  creditUrl: https://unsplash.com/photos/abc\n",
        "  creditUrl: https://unsplash.com/photos/abc\n  marks: [nextdotjs, lighthouse]\n"
      ),
      "x"
    )

    expect(article.meta.cover.marks).toEqual(["nextdotjs", "lighthouse"])
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

  it("requires a cover photo with alt text", () => {
    expect(() =>
      compileArticle(
        ["---", "title: T", "description: D", "---", "Body"].join("\n"),
        "x"
      )
    ).toThrow(/cover/)
  })

  it("places a captioned, credited image from the article's media folder", () => {
    const { html, media } = compileArticle(
      source(
        [
          ":::figure media/modular/diagram.png",
          "alt: Modules calling each other through public interfaces",
          "caption: Each module talks to others only through its interface.",
          "credit: Diagram by Cadogy",
          ":::",
        ].join("\n")
      ),
      "x"
    )

    expect(html).toContain('<img src="media:media/modular/diagram.png"')
    expect(html).toContain(
      'alt="Modules calling each other through public interfaces"'
    )
    expect(html).toContain(
      "<figcaption>Each module talks to others only through its interface. <span>Diagram by Cadogy</span></figcaption>"
    )
    expect(media).toEqual([
      {
        path: "media/modular/cover.jpg",
        alt: "Shipping containers stacked in rows",
      },
      {
        path: "media/modular/diagram.png",
        alt: "Modules calling each other through public interfaces",
      },
    ])
  })

  it("rejects a figure without alt text", () => {
    expect(() =>
      compileArticle(
        source([":::figure media/x.png", "caption: Hi", ":::"].join("\n")),
        "x"
      )
    ).toThrow(/alt/)
  })

  it("embeds a YouTube video without tracking cookies", () => {
    const { html } = compileArticle(
      source([":::youtube dQw4w9WgXcQ", "How webhooks work", ":::"].join("\n")),
      "x"
    )

    expect(html).toContain(
      'src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"'
    )
    expect(html).toContain('title="How webhooks work"')
    expect(html).toContain("<figcaption>How webhooks work</figcaption>")
  })

  it("rejects a malformed YouTube id", () => {
    expect(() =>
      compileArticle(
        source([":::youtube not-an-id", "Title", ":::"].join("\n")),
        "x"
      )
    ).toThrow(/YouTube/)
  })
})

describe("cover credit", () => {
  it("ends the article with the cover photo's credit, linked to the original", () => {
    const { html } = compileArticle(
      [
        "---",
        "title: T",
        "description: D",
        "cover:",
        "  image: media/x/cover.jpg",
        "  alt: Keys",
        "  credit: Photo by Ari Sha on Unsplash",
        "  creditUrl: https://unsplash.com/photos/abc",
        "---",
        "Body",
      ].join("\n"),
      "x"
    )

    expect(html.trimEnd()).toMatch(
      /<p><em>Cover: <a href="https:\/\/unsplash\.com\/photos\/abc">Photo by Ari Sha on Unsplash<\/a><\/em><\/p>$/
    )
  })
})

describe("code blocks", () => {
  const withCover = (body: string) =>
    [
      "---",
      "title: T",
      "description: D",
      "cover:",
      "  image: media/x/cover.jpg",
      "  alt: Keys",
      "---",
      body,
    ].join("\n")

  it("colors code by its language", () => {
    const { html } = compileArticle(
      withCover(["```ts", "const total: number = 42", "```"].join("\n")),
      "x"
    )

    expect(html).toContain('<pre class="shiki')
    expect(html).toMatch(/<span style="color:#[0-9A-Fa-f]{6}">const<\/span>/)
    expect(html).toContain("42</span>")
  })

  it("still renders code in a language it doesn't know", () => {
    const { html } = compileArticle(
      withCover(["```brainfuck", "++>-", "```"].join("\n")),
      "x"
    )

    expect(html).toContain("++>-")
  })
})
