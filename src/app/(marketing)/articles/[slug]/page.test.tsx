import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({
  cacheLife: () => undefined,
  cacheTag: () => undefined,
}))

vi.mock("@/lib/wordpress-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/wordpress-api")>()),
  getPostBySlug: async () => ({
    id: 7,
    slug: "cloudflare-basics",
    date_gmt: "2025-03-29T12:00:00",
    modified_gmt: "2025-03-30T12:00:00",
    title: { rendered: "How to use Cloudflare" },
    excerpt: { rendered: "<p>Protect your site.</p>" },
    content: {
      rendered:
        '<h2>Why it matters</h2><p>Text.</p><h2>Setting it up</h2><p>More.</p><section data-block="faq"><h3>Is Cloudflare free?</h3><p>The core protection is.</p></section>',
    },
    _embedded: { author: [{ name: "Charles Knapp" }] },
  }),
  getLatestPosts: async () =>
    [7, 8, 9].map((id) => ({
      id,
      slug: `post-${id}`,
      date_gmt: "2025-03-29T12:00:00",
      title: { rendered: `Post ${id}` },
      excerpt: { rendered: "<p>Summary.</p>" },
      content: { rendered: "<p>Text.</p>" },
    })),
}))

const { default: ArticlePage } = await import("./page")

const renderArticle = async () =>
  render(
    await ArticlePage({
      params: Promise.resolve({ slug: "cloudflare-basics" }),
    })
  )

describe("Article page", () => {
  it("has a single h1 and a way back to every article", async () => {
    await renderArticle()

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "How to use Cloudflare"
    )
    expect(screen.getByRole("link", { name: /All articles/ })).toHaveAttribute(
      "href",
      "/articles"
    )
  })

  it("indexes the article's sections so readers can jump between them", async () => {
    await renderArticle()
    const index = await screen.findByRole("navigation", {
      name: "On this page",
    })

    expect(
      within(index).getByRole("link", { name: "Setting it up" })
    ).toHaveAttribute("href", "#setting-it-up")
  })

  it("credits the founder who wrote it and offers ways to share it", async () => {
    await renderArticle()

    expect(screen.getByText("Co-Founder & CTO")).toBeInTheDocument()
    const share = within(
      screen.getByRole("group", { name: "Share this article" })
    )
    expect(
      share.getByRole("link", { name: "Share on LinkedIn" })
    ).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent("/articles/cloudflare-basics"))
    )
    expect(share.getByRole("link", { name: "Share on X" })).toBeInTheDocument()
    expect(share.getByRole("button", { name: "Copy link" })).toBeInTheDocument()
  })

  it("suggests more articles without repeating the one you're reading", async () => {
    await renderArticle()
    const more = within(
      screen.getByRole("region", { name: "More articles to read" })
    )

    expect(more.getAllByRole("article")).toHaveLength(2)
    expect(more.queryByText("Post 7")).not.toBeInTheDocument()
  })

  it("tells search engines about the questions it answers", async () => {
    const { container } = await renderArticle()
    const schemas = [
      ...container.querySelectorAll('script[type="application/ld+json"]'),
    ].map((script) => script.textContent ?? "")

    expect(schemas.join("")).toContain('"@type":"FAQPage"')
    expect(schemas.join("")).toContain("Is Cloudflare free?")
  })
})
