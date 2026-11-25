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
    const { calls, fetcher } = recordingFetch(() => [{ id: 4 }])
    const client = createWordPressClient({ ...settings, fetch: fetcher })

    expect(await client.findPostBySlug("x")).toEqual({ id: 4 })
    expect(calls[0]?.url).toContain("slug=x")
    expect(calls[0]?.url).toContain("status=any")
  })

  it("updates an existing post in place", async () => {
    const { calls, fetcher } = recordingFetch(() => ({ id: 4 }))
    const client = createWordPressClient({ ...settings, fetch: fetcher })

    await client.savePost(4, { title: "New" })

    expect(calls[0]?.url).toBe("https://wp.example.com/wp-json/wp/v2/posts/4")
    expect(calls[0]?.init.method).toBe("POST")
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ title: "New" })
  })

  it("uploads a cover, then gives it alt text", async () => {
    const { calls, fetcher } = recordingFetch(() => ({ id: 12 }))
    const client = createWordPressClient({ ...settings, fetch: fetcher })

    const media = await client.uploadMedia({
      filename: "x.webp",
      alt: "A cover",
      data: new Uint8Array([1]),
    })

    expect(media).toEqual({ id: 12 })
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
})
