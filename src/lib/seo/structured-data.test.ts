// @vitest-environment node
import { faqs, services } from "@/features/marketing/content"
import { describe, expect, it } from "vitest"

import {
  breadcrumbSchema,
  faqSchema,
  professionalServiceSchema,
  serviceCatalogSchema,
  websiteSchema,
} from "./structured-data"

describe("structured data", () => {
  it("describes the business as a professional service with a real service area", () => {
    const schema = professionalServiceSchema()
    expect(schema["@type"]).toBe("ProfessionalService")
    expect(schema.areaServed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "South Florida" }),
      ])
    )
    expect(schema.email).toBe("hello@cadogy.com")
    expect(schema.foundingDate).toBe("2020")
  })

  it("names both founders with their current titles and only services we sell", () => {
    const schema = professionalServiceSchema()
    expect(
      schema.founder.map((founder) => [founder.name, founder.jobTitle])
    ).toEqual([
      ["Charles Knapp", "Co-Founder & CTO"],
      ["Dylan Safra", "Co-Founder & CFO"],
    ])
    expect(schema.knowsAbout).not.toContain("Digital Rights Management")
  })

  it("exposes site search so engines can offer a search box", () => {
    expect(websiteSchema().potentialAction).toMatchObject({
      "@type": "SearchAction",
      target: expect.stringContaining("/articles?search={search_term_string}"),
    })
  })

  it("builds ordered breadcrumbs with absolute URLs", () => {
    const schema = breadcrumbSchema([
      { name: "Work", path: "/work" },
      { name: "PlayerBay", path: "/work/playerbay" },
    ])
    expect(schema.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://cadogy.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Work",
        item: "https://cadogy.com/work",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "PlayerBay",
        item: "https://cadogy.com/work/playerbay",
      },
    ])
  })

  it("lists every service we offer, provided by Cadogy", () => {
    const schema = serviceCatalogSchema()
    expect(schema.itemListElement).toHaveLength(services.length)
    expect(schema.itemListElement[0]).toMatchObject({
      "@type": "Service",
      name: services[0]?.title,
      provider: { "@type": "Organization", name: "Cadogy" },
    })
  })

  it("turns the FAQ into question and answer pairs", () => {
    const schema = faqSchema()
    expect(schema.mainEntity).toHaveLength(faqs.length)
    expect(schema.mainEntity[0]).toEqual({
      "@type": "Question",
      name: faqs[0]?.question,
      acceptedAnswer: { "@type": "Answer", text: faqs[0]?.answer },
    })
  })
})
