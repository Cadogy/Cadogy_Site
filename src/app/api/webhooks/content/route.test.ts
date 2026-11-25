// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"

const revalidateTag = vi.hoisted(() => vi.fn())
const revalidatePath = vi.hoisted(() => vi.fn())

vi.mock("next/cache", () => ({ revalidateTag, revalidatePath }))
vi.mock("@/env", () => ({
  env: { CONTENT_REVALIDATE_SECRET: "s".repeat(32) },
}))

const { POST } = await import("./route")

const request = (authorization?: string) =>
  new Request("https://cadogy.com/api/webhooks/content", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  })

describe("content webhook", () => {
  beforeEach(() => revalidateTag.mockClear())

  it("refreshes everything cached from WordPress", async () => {
    const response = await POST(request(`Bearer ${"s".repeat(32)}`))

    expect(response.status).toBe(200)
    expect(revalidateTag).toHaveBeenCalledWith("wordpress", { expire: 0 })
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout")
  })

  it("rejects callers without the secret", async () => {
    expect((await POST(request())).status).toBe(401)
    expect((await POST(request("Bearer wrong"))).status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
