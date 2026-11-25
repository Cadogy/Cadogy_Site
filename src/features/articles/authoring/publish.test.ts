// @vitest-environment node
import { describe, expect, it } from "vitest"

import type { CompiledArticle } from "./compile"
import { publishArticle, type WordPressClient } from "./publish"

type Term = { id: number; name: string }
type Post = { id: number; slug: string; fields: Record<string, unknown> }

const fakeWordPress = (
  seed: { categories?: Term[]; tags?: Term[]; posts?: Post[] } = {}
) => {
  const state = {
    categories: [...(seed.categories ?? [])],
    tags: [...(seed.tags ?? [])],
    posts: [...(seed.posts ?? [])],
    media: [] as { id: number; filename: string; alt: string }[],
    nextId: 100,
  }
  const client: WordPressClient = {
    findTerms: async (taxonomy) => state[taxonomy],
    createTerm: async (taxonomy, name) => {
      const term = { id: state.nextId++, name }
      state[taxonomy].push(term)
      return term
    },
    findPostBySlug: async (slug) =>
      state.posts.find((post) => post.slug === slug) ?? null,
    savePost: async (id, fields) => {
      const existing = state.posts.find((post) => post.id === id)
      if (existing) {
        existing.fields = { ...existing.fields, ...fields }
        return existing
      }
      const post = { id: state.nextId++, slug: String(fields.slug), fields }
      state.posts.push(post)
      return post
    },
    uploadMedia: async ({ filename, alt }) => {
      const media = { id: state.nextId++, filename, alt }
      state.media.push(media)
      return media
    },
  }
  return { client, state }
}

const article: CompiledArticle = {
  meta: {
    slug: "stripe-webhooks",
    title: "Stripe webhooks that never double-charge",
    description: "Idempotency, retries and ordering, done properly.",
    topic: "Payments",
    tags: ["Stripe", "Webhooks"],
  },
  html: "<p>Body</p>",
}

const cover = new Uint8Array([1, 2, 3])

describe("publishArticle", () => {
  it("creates a new post with its topic, tags, summary and cover", async () => {
    const { client, state } = fakeWordPress({
      categories: [{ id: 7, name: "payments" }],
    })

    await publishArticle({ article, cover, client, status: "publish" })

    expect(state.posts).toHaveLength(1)
    expect(state.posts[0]?.fields).toMatchObject({
      slug: "stripe-webhooks",
      title: "Stripe webhooks that never double-charge",
      content: "<p>Body</p>",
      excerpt: "Idempotency, retries and ordering, done properly.",
      status: "publish",
      categories: [7],
      tags: state.tags.map((tag) => tag.id),
      featured_media: state.media[0]?.id,
    })
    expect(state.tags.map((tag) => tag.name)).toEqual(["Stripe", "Webhooks"])
    expect(state.media[0]).toMatchObject({
      filename: "stripe-webhooks.webp",
      alt: "Stripe webhooks that never double-charge",
    })
  })

  it("updates the existing post instead of making a duplicate", async () => {
    const { client, state } = fakeWordPress({
      posts: [{ id: 5, slug: "stripe-webhooks", fields: { title: "Old" } }],
    })

    const result = await publishArticle({
      article,
      cover,
      client,
      status: "draft",
    })

    expect(result).toEqual({ id: 5, created: false })
    expect(state.posts).toHaveLength(1)
    expect(state.posts[0]?.fields).toMatchObject({
      title: "Stripe webhooks that never double-charge",
      status: "draft",
    })
  })

  it("reuses topics and tags that already exist", async () => {
    const { client, state } = fakeWordPress({
      categories: [{ id: 3, name: "Payments" }],
      tags: [{ id: 9, name: "stripe" }],
    })

    await publishArticle({ article, cover, client, status: "publish" })

    expect(state.categories).toHaveLength(1)
    expect(state.tags.map((tag) => tag.name)).toEqual(["stripe", "Webhooks"])
  })

  it("leaves a live post live when no status is given", async () => {
    const { client, state } = fakeWordPress({
      posts: [
        { id: 5, slug: "stripe-webhooks", fields: { status: "publish" } },
      ],
    })

    await publishArticle({ article, cover, client })

    expect(state.posts[0]?.fields.status).toBe("publish")
  })

  it("starts a brand new post as a draft when no status is given", async () => {
    const { client, state } = fakeWordPress()

    await publishArticle({ article, cover, client })

    expect(state.posts[0]?.fields.status).toBe("draft")
  })
})
