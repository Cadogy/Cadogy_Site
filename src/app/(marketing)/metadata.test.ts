// @vitest-environment node
import type { Metadata } from "next"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/wordpress-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/wordpress-api")>()),
  getLatestPosts: async () => [],
  getPosts: async () => ({ posts: [], totalPages: 1, totalPosts: 0 }),
  getCategories: async () => [],
}))

const PAGES = {
  "/": () => import("./page"),
  "/services": () => import("./services/page"),
  "/work": () => import("./work/page"),
  "/who-we-are": () => import("./who-we-are/page"),
  "/contact": () => import("./contact/page"),
  "/articles": () => import("./articles/page"),
  "/policies/privacy-policy": () => import("./policies/privacy-policy/page"),
  "/policies/terms-of-use": () => import("./policies/terms-of-use/page"),
} as const

const load = async (path: keyof typeof PAGES): Promise<Metadata> => {
  const page: { metadata?: Metadata } = await PAGES[path]()
  return page.metadata ?? {}
}

const socialTitle = (metadata: Metadata) =>
  metadata.openGraph && "title" in metadata.openGraph
    ? String(metadata.openGraph.title)
    : undefined

describe("marketing page metadata", () => {
  it.each(Object.keys(PAGES) as (keyof typeof PAGES)[])(
    "%s has its own canonical URL, description and social title",
    async (path) => {
      const metadata = await load(path)

      expect(metadata.alternates?.canonical).toBe(path)
      expect(metadata.description).toBeTruthy()
      expect(socialTitle(metadata)).toMatch(/· Cadogy$|^Cadogy · /)
    }
  )

  it("never shares a social title between pages", async () => {
    const titles = await Promise.all(
      (Object.keys(PAGES) as (keyof typeof PAGES)[]).map(async (path) =>
        socialTitle(await load(path))
      )
    )

    expect(new Set(titles).size).toBe(titles.length)
  })
})
