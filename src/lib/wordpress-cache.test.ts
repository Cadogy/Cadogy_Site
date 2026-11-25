// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"

const cacheTag = vi.hoisted(() => vi.fn())
const cacheLife = vi.hoisted(() => vi.fn())

vi.mock("next/cache", () => ({ cacheTag, cacheLife }))

const { getCategories, getPostBySlug, getPosts, getTags } =
  await import("./wordpress-api")

const respondWith = (body: unknown) =>
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "X-WP-TotalPages": "1", "X-WP-Total": "0" },
      })
  )

afterEach(() => {
  vi.restoreAllMocks()
  cacheTag.mockClear()
  cacheLife.mockClear()
})

describe("WordPress reads", () => {
  it("tags an article by its slug so publishing it refreshes that page", async () => {
    respondWith([])

    await getPostBySlug("stripe-webhooks")

    expect(cacheTag).toHaveBeenCalledWith("wp", "wp:post:stripe-webhooks")
  })

  it("tags post lists so any publish refreshes listings and the sitemap", async () => {
    respondWith([])

    await getPosts({ page: 2 })

    expect(cacheTag).toHaveBeenCalledWith("wp", "wp:posts")
  })

  it("tags topics and tags together", async () => {
    respondWith([])

    await getCategories()
    await getTags()

    expect(cacheTag).toHaveBeenNthCalledWith(1, "wp", "wp:terms")
    expect(cacheTag).toHaveBeenNthCalledWith(2, "wp", "wp:terms")
  })

  it("keeps every read on the content cache profile", async () => {
    respondWith([])

    await getPostBySlug("a")
    await getPosts()
    await getCategories()

    expect(cacheLife.mock.calls).toEqual([
      ["content"],
      ["content"],
      ["content"],
    ])
  })

  it("treats a page past the last one as empty instead of failing", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ code: "rest_post_invalid_page_number" }),
          { status: 400 }
        )
    )

    expect(await getPosts({ page: 9 })).toEqual({
      posts: [],
      totalPages: 1,
      totalPosts: 0,
    })
  })
})
