import { z } from "zod"

import type { WordPressClient } from "../authoring/publish"

const termSchema = z.object({ id: z.number(), name: z.string() })
const idSchema = z.object({ id: z.number() })

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
}): WordPressClient => {
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
    findPostBySlug: async (slug) =>
      z
        .array(idSchema)
        .parse(
          await request(
            `posts?slug=${encodeURIComponent(slug)}&status=any&context=edit`
          )
        )[0] ?? null,
    savePost: async (id, fields) =>
      idSchema.parse(await sendJson(id ? `posts/${id}` : "posts", fields)),
    uploadMedia: async ({ filename, alt, data }) => {
      const media = idSchema.parse(
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
      return { id: media.id }
    },
  }
}
