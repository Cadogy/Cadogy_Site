// @vitest-environment node
import { describe, expect, it } from "vitest"

import { brandedTitle, pageMetadata } from "./page-metadata"

describe("pageMetadata", () => {
  it("gives a page its own title, canonical URL and social card", () => {
    const metadata = pageMetadata({
      title: "Services",
      description: "What we build.",
      path: "/services",
    })

    expect(metadata.title).toBe("Services")
    expect(metadata.description).toBe("What we build.")
    expect(metadata.alternates).toEqual({ canonical: "/services" })
    expect(metadata.openGraph).toMatchObject({
      title: "Services · Cadogy",
      description: "What we build.",
      url: "/services",
      siteName: "Cadogy",
    })
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Services · Cadogy",
      description: "What we build.",
    })
  })

  it("passes an image and article details through to the social card", () => {
    const metadata = pageMetadata({
      title: "Stripe webhooks",
      description: "D",
      path: "/articles/stripe",
      image: "https://wp.example.com/cover.webp",
      article: {
        publishedTime: "2026-01-01T00:00:00Z",
        modifiedTime: "2026-01-02T00:00:00Z",
      },
    })

    expect(metadata.openGraph).toMatchObject({
      type: "article",
      images: [{ url: "https://wp.example.com/cover.webp" }],
      publishedTime: "2026-01-01T00:00:00Z",
    })
    expect(metadata.twitter).toMatchObject({
      images: ["https://wp.example.com/cover.webp"],
    })
  })

  it("lets the homepage use a full title without the suffix", () => {
    const metadata = pageMetadata({
      title: "Cadogy · Senior software studio",
      absoluteTitle: true,
      description: "D",
      path: "/",
    })

    expect(metadata.title).toEqual({
      absolute: "Cadogy · Senior software studio",
    })
    expect(metadata.openGraph).toMatchObject({
      title: "Cadogy · Senior software studio",
    })
  })
})

describe("brandedTitle", () => {
  it("uses one separator everywhere", () => {
    expect(brandedTitle("About")).toBe("About · Cadogy")
  })
})
