import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

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
        "<h2>Why it matters</h2><p>Text.</p><h2>Setting it up</h2><p>More.</p>",
    },
    _embedded: { author: [{ name: "Charles Knapp" }] },
  }),
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
})
