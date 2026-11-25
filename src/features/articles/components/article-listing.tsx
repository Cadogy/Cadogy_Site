import Link from "next/link"
import { ArticleCard } from "@/features/marketing/components/article-card"
import { CornerDownLeft, Search } from "lucide-react"

import type { WP_Post, WP_Term } from "@/types/wordpress"
import { breadcrumbSchema, type Crumb } from "@/lib/seo/structured-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { JsonLd } from "@/components/seo/json-ld"

import { FeaturedArticle } from "./featured-article"
import { Pagination } from "./pagination"

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
  const showFeatured = page === 1 && !search && !activeTopic
  const featured = showFeatured ? posts[0] : undefined
  const rest = featured ? posts.slice(1) : posts
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
          className="relative w-full lg:max-w-sm"
        >
          <label htmlFor="article-search" className="sr-only">
            Search articles
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="article-search"
            name="search"
            type="search"
            placeholder="Search articles"
            defaultValue={search}
            className="bg-card pr-12 pl-10 [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-chip border bg-background text-muted-foreground transition-colors hover:text-foreground"
          >
            <CornerDownLeft className="size-3.5" aria-hidden="true" />
          </button>
        </form>
      </header>

      {topics.length > 0 ? (
        <nav
          aria-label="Topics"
          className="-mx-1 mt-12 flex gap-6 overflow-x-auto px-1"
        >
          <TopicLink href="/articles" current={!activeTopic && !search}>
            All articles
          </TopicLink>
          {topics.map((topic) => (
            <TopicLink
              key={topic.id}
              href={`/articles/category/${topic.slug}`}
              current={activeTopic === topic.slug}
            >
              {topic.name}
            </TopicLink>
          ))}
        </nav>
      ) : null}

      <div className={cn("border-t pt-10", topics.length === 0 && "mt-12")}>
        {featured ? <FeaturedArticle post={featured} /> : null}

        {rest.length > 0 ? (
          <div
            className={cn(
              "grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3",
              featured && "mt-16"
            )}
          >
            {rest.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        ) : null}

        {posts.length === 0 ? (
          <EmptyState
            action={
              <Button asChild variant="outline">
                <Link href="/articles">View all articles</Link>
              </Button>
            }
          >
            No articles found. Try a different search or browse all articles.
          </EmptyState>
        ) : null}
      </div>

      {totalPages > 1 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          hrefFor={(target) => pageHref(basePath, target, search)}
        />
      ) : null}
    </div>
  )
}

function TopicLink({
  href,
  current,
  children,
}: {
  href: string
  current: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "relative inline-flex min-h-11 shrink-0 items-center text-sm whitespace-nowrap transition-colors",
        current
          ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-brand"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  )
}
