import { services } from "@/features/marketing/content"
import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const latestPosts = vi.hoisted(() => ({ value: [] as unknown[] }))

vi.mock("@/lib/wordpress-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/wordpress-api")>()),
  getLatestPosts: async () => latestPosts.value,
}))

const { default: HomePage } = await import("./page")

const post = (id: number, title: string) => ({
  id,
  slug: `post-${id}`,
  date_gmt: "2026-01-29T03:00:00",
  title: { rendered: title },
  excerpt: { rendered: "<p>Excerpt</p>" },
  _embedded: {},
})

describe("home page", () => {
  it("leads with a single h1 value proposition and two clear calls to action", async () => {
    render(await HomePage())

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "We can build anything. And we stand behind it."
    )
    expect(
      screen.getAllByRole("link", { name: "Start a project" })[0]
    ).toHaveAttribute("href", "/contact")
    expect(screen.getByRole("link", { name: "See our work" })).toHaveAttribute(
      "href",
      "/work"
    )
  })

  it("opens with a cinematic carousel featuring our work and latest writing", async () => {
    latestPosts.value = [
      post(1, "Modular monoliths &amp; AI"),
      post(2, "Cloudflare basics"),
    ]
    render(await HomePage())

    const carousel = screen.getByRole("region", {
      name: "Featured work and writing",
    })
    expect(
      within(carousel).getByRole("link", { name: "PlayerBay" })
    ).toHaveAttribute("href", "/work/playerbay")
    expect(
      within(carousel).getByRole("link", { name: "Modular monoliths & AI" })
    ).toHaveAttribute("href", "/articles/post-1")
  })

  it("still shows the work slide when the blog is unavailable", async () => {
    latestPosts.value = []
    render(await HomePage())
    const carousel = screen.getByRole("region", {
      name: "Featured work and writing",
    })
    expect(within(carousel).getAllByRole("group")).toHaveLength(1)
  })

  it("presents the three featured services as image cards with visible descriptions", async () => {
    render(await HomePage())
    const section = screen.getByRole("region", { name: /What we do/ })

    for (const service of services.filter((item) => item.featured)) {
      expect(
        within(section).getByRole("link", { name: service.title })
      ).toHaveAttribute("href", `/services#${service.slug}`)
      expect(within(section).getByText(service.summary)).toBeVisible()
    }
  })

  it("features PlayerBay with promises its buyers can verify", async () => {
    render(await HomePage())
    const work = screen.getByRole("region", { name: /Proof, not promises/ })
    expect(
      within(work).getByText("Paid only when you confirm")
    ).toBeInTheDocument()
    expect(
      within(work).getByRole("link", { name: /read the playerbay case study/i })
    ).toHaveAttribute("href", "/work/playerbay")
  })

  it("makes no unverifiable headcount or tenure claims", async () => {
    const { container } = render(await HomePage())
    expect(container.textContent).not.toMatch(
      /200 developers|15\+ years|500\+ projects/i
    )
  })

  it("sells outcomes, not tooling: never pitches our own use of AI", async () => {
    const { container } = render(await HomePage())
    expect(container.textContent).not.toMatch(
      /AI[- ]accelerated|accelerated by AI|AI at every|AI-native|AI-powered delivery|\bwe use AI\b/i
    )
  })
})
