import type { CompiledArticle } from "./compile"

type Taxonomy = "categories" | "tags"
type Term = { readonly id: number; readonly name: string }

export type WordPressClient = {
  findTerms: (taxonomy: Taxonomy) => Promise<readonly Term[]>
  createTerm: (taxonomy: Taxonomy, name: string) => Promise<Term>
  findPostBySlug: (slug: string) => Promise<{ readonly id: number } | null>
  savePost: (
    id: number | null,
    fields: Record<string, unknown>
  ) => Promise<{ readonly id: number }>
  uploadMedia: (file: {
    filename: string
    alt: string
    data: Uint8Array
  }) => Promise<{ readonly id: number }>
}

export type PostStatus = "draft" | "publish"

const termIds = async (
  client: WordPressClient,
  taxonomy: Taxonomy,
  names: readonly string[]
) => {
  const existing = await client.findTerms(taxonomy)
  return names.reduce<Promise<readonly number[]>>(async (previous, name) => {
    const ids = await previous
    const match = existing.find(
      (term) => term.name.toLowerCase() === name.toLowerCase()
    )
    const id = match ? match.id : (await client.createTerm(taxonomy, name)).id
    return [...ids, id]
  }, Promise.resolve([]))
}

export const publishArticle = async ({
  article,
  cover,
  client,
  status,
}: {
  article: CompiledArticle
  cover: Uint8Array
  client: WordPressClient
  status?: PostStatus
}) => {
  const { meta, html } = article
  const [categories, tags, existing, media] = await Promise.all([
    termIds(client, "categories", [meta.topic]),
    termIds(client, "tags", meta.tags),
    client.findPostBySlug(meta.slug),
    client.uploadMedia({
      filename: `${meta.slug}.webp`,
      alt: meta.title,
      data: cover,
    }),
  ])
  const saved = await client.savePost(existing?.id ?? null, {
    slug: meta.slug,
    title: meta.title,
    content: html,
    excerpt: meta.description,
    ...(status ? { status } : existing ? {} : { status: "draft" }),
    categories,
    tags,
    featured_media: media.id,
  })
  return { id: saved.id, created: existing === null }
}
