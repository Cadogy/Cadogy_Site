import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  ArticleListing,
  ArticleResults,
  ArticleResultsSkeleton,
} from "@/features/articles/components/article-listing"
import { getTopics, parsePage } from "@/features/articles/topics"

import type { WP_Term } from "@/types/wordpress"
import { pageMetadata } from "@/lib/seo/page-metadata"
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
    ...pageMetadata({
      title: `Articles tagged ${name}`,
      description: `Articles about ${name} from Cadogy: practical lessons from designing, building and running production software.`,
      path: `/articles/tag/${slug}`,
    }),
    robots: { index: false, follow: true },
  }
}

async function Results({
  tag,
  searchParams,
}: {
  tag: WP_Term
  searchParams: Props["searchParams"]
}) {
  const page = parsePage((await searchParams).page)
  const { posts, totalPages } = await getPosts({
    page,
    perPage: 12,
    tagId: tag.id,
  })
  return (
    <ArticleResults
      posts={posts}
      page={page}
      totalPages={totalPages}
      basePath={`/articles/tag/${tag.slug}`}
      featured={page === 1}
    />
  )
}

export async function generateStaticParams() {
  return (await getTags())
    .filter((term) => term.count > 0)
    .map((term) => ({ slug: term.slug }))
}

export default async function TagPage({ params, searchParams }: Props) {
  const tag = await findTag((await params).slug)
  if (!tag) notFound()
  const title = `#${decodeHtml(tag.name)}`
  return (
    <ArticleListing
      label="Tag"
      title={title}
      crumbs={[
        { name: "Articles", path: "/articles" },
        { name: title, path: `/articles/tag/${tag.slug}` },
      ]}
      topics={await getTopics()}
    >
      <Suspense fallback={<ArticleResultsSkeleton featured />}>
        <Results tag={tag} searchParams={searchParams} />
      </Suspense>
    </ArticleListing>
  )
}
