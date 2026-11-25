import { caseStudies, services } from "@/features/marketing/content"
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

  it("shows real products we built beside the headline", async () => {
    render(await HomePage())

    expect(
      screen.getByRole("img", { name: /PlayerBay.*invoice.*Sidecar/ })
    ).toBeInTheDocument()
  })

  it("names the products we run under the hero, each with one real figure", async () => {
    render(await HomePage())
    const strip = screen.getByRole("region", { name: "In production" })

    expect(
      within(strip).getByRole("link", { name: /PlayerBay.*3,200\+ test files/ })
    ).toHaveAttribute("href", "/work/playerbay")
    expect(
      within(strip).getByRole("link", {
        name: /Sidecar for OpenCode.*414 unit tests/,
      })
    ).toHaveAttribute("href", "/work/opencode-sidecar")
  })

  it("shows our latest writing when the blog has posts", async () => {
    latestPosts.value = [
      post(1, "Modular monoliths &amp; AI"),
      post(2, "Cloudflare basics"),
    ]
    render(await HomePage())
    const writing = screen.getByRole("region", { name: /Latest writing/ })

    expect(
      within(writing).getByRole("link", { name: "Modular monoliths & AI" })
    ).toHaveAttribute("href", "/articles/post-1")
  })

  it("leaves the writing section out when the blog is unavailable", async () => {
    latestPosts.value = []
    render(await HomePage())

    expect(
      screen.queryByRole("region", { name: /Latest writing/ })
    ).not.toBeInTheDocument()
  })

  it("points to what's new and states facts from the site config in the hero", async () => {
    const { container } = render(await HomePage())

    expect(
      screen.getByRole("link", { name: /New.*Sidecar for OpenCode/ })
    ).toHaveAttribute("href", "/work/opencode-sidecar")
    expect(container.textContent).toContain(
      "Founded 2020 · Run by its founders · South Florida"
    )
  })

  it("summarizes the process and links to the full version with examples", async () => {
    render(await HomePage())
    const process = screen.getByRole("region", {
      name: /A disciplined process/,
    })

    expect(within(process).queryByRole("img")).not.toBeInTheDocument()
    expect(
      within(process).getByRole("link", { name: /See each step/ })
    ).toHaveAttribute("href", "/services#process")
  })

  it("shows every service in a bento grid, each with a capture of real work", async () => {
    render(await HomePage())
    const grid = within(
      screen.getByRole("list", { name: "Services" })
    ).getAllByRole("listitem")

    expect(grid).toHaveLength(services.length)
    services.forEach((service, index) => {
      const cell = within(grid[index] ?? document.body)
      expect(cell.getByRole("link", { name: service.title })).toHaveAttribute(
        "href",
        `/services#${service.slug}`
      )
      expect(cell.getByText(service.summary)).toBeVisible()
      expect(
        cell.getByRole("img", { name: service.capture.alt })
      ).toBeInTheDocument()
    })
  })

  it("gives every case study a card with real figures from it", async () => {
    render(await HomePage())
    const work = screen.getByRole("region", { name: /Proof, not promises/ })

    for (const study of caseStudies) {
      expect(
        within(work).getByRole("link", {
          name: new RegExp(`Read the ${study.name} case study`, "i"),
        })
      ).toHaveAttribute("href", `/work/${study.slug}`)
      expect(within(work).getByText(study.facts[0]?.label ?? "")).toBeVisible()
    }
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
