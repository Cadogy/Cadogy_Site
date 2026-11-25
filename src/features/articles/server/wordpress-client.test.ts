// @vitest-environment node
import { describe, expect, it } from "vitest"

import { createWordPressClient } from "./wordpress-client"

type Call = { url: string; init: RequestInit }

const recordingFetch = (respond: (call: Call) => unknown) => {
  const calls: Call[] = []
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    const call = { url: String(url), init: init ?? {} }
    calls.push(call)
    return new Response(JSON.stringify(respond(call)), { status: 200 })
  }
  return { calls, fetcher }
}

const settings = {
  apiUrl: "https://wp.example.com/wp-json/wp/v2",
  username: "editor",
  password: "abcd efgh",
}

describe("createWordPressClient", () => {
  it("signs every request with the application password", async () => {
    const { calls, fetcher } = recordingFetch(() => [])
    const client = createWordPressClient({ ...settings, fetch: fetcher })

    await client.findTerms("tags")

    expect(new Headers(calls[0]?.init.headers).get("authorization")).toBe(
      `Basic ${Buffer.from("editor:abcd efgh").toString("base64")}`
    )
    expect(calls[0]?.url).toBe(
      "https://wp.example.com/wp-json/wp/v2/tags?per_page=100"
    )
  })

  it("looks up drafts too when finding a post by slug", async () => {
    const { calls, fetcher } = recordingFetch(() => [
      { id: 4, featured_media: 76 },
    ])
    const client = createWordPressClient({ ...settings, fetch: fetcher })

    expect(await client.findPostBySlug("x")).toEqual({
      id: 4,
      featuredMedia: 76,
    })
    expect(calls[0]?.url).toContain("slug=x")
    expect(calls[0]?.url).toContain("status=any")
  })

  it("finds an author by their WordPress user slug", async () => {
    const { calls, fetcher } = recordingFetch(({ url }) =>
      url.includes("slug=charles") ? [{ id: 2, name: "Charles Knapp" }] : []
    )
    const client = createWordPressClient({ ...settings, fetch: fetcher })

    expect(await client.findUserBySlug("charles")).toEqual({ id: 2 })
    expect(await client.findUserBySlug("nobody")).toBeNull()
    expect(calls[0]?.url).toBe(
      "https://wp.example.com/wp-json/wp/v2/users?slug=charles&context=edit"
    )
  })

  it("updates an existing post in place", async () => {
    const { calls, fetcher } = recordingFetch(() => ({ id: 4 }))
    const client = createWordPressClient({ ...settings, fetch: fetcher })

    await client.savePost(4, { title: "New" })

    expect(calls[0]?.url).toBe("https://wp.example.com/wp-json/wp/v2/posts/4")
    expect(calls[0]?.init.method).toBe("POST")
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ title: "New" })
  })

  it("uploads an image, gives it alt text and returns its address", async () => {
    const { calls, fetcher } = recordingFetch(() => ({
      id: 12,
      source_url: "https://wp.example.com/uploads/x.webp",
    }))
    const client = createWordPressClient({ ...settings, fetch: fetcher })

    const media = await client.uploadMedia({
      filename: "x.webp",
      alt: "A cover",
      data: new Uint8Array([1]),
    })

    expect(media).toEqual({
      id: 12,
      url: "https://wp.example.com/uploads/x.webp",
    })
    expect(new Headers(calls[0]?.init.headers).get("content-disposition")).toBe(
      'attachment; filename="x.webp"'
    )
    expect(calls[1]?.url).toBe("https://wp.example.com/wp-json/wp/v2/media/12")
    expect(JSON.parse(String(calls[1]?.init.body))).toEqual({
      alt_text: "A cover",
    })
  })

  it("reports what WordPress rejected", async () => {
    const client = createWordPressClient({
      ...settings,
      fetch: async () =>
        new Response(JSON.stringify({ message: "Sorry, not allowed." }), {
          status: 403,
        }),
    })

    await expect(client.findTerms("tags")).rejects.toThrow(
      /403.*Sorry, not allowed/
    )
  })

  it("deletes media permanently rather than to the trash", async () => {
    const { calls, fetcher } = recordingFetch(() => ({ deleted: true }))
    const client = createWordPressClient({ ...settings, fetch: fetcher })

    await client.deleteMedia(76)

    expect(calls[0]?.url).toBe(
      "https://wp.example.com/wp-json/wp/v2/media/76?force=true"
    )
    expect(calls[0]?.init.method).toBe("DELETE")
  })

  it("lists what the tidy-up needs to see", async () => {
    const { fetcher } = recordingFetch(({ url }) => {
      if (url.includes("/settings"))
        return { default_category: 1, site_icon: 13, site_logo: 0 }
      if (url.includes("/media"))
        return [{ id: 76, source_url: "https://x/a.webp" }]
      if (url.includes("/posts"))
        return [{ featured_media: 90, content: { raw: "<p>Hi</p>" } }]
      return [{ id: 3, name: "Technology", count: 0 }]
    })
    const client = createWordPressClient({ ...settings, fetch: fetcher })

    expect(await client.listTerms("categories")).toEqual([
      { id: 3, name: "Technology", count: 0 },
    ])
    expect(await client.listMedia()).toEqual([
      { id: 76, url: "https://x/a.webp" },
    ])
    expect(await client.listPosts()).toEqual([
      { featuredMedia: 90, content: "<p>Hi</p>" },
    ])
    expect(await client.siteSettings()).toEqual({
      defaultCategoryId: 1,
      siteMedia: [13],
    })
  })
})
