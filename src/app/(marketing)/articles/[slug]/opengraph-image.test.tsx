// @vitest-environment node
import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/wordpress-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/wordpress-api")>()),
  getPostBySlug: async (slug: string) =>
    slug === "stripe-webhooks"
      ? {
          slug,
          title: { rendered: "Stripe webhooks &amp; idempotency" },
          _embedded: { "wp:term": [[{ slug: "payments", name: "Payments" }]] },
        }
      : null,
}))

const { default: ShareImage, size } = await import("./opengraph-image")

describe("article share image", () => {
  it("renders a share card for the article", async () => {
    const response = await ShareImage({
      params: Promise.resolve({ slug: "stripe-webhooks" }),
    })

    expect(response.headers.get("content-type")).toBe("image/png")
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(10_000)
    expect(size).toEqual({ width: 1200, height: 630 })
  })

  it("still renders a branded card when the article is missing", async () => {
    const response = await ShareImage({
      params: Promise.resolve({ slug: "gone" }),
    })

    expect(response.headers.get("content-type")).toBe("image/png")
  })
})
