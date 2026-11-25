import { z } from "zod"

import type { WordPressClient } from "../authoring/publish"

const termSchema = z.object({ id: z.number(), name: z.string() })
const idSchema = z.object({ id: z.number() })
const countedTermSchema = termSchema.extend({ count: z.number() })
const postSchema = z.object({ id: z.number(), featured_media: z.number() })
const mediaSchema = z.object({ id: z.number(), source_url: z.string() })
const postContentSchema = z.object({
  featured_media: z.number(),
  content: z.object({ raw: z.string() }),
})

type Taxonomy = "categories" | "tags"

export type TidyClient = {
  listTerms: (
    taxonomy: Taxonomy
  ) => Promise<readonly z.infer<typeof countedTermSchema>[]>
  listMedia: () => Promise<readonly { id: number; url: string }[]>
  listPosts: () => Promise<
    readonly { featuredMedia: number; content: string }[]
  >
  siteSettings: () => Promise<{
    defaultCategoryId: number
    siteMedia: readonly number[]
  }>
  deleteTerm: (taxonomy: Taxonomy, id: number) => Promise<void>
}

type Fetch = typeof fetch

export const createWordPressClient = ({
  apiUrl,
  username,
  password,
  fetch: fetcher = fetch,
}: {
  apiUrl: string
  username: string
  password: string
  fetch?: (url: string, init?: RequestInit) => ReturnType<Fetch>
}): WordPressClient & TidyClient => {
  const authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`

  const request = async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers)
    headers.set("authorization", authorization)
    const response = await fetcher(`${apiUrl}/${path}`, { ...init, headers })
    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const message = z.object({ message: z.string() }).safeParse(body)
      throw new Error(
        `WordPress ${response.status} on ${path}: ${message.success ? message.data.message : "no details"}`
      )
    }
    return body
  }

  const sendJson = (path: string, body: unknown) =>
    request(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })

  return {
    findTerms: async (taxonomy) =>
      z.array(termSchema).parse(await request(`${taxonomy}?per_page=100`)),
    createTerm: async (taxonomy, name) =>
      termSchema.parse(await sendJson(taxonomy, { name })),
    findPostBySlug: async (slug) => {
      const [post] = z
        .array(postSchema)
        .parse(
          await request(
            `posts?slug=${encodeURIComponent(slug)}&status=any&context=edit`
          )
        )
      return post ? { id: post.id, featuredMedia: post.featured_media } : null
    },
    savePost: async (id, fields) =>
      idSchema.parse(await sendJson(id ? `posts/${id}` : "posts", fields)),
    uploadMedia: async ({ filename, alt, data }) => {
      const media = mediaSchema.parse(
        await request("media", {
          method: "POST",
          headers: {
            "content-type": "image/webp",
            "content-disposition": `attachment; filename="${filename}"`,
          },
          body: new Uint8Array(data),
        })
      )
      await sendJson(`media/${media.id}`, { alt_text: alt })
      return { id: media.id, url: media.source_url }
    },
    deleteMedia: async (id) => {
      await request(`media/${id}?force=true`, { method: "DELETE" })
    },
    deleteTerm: async (taxonomy, id) => {
      await request(`${taxonomy}/${id}?force=true`, { method: "DELETE" })
    },
    listTerms: async (taxonomy) =>
      z
        .array(countedTermSchema)
        .parse(await request(`${taxonomy}?per_page=100`)),
    listMedia: async () =>
      z
        .array(mediaSchema)
        .parse(await request("media?per_page=100"))
        .map((item) => ({ id: item.id, url: item.source_url })),
    listPosts: async () =>
      z
        .array(postContentSchema)
        .parse(await request("posts?per_page=100&status=any&context=edit"))
        .map((post) => ({
          featuredMedia: post.featured_media,
          content: post.content.raw,
        })),
    siteSettings: async () => {
      const settings = z
        .object({
          default_category: z.number(),
          site_icon: z.number().optional(),
          site_logo: z.number().nullable().optional(),
        })
        .parse(await request("settings"))
      return {
        defaultCategoryId: settings.default_category,
        siteMedia: [settings.site_icon, settings.site_logo].filter(
          (id): id is number => typeof id === "number" && id > 0
        ),
      }
    },
  }
}
