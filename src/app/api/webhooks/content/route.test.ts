// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"

const revalidateTag = vi.hoisted(() => vi.fn())

vi.mock("next/cache", () => ({ revalidateTag }))
vi.mock("@/env", () => ({
  env: { CONTENT_REVALIDATE_SECRET: "s".repeat(32) },
}))

const { POST } = await import("./route")

const SECRET = `Bearer ${"s".repeat(32)}`

const request = ({
  authorization,
  body,
}: {
  authorization?: string
  body?: string
}) =>
  new Request("https://cadogy.com/api/webhooks/content", {
    method: "POST",
    headers: {
      ...(authorization ? { authorization } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body,
  })

const expired = () => revalidateTag.mock.calls.map(([tag]) => tag)

describe("content webhook", () => {
  beforeEach(() => revalidateTag.mockClear())

  it("expires the published articles and every list they appear in", async () => {
    const response = await POST(
      request({
        authorization: SECRET,
        body: JSON.stringify({ slugs: ["stripe-webhooks"] }),
      })
    )

    expect(response.status).toBe(200)
    expect(expired()).toEqual([
      "wp:posts",
      "wp:terms",
      "wp:post:stripe-webhooks",
    ])
  })

  it("expires right away so the next visitor sees the new version", async () => {
    await POST(
      request({ authorization: SECRET, body: JSON.stringify({ slugs: ["a"] }) })
    )

    expect(revalidateTag).toHaveBeenCalledWith("wp:post:a", { expire: 0 })
  })

  it("expires all WordPress content when the caller names no articles", async () => {
    await POST(request({ authorization: SECRET }))

    expect(expired()).toEqual(["wp"])
  })

  it("rejects a body it doesn't understand", async () => {
    const response = await POST(
      request({
        authorization: SECRET,
        body: JSON.stringify({ slugs: ["../etc"] }),
      })
    )

    expect(response.status).toBe(400)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it("rejects callers without the secret", async () => {
    expect((await POST(request({}))).status).toBe(401)
    expect(
      (await POST(request({ authorization: "Bearer wrong" }))).status
    ).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
