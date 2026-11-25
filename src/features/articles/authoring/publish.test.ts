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
    deletedMedia: [] as number[],
    nextId: 100,
  }
  const users = [{ id: 2, slug: "charles" }]
  const client: WordPressClient = {
    findUserBySlug: async (slug) =>
      users.find((user) => user.slug === slug) ?? null,
    findTerms: async (taxonomy) => state[taxonomy],
    createTerm: async (taxonomy, name) => {
      const term = { id: state.nextId++, name }
      state[taxonomy].push(term)
      return term
    },
    findPostBySlug: async (slug) => {
      const post = state.posts.find((candidate) => candidate.slug === slug)
      return post
        ? {
            id: post.id,
            featuredMedia: Number(post.fields.featured_media ?? 0),
          }
        : null
    },
    deleteMedia: async (id) => {
      state.deletedMedia.push(id)
    },
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
      return { id: media.id, url: `https://wp.example.com/uploads/${filename}` }
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
    author: "charles",
    tags: ["Stripe", "Webhooks"],
    cover: {
      image: "media/stripe/cover.jpg",
      alt: "A payment terminal",
      marks: [],
    },
  },
  html: '<p>Body</p><figure><img src="media:media/stripe/flow.png" alt="Flow"></figure>',
  media: [
    { path: "media/stripe/cover.jpg", alt: "A payment terminal" },
    { path: "media/stripe/flow.png", alt: "Flow" },
  ],
}

const files = {
  "media/stripe/cover.jpg": new Uint8Array([1]),
  "media/stripe/flow.png": new Uint8Array([2]),
}

describe("publishArticle", () => {
  it("creates a new post with its topic, tags, summary and cover", async () => {
    const { client, state } = fakeWordPress({
      categories: [{ id: 7, name: "payments" }],
    })

    await publishArticle({ article, files, client, status: "publish" })

    expect(state.posts).toHaveLength(1)
    expect(state.posts[0]?.fields).toMatchObject({
      slug: "stripe-webhooks",
      title: "Stripe webhooks that never double-charge",
      content: `<p>Body</p><figure><img src="https://wp.example.com/uploads/${state.media[1]?.filename}" alt="Flow"></figure>`,
      excerpt: "Idempotency, retries and ordering, done properly.",
      status: "publish",
      categories: [7],
      tags: state.tags.map((tag) => tag.id),
      featured_media: state.media[0]?.id,
      author: 2,
    })
    expect(state.tags.map((tag) => tag.name)).toEqual(["Stripe", "Webhooks"])
    expect(state.media).toEqual([
      expect.objectContaining({
        filename: expect.stringMatching(
          /^stripe-webhooks-cover-[0-9a-f]{8}\.webp$/
        ),
        alt: "A payment terminal",
      }),
      expect.objectContaining({
        filename: expect.stringMatching(
          /^stripe-webhooks-flow-[0-9a-f]{8}\.webp$/
        ),
        alt: "Flow",
      }),
    ])
  })

  it("updates the existing post instead of making a duplicate", async () => {
    const { client, state } = fakeWordPress({
      posts: [{ id: 5, slug: "stripe-webhooks", fields: { title: "Old" } }],
    })

    const result = await publishArticle({
      article,
      files,
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

    await publishArticle({ article, files, client, status: "publish" })

    expect(state.categories).toHaveLength(1)
    expect(state.tags.map((tag) => tag.name)).toEqual(["stripe", "Webhooks"])
  })

  it("leaves a live post live when no status is given", async () => {
    const { client, state } = fakeWordPress({
      posts: [
        { id: 5, slug: "stripe-webhooks", fields: { status: "publish" } },
      ],
    })

    await publishArticle({ article, files, client })

    expect(state.posts[0]?.fields.status).toBe("publish")
  })

  it("starts a brand new post as a draft when no status is given", async () => {
    const { client, state } = fakeWordPress()

    await publishArticle({ article, files, client })

    expect(state.posts[0]?.fields.status).toBe("draft")
  })

  it("deletes the cover it replaces so old images don't pile up", async () => {
    const { client, state } = fakeWordPress({
      posts: [
        { id: 5, slug: "stripe-webhooks", fields: { featured_media: 40 } },
      ],
    })

    await publishArticle({ article, files, client })

    expect(state.deletedMedia).toEqual([40])
    expect(state.posts[0]?.fields.featured_media).not.toBe(40)
  })

  it("deletes nothing when the post had no cover", async () => {
    const { client, state } = fakeWordPress()

    await publishArticle({ article, files, client })

    expect(state.deletedMedia).toEqual([])
  })

  it("refuses to publish under an author WordPress doesn't know", async () => {
    const { client, state } = fakeWordPress()

    await expect(
      publishArticle({
        article: { ...article, meta: { ...article.meta, author: "nobody" } },
        files,
        client,
      })
    ).rejects.toThrow("stripe-webhooks: no WordPress user with slug nobody")
    expect(state.posts).toEqual([])
    expect(state.media).toEqual([])
  })

  it("gives a changed image a new address so caches never serve the old one", async () => {
    const first = fakeWordPress()
    const second = fakeWordPress()
    const third = fakeWordPress()

    await publishArticle({ article, files, client: first.client })
    await publishArticle({ article, files, client: second.client })
    await publishArticle({
      article,
      files: { ...files, "media/stripe/cover.jpg": new Uint8Array([9]) },
      client: third.client,
    })

    const coverName = (state: typeof first.state) => state.media[0]?.filename
    expect(coverName(second.state)).toBe(coverName(first.state))
    expect(coverName(third.state)).not.toBe(coverName(first.state))
  })
})
