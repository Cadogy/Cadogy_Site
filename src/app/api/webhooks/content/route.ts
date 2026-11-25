import { revalidateTag } from "next/cache"
import { tagsToExpire } from "@/features/articles/cache-tags"
import { z } from "zod"

import { env } from "@/env"
import { hasBearerSecret } from "@/lib/security/bearer-secret"

const bodySchema = z
  .object({
    slugs: z
      .array(z.string().regex(/^[a-z0-9-]{1,200}$/))
      .max(100)
      .default([]),
  })
  .strict()

const readBody = async (request: Request) => {
  const text = await request.text()
  return bodySchema.safeParse(text.trim() ? JSON.parse(text) : {})
}

const NO_STORE = { headers: { "Cache-Control": "no-store" } }

export async function POST(request: Request) {
  if (
    !hasBearerSecret(
      request.headers.get("authorization"),
      env.CONTENT_REVALIDATE_SECRET
    )
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await readBody(request).catch(() => null)
  if (!body?.success)
    return Response.json(
      { error: "Expected { slugs: string[] }" },
      { status: 400, ...NO_STORE }
    )
  const tags = tagsToExpire(body.data)
  tags.forEach((tag) => revalidateTag(tag, { expire: 0 }))
  return Response.json({ revalidated: tags }, NO_STORE)
}
