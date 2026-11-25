import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { WP_Post, WP_Term } from "@/types/wordpress"

import {
  ArticleListing,
  ArticleResults,
  ArticleResultsSkeleton,
} from "./article-listing"

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}))

const term = (overrides: Partial<WP_Term> = {}): WP_Term => ({
  id: 3,
  count: 2,
  description: "",
  link: "",
  name: "Technology",
  slug: "technology",
  taxonomy: "category",
  parent: 0,
  ...overrides,
})

const post = (overrides: Partial<WP_Post> = {}): WP_Post => ({
  id: 1,
  date: "2026-01-29T12:00:00",
  date_gmt: "2026-01-29T12:00:00",
  guid: { rendered: "" },
  modified: "2026-01-29T12:00:00",
  modified_gmt: "2026-01-29T12:00:00",
  slug: "modular-monoliths",
  status: "publish",
  type: "post",
  link: "",
  title: { rendered: "Why modular monoliths are winning" },
  content: { rendered: "<p>word </p>".repeat(700), protected: false },
  excerpt: {
    rendered: "<p>Microservices promised scale.</p>",
    protected: false,
  },
  author: 1,
  featured_media: 0,
  comment_status: "closed",
  ping_status: "closed",
  sticky: false,
  template: "",
  format: "standard",
  meta: {},
  categories: [3],
  tags: [],
  _embedded: {
    author: [
      {
        id: 1,
        name: "Charles Knapp",
        url: "",
        description: "",
        link: "",
        slug: "charles",
        avatar_urls: {},
      },
    ],
    "wp:term": [[term()]],
  },
  ...overrides,
})

const posts = [
  post(),
  post({
    id: 2,
    slug: "cloudflare",
    title: { rendered: "How to use Cloudflare" },
  }),
  post({
    id: 3,
    slug: "piracy",
    title: { rendered: "Can piracy be stopped?" },
  }),
]

type ResultsProps = Parameters<typeof ArticleResults>[0]

const listing = ({
  activeTopic,
  ...results
}: Partial<ResultsProps> & { activeTopic?: string } = {}) =>
  render(
    <ArticleListing
      label="Articles"
      title="Notes from the studio"
      topics={[term(), term({ id: 4, name: "Culture", slug: "culture" })]}
      crumbs={[{ name: "Articles", path: "/articles" }]}
      activeTopic={activeTopic}
    >
      <ArticleResults
        posts={posts}
        page={1}
        totalPages={1}
        basePath="/articles"
        featured={!activeTopic}
        {...results}
      />
    </ArticleListing>
  )

describe("ArticleListing", () => {
  it("features the newest article with its author and reading time", () => {
    listing()

    const featured = within(
      screen.getByRole("region", { name: "Latest article" })
    )
    expect(
      featured.getByRole("link", { name: "Why modular monoliths are winning" })
    ).toHaveAttribute("href", "/articles/modular-monoliths")
    expect(featured.getByText("Charles Knapp")).toBeInTheDocument()
    expect(featured.getByText(/3 min read/)).toBeInTheDocument()
    expect(
      screen.getAllByRole("link", { name: "Why modular monoliths are winning" })
    ).toHaveLength(1)
  })

  it("lists the other articles with their topic and date", () => {
    listing()

    const card = within(
      screen.getByRole("article", { name: "How to use Cloudflare" })
    )
    expect(card.getByText("Technology")).toBeInTheDocument()
    expect(card.getByText("January 29, 2026")).toBeInTheDocument()
  })

  it("shows every article as a card once you're past the first page", () => {
    listing({ page: 2, totalPages: 2, featured: false })

    expect(
      screen.queryByRole("region", { name: "Latest article" })
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole("article")).toHaveLength(3)
  })

  it("marks the topic you're reading", () => {
    listing({ activeTopic: "culture" })

    const topics = within(screen.getByRole("navigation", { name: "Topics" }))
    expect(topics.getByRole("link", { name: "Culture" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(
      topics.getByRole("link", { name: "All articles" })
    ).not.toHaveAttribute("aria-current")
  })

  it("numbers the pages and links to the next one", () => {
    listing({ page: 2, totalPages: 3, search: "stripe", featured: false })

    const pages = within(screen.getByRole("navigation", { name: "Pagination" }))
    expect(pages.getByRole("link", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(pages.getByRole("link", { name: "Page 1" })).toHaveAttribute(
      "href",
      "/articles?search=stripe"
    )
    expect(pages.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/articles?search=stripe&page=3"
    )
  })

  it("says what you searched for above the results", () => {
    listing({ search: "stripe", featured: false })

    expect(
      screen.getByRole("heading", { name: "Results for “stripe”" })
    ).toBeInTheDocument()
  })

  it("keeps the title, search and topics on screen while results load", () => {
    render(
      <ArticleListing
        label="Articles"
        title="Notes from the studio"
        topics={[term()]}
        crumbs={[{ name: "Articles", path: "/articles" }]}
      >
        <ArticleResultsSkeleton featured />
      </ArticleListing>
    )

    expect(
      screen.getByRole("heading", { level: 1, name: "Notes from the studio" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("searchbox", { name: "Search articles" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("navigation", { name: "Topics" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("status", { name: "Loading articles" })
    ).toBeInTheDocument()
  })
})
