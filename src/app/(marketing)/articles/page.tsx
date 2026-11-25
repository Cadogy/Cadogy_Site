import { Suspense } from "react"
import type { Metadata } from "next"
import {
  ArticleListing,
  ArticleResults,
  ArticleResultsSkeleton,
} from "@/features/articles/components/article-listing"
import { getTopics, parsePage } from "@/features/articles/topics"

import { pageMetadata } from "@/lib/seo/page-metadata"
import { getPosts } from "@/lib/wordpress-api"

export const metadata: Metadata = pageMetadata({
  title: "Articles",
  description:
    "Practical writing on software engineering, payments, infrastructure and security from the Cadogy team.",
  path: "/articles",
})

type Props = { searchParams: Promise<{ page?: string; search?: string }> }

async function Results({ searchParams }: Props) {
  const { page: rawPage, search } = await searchParams
  const page = parsePage(rawPage)
  const query = search?.slice(0, 100) ?? ""
  const { posts, totalPages } = await getPosts({
    page,
    perPage: 12,
    search: query,
  })
  return (
    <ArticleResults
      posts={posts}
      page={page}
      totalPages={totalPages}
      basePath="/articles"
      search={query || undefined}
      featured={page === 1 && !query}
    />
  )
}

export default async function ArticlesPage({ searchParams }: Props) {
  return (
    <ArticleListing
      label="Articles"
      title="Notes from the studio"
      lead="What we learn building and running production software, written down so you don't have to learn it the hard way."
      crumbs={[{ name: "Articles", path: "/articles" }]}
      topics={await getTopics()}
    >
      <Suspense fallback={<ArticleResultsSkeleton featured />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </ArticleListing>
  )
}
