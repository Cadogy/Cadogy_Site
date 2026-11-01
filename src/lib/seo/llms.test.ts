// @vitest-environment node
import { faqs, services } from "@/features/marketing/content"
import { describe, expect, it } from "vitest"

import { buildLlmsTxt } from "./llms"

const doc = buildLlmsTxt({
  articles: [
    {
      title: "Why modular monoliths are winning",
      slug: "modular-monoliths",
      summary: "Fewer moving parts.",
    },
  ],
})

describe("buildLlmsTxt", () => {
  it("follows the llms.txt shape: a title, a one-line summary and sections", () => {
    const [title, , summary] = doc.split("\n")
    expect(title).toBe("# Cadogy")
    expect(summary).toMatch(/^> Cadogy is a senior software studio/)
    expect(doc).toContain("## Services")
    expect(doc).toContain("## Work")
    expect(doc).toContain("## Frequently asked questions")
  })

  it("links every service and article with absolute URLs", () => {
    for (const service of services) {
      expect(doc).toContain(
        `[${service.title}](https://cadogy.com/services#${service.slug})`
      )
    }
    expect(doc).toContain(
      "- [Why modular monoliths are winning](https://cadogy.com/articles/modular-monoliths): Fewer moving parts."
    )
  })

  it("answers the common questions directly", () => {
    expect(doc).toContain(`### ${faqs[0]?.question}`)
    expect(doc).toContain(faqs[0]?.answer ?? "")
  })

  it("states the canonical facts", () => {
    expect(doc).toContain("Founded: 2020")
    expect(doc).toContain("Contact: hello@cadogy.com")
  })
})
