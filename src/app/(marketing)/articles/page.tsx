import type { Metadata } from "next"
import { ArticleListing } from "@/features/articles/components/article-listing"
import { getTopics, parsePage } from "@/features/articles/topics"

import { getPosts } from "@/lib/wordpress-api"

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Practical writing on software engineering, payments, infrastructure and security from the Cadogy team.",
  alternates: { canonical: "/articles" },
}

type Props = { searchParams: Promise<{ page?: string; search?: string }> }

export default async function ArticlesPage({ searchParams }: Props) {
  const { page: rawPage, search } = await searchParams
  const page = parsePage(rawPage)
  const [{ posts, totalPages }, topics] = await Promise.all([
    getPosts({ page, perPage: 12, search: search?.slice(0, 100) ?? "" }),
    getTopics(),
  ])

  return (
    <ArticleListing
      label="Articles"
      title={search ? `Results for “${search}”` : "Notes from the studio"}
      lead={
        search
          ? undefined
          : "What we learn building and running production software, written down so you don't have to learn it the hard way."
      }
      posts={posts}
      page={page}
      totalPages={totalPages}
      basePath="/articles"
      crumbs={[{ name: "Articles", path: "/articles" }]}
      search={search}
      topics={topics}
    />
  )
}
