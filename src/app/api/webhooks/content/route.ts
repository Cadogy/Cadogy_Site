import { revalidatePath, revalidateTag } from "next/cache"

import { env } from "@/env"
import { hasBearerSecret } from "@/lib/security/bearer-secret"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  if (
    !hasBearerSecret(
      request.headers.get("authorization"),
      env.CONTENT_REVALIDATE_SECRET
    )
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  revalidateTag("wordpress", { expire: 0 })
  revalidatePath("/", "layout")
  return Response.json(
    { revalidated: true },
    { headers: { "Cache-Control": "no-store" } }
  )
}
