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
import { decodeHtml, getCategories, getPosts } from "@/lib/wordpress-api"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

const findCategory = async (slug: string) =>
  (await getCategories()).find((category) => category.slug === slug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await findCategory(slug)
  if (!category) return {}
  const name = decodeHtml(category.name)
  return pageMetadata({
    title: `${name} articles`,
    description:
      category.description ||
      `Articles on ${name.toLowerCase()} from Cadogy: practical lessons from designing, building and running production software.`,
    path: `/articles/category/${slug}`,
  })
}

async function Results({
  category,
  searchParams,
}: {
  category: WP_Term
  searchParams: Props["searchParams"]
}) {
  const page = parsePage((await searchParams).page)
  const { posts, totalPages } = await getPosts({
    page,
    perPage: 12,
    categoryId: category.id,
  })
  return (
    <ArticleResults
      posts={posts}
      page={page}
      totalPages={totalPages}
      basePath={`/articles/category/${category.slug}`}
      featured={false}
    />
  )
}

export async function generateStaticParams() {
  return (await getCategories())
    .filter((term) => term.count > 0)
    .map((term) => ({ slug: term.slug }))
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await findCategory((await params).slug)
  if (!category) notFound()
  const title = decodeHtml(category.name)
  return (
    <ArticleListing
      label="Topic"
      title={title}
      lead={category.description || undefined}
      crumbs={[
        { name: "Articles", path: "/articles" },
        { name: title, path: `/articles/category/${category.slug}` },
      ]}
      topics={await getTopics()}
      activeTopic={category.slug}
    >
      <Suspense fallback={<ArticleResultsSkeleton featured={false} />}>
        <Results category={category} searchParams={searchParams} />
      </Suspense>
    </ArticleListing>
  )
}
