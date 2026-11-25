// @vitest-environment node
import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/wordpress-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/wordpress-api")>()),
  getAllPosts: async () => [
    {
      slug: "stripe-webhooks",
      modified_gmt: "2026-11-25T05:00:00",
      _embedded: {
        "wp:featuredmedia": [
          { source_url: "https://wp.example.com/uploads/cover.webp" },
        ],
      },
    },
  ],
  getCategories: async () => [
    { slug: "payments", count: 1 },
    { slug: "culture", count: 0 },
  ],
}))

const { default: sitemap } = await import("./sitemap")

describe("sitemap", () => {
  it("lists every article with its last change and cover image", async () => {
    const entries = await sitemap()
    const article = entries.find((entry) =>
      entry.url.endsWith("/articles/stripe-webhooks")
    )

    expect(article).toMatchObject({
      lastModified: new Date("2026-11-25T05:00:00Z"),
      images: ["https://wp.example.com/uploads/cover.webp"],
    })
  })

  it("includes case studies with their product image", async () => {
    const entries = await sitemap()
    const study = entries.find((entry) => entry.url.endsWith("/work/playerbay"))

    expect(study?.images?.[0]).toMatch(/^https:\/\/.+\/images\/studio\//)
  })

  it("lists topics that have articles, and never empty ones", async () => {
    const urls = (await sitemap()).map((entry) => entry.url)

    expect(
      urls.some((url) => url.endsWith("/articles/category/payments"))
    ).toBe(true)
    expect(urls.some((url) => url.endsWith("/articles/category/culture"))).toBe(
      false
    )
  })

  it("never lists a page twice", async () => {
    const urls = (await sitemap()).map((entry) => entry.url)

    expect(new Set(urls).size).toBe(urls.length)
  })
})
