import type { CompiledArticle } from "./compile"

type Taxonomy = "categories" | "tags"
type Term = { readonly id: number; readonly name: string }

export type WordPressClient = {
  findTerms: (taxonomy: Taxonomy) => Promise<readonly Term[]>
  createTerm: (taxonomy: Taxonomy, name: string) => Promise<Term>
  findPostBySlug: (
    slug: string
  ) => Promise<{ readonly id: number; readonly featuredMedia: number } | null>
  savePost: (
    id: number | null,
    fields: Record<string, unknown>
  ) => Promise<{ readonly id: number }>
  uploadMedia: (file: {
    filename: string
    alt: string
    data: Uint8Array
  }) => Promise<{ readonly id: number; readonly url: string }>
  deleteMedia: (id: number) => Promise<void>
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

const baseName = (path: string) =>
  (path.split("/").pop() ?? path).replace(/.[^.]+$/, "")

const uploadAll = async ({
  article,
  files,
  client,
}: {
  article: CompiledArticle
  files: Readonly<Record<string, Uint8Array>>
  client: WordPressClient
}) =>
  Promise.all(
    article.media.map(async ({ path, alt }) => {
      const data = files[path]
      if (!data) throw new Error(`Missing image file: ${path}`)
      const uploaded = await client.uploadMedia({
        filename: `${article.meta.slug}-${baseName(path)}.webp`,
        alt,
        data,
      })
      return { path, ...uploaded }
    })
  )

export const publishArticle = async ({
  article,
  files,
  client,
  status,
}: {
  article: CompiledArticle
  files: Readonly<Record<string, Uint8Array>>
  client: WordPressClient
  status?: PostStatus
}) => {
  const { meta } = article
  const [categories, tags, existing, uploads] = await Promise.all([
    termIds(client, "categories", [meta.topic]),
    termIds(client, "tags", meta.tags),
    client.findPostBySlug(meta.slug),
    uploadAll({ article, files, client }),
  ])
  const cover = uploads.find((upload) => upload.path === meta.cover.image)
  const content = uploads.reduce(
    (html, upload) => html.split(`media:${upload.path}`).join(upload.url),
    article.html
  )
  const saved = await client.savePost(existing?.id ?? null, {
    slug: meta.slug,
    title: meta.title,
    content,
    excerpt: meta.description,
    ...(status ? { status } : existing ? {} : { status: "draft" }),
    categories,
    tags,
    featured_media: cover?.id ?? 0,
  })
  if (existing && existing.featuredMedia > 0)
    await client.deleteMedia(existing.featuredMedia)
  return { id: saved.id, created: existing === null }
}
