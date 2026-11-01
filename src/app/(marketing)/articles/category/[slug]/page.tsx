import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArticleListing } from "@/features/articles/components/article-listing"
import { getTopics, parsePage } from "@/features/articles/topics"

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
  return {
    title: `${name} articles`,
    description:
      category.description ||
      `Articles on ${name.toLowerCase()} from Cadogy: practical lessons from designing, building and running production software.`,
    alternates: { canonical: `/articles/category/${slug}` },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, { page: rawPage }] = await Promise.all([
    params,
    searchParams,
  ])
  const category = await findCategory(slug)
  if (!category) notFound()

  const page = parsePage(rawPage)
  const [{ posts, totalPages }, topics] = await Promise.all([
    getPosts({ page, perPage: 12, categoryId: category.id }),
    getTopics(),
  ])

  return (
    <ArticleListing
      label="Topic"
      title={decodeHtml(category.name)}
      lead={category.description || undefined}
      posts={posts}
      page={page}
      totalPages={totalPages}
      basePath={`/articles/category/${slug}`}
      crumbs={[
        { name: "Articles", path: "/articles" },
        { name: decodeHtml(category.name), path: `/articles/category/${slug}` },
      ]}
      topics={topics}
      activeTopic={slug}
    />
  )
}
