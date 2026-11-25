// @vitest-environment node
import {
  caseStudies,
  faqs,
  processSteps,
  services,
} from "@/features/marketing/content"
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

  it("points to the live site of each product we built", () => {
    expect(doc).toContain("Live site: https://playerbay.com")
    expect(doc).toContain("Live site: https://www.opencodesidecar.com")
  })

  it("answers the common questions directly", () => {
    expect(doc).toContain(`### ${faqs[0]?.question}`)
    expect(doc).toContain(faqs[0]?.answer ?? "")
  })

  it("states the canonical facts", () => {
    expect(doc).toContain("Founded: 2020")
    expect(doc).toContain("Contact: hello@cadogy.com")
  })

  it("introduces the studio as two hands-on founders", () => {
    expect(doc).toContain("two-person senior software studio")
    expect(doc).toContain(
      "Charles Knapp (Co-Founder & CTO): https://www.linkedin.com/in/knappcharles"
    )
  })

  it("lists what each service includes", () => {
    for (const service of services)
      for (const item of service.includes) expect(doc).toContain(item)
  })

  it("shares each product's verified figures with where they come from", () => {
    for (const study of caseStudies) {
      for (const fact of study.facts)
        expect(doc).toContain(`${fact.label}: ${fact.value}`)
      expect(doc).toContain(study.factsSource)
      expect(doc).toContain(study.stack.join(", "))
    }
  })

  it("explains how we work and how each engagement is priced", () => {
    expect(doc).toContain("## How we work")
    for (const step of processSteps)
      expect(doc).toContain(`${step.title}: ${step.body}`)
    expect(doc).toContain("## Ways to work with us")
    expect(doc).toContain(
      "Fixed-scope projects (most projects): Best for: New products"
    )
    expect(doc).toContain("How it's priced: Billed monthly")
  })

  it("ends with the optional links, as the llms.txt format suggests", () => {
    const optional = doc.indexOf("## Optional")
    expect(optional).toBeGreaterThan(
      doc.indexOf("## Frequently asked questions")
    )
    expect(doc.slice(optional)).toContain("Privacy policy")
    expect(doc.slice(optional)).not.toContain("## Services")
    expect(doc).not.toMatch(/\n{3}/)
  })
})
