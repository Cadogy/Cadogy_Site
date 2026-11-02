import Link from "next/link"
import { ArticleCard } from "@/features/marketing/components/article-card"
import { Search } from "lucide-react"

import type { WP_Post, WP_Term } from "@/types/wordpress"
import { breadcrumbSchema, type Crumb } from "@/lib/seo/structured-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { JsonLd } from "@/components/seo/json-ld"

const pageHref = (basePath: string, page: number, search?: string) => {
  const params = new URLSearchParams({
    ...(search ? { search } : {}),
    ...(page > 1 ? { page: String(page) } : {}),
  })
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}

export function ArticleListing({
  label,
  title,
  lead,
  posts,
  page,
  totalPages,
  basePath,
  search,
  topics,
  activeTopic,
  crumbs,
}: {
  label: string
  title: string
  lead?: string
  posts: readonly WP_Post[]
  page: number
  totalPages: number
  basePath: string
  search?: string
  topics: readonly WP_Term[]
  activeTopic?: string
  crumbs: readonly Crumb[]
}) {
  return (
    <div className="container-page pt-16 pb-20 sm:pt-24">
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-meta">{label}</p>
          <h1 className="mt-4 text-h1">{title}</h1>
          {lead ? <p className="mt-5 text-lead">{lead}</p> : null}
        </div>
        <form
          action="/articles"
          method="get"
          role="search"
          className="flex w-full gap-2 lg:max-w-sm"
        >
          <label htmlFor="article-search" className="sr-only">
            Search articles
          </label>
          <Input
            id="article-search"
            name="search"
            type="search"
            placeholder="Search articles"
            defaultValue={search}
          />
          <Button
            type="submit"
            variant="outline"
            size="icon"
            aria-label="Search"
          >
            <Search className="size-4" aria-hidden="true" />
          </Button>
        </form>
      </header>

      {topics.length > 0 ? (
        <nav
          aria-label="Topics"
          className="-mx-1 mt-10 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          <Link
            href="/articles"
            aria-current={!activeTopic && !search ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm",
              !activeTopic && !search
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </Link>
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/articles/category/${topic.slug}`}
              aria-current={activeTopic === topic.slug ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm",
                activeTopic === topic.slug
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {topic.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {posts.length > 0 ? (
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ArticleCard key={post.id} post={post} headingLevel={2} />
          ))}
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState
            action={
              <Button asChild variant="outline">
                <Link href="/articles">View all articles</Link>
              </Button>
            }
          >
            No articles found. Try a different search or browse all articles.
          </EmptyState>
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="Pagination"
          className="mt-14 flex items-center justify-between gap-4 border-t pt-6"
        >
          {page > 1 ? (
            <Button asChild variant="outline">
              <Link href={pageHref(basePath, page - 1, search)} rel="prev">
                Previous
              </Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Button asChild variant="outline">
              <Link href={pageHref(basePath, page + 1, search)} rel="next">
                Next
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  )
}
