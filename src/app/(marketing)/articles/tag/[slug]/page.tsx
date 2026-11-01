import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArticleListing } from "@/features/articles/components/article-listing"
import { getTopics, parsePage } from "@/features/articles/topics"

import { decodeHtml, getPosts, getTags } from "@/lib/wordpress-api"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

const findTag = async (slug: string) =>
  (await getTags()).find((tag) => tag.slug === slug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tag = await findTag(slug)
  if (!tag) return {}
  const name = decodeHtml(tag.name)
  return {
    title: `Articles tagged ${name}`,
    description: `Articles about ${name} from Cadogy: practical lessons from designing, building and running production software.`,
    alternates: { canonical: `/articles/tag/${slug}` },
  }
}

export default async function TagPage({ params, searchParams }: Props) {
  const [{ slug }, { page: rawPage }] = await Promise.all([
    params,
    searchParams,
  ])
  const tag = await findTag(slug)
  if (!tag) notFound()

  const page = parsePage(rawPage)
  const [{ posts, totalPages }, topics] = await Promise.all([
    getPosts({ page, perPage: 12, tagId: tag.id }),
    getTopics(),
  ])

  return (
    <ArticleListing
      label="Tag"
      title={`#${decodeHtml(tag.name)}`}
      posts={posts}
      page={page}
      totalPages={totalPages}
      basePath={`/articles/tag/${slug}`}
      crumbs={[
        { name: "Articles", path: "/articles" },
        { name: `#${decodeHtml(tag.name)}`, path: `/articles/tag/${slug}` },
      ]}
      topics={topics}
    />
  )
}
