import Link from "next/link"
import { ArticleCard } from "@/features/marketing/components/article-card"

import type { WP_Post, WP_Term } from "@/types/wordpress"
import { breadcrumbSchema, type Crumb } from "@/lib/seo/structured-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { JsonLd } from "@/components/seo/json-ld"

import { ArticleSearch } from "./article-search"
import { FeaturedArticle } from "./featured-article"
import { Pagination } from "./pagination"
import { TopicScroller } from "./topic-scroller"

const pageHref = (basePath: string, page: number, search?: string) => {
  const params = new URLSearchParams({
    ...(search ? { search } : {}),
    ...(page > 1 ? { page: String(page) } : {}),
  })
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}

const GRID = "grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"

export function ArticleListing({
  label,
  title,
  lead,
  topics,
  activeTopic,
  crumbs,
  children,
}: {
  label: string
  title: string
  lead?: string
  topics: readonly WP_Term[]
  activeTopic?: string
  crumbs: readonly Crumb[]
  children: React.ReactNode
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
        <ArticleSearch />
      </header>

      {topics.length > 0 ? (
        <TopicScroller
          className="mt-12 mb-6"
          topics={[
            { label: "All articles", href: "/articles", current: !activeTopic },
            ...topics.map((topic) => ({
              label: topic.name,
              href: `/articles/category/${topic.slug}`,
              current: activeTopic === topic.slug,
            })),
          ]}
        />
      ) : null}

      <div className={cn("border-t pt-10", topics.length === 0 && "mt-12")}>
        {children}
      </div>
    </div>
  )
}

export function ArticleResults({
  posts,
  page,
  totalPages,
  basePath,
  search,
  featured: showFeatured,
}: {
  posts: readonly WP_Post[]
  page: number
  totalPages: number
  basePath: string
  search?: string
  featured: boolean
}) {
  const featured = showFeatured ? posts[0] : undefined
  const rest = featured ? posts.slice(1) : posts
  return (
    <>
      {search ? (
        <h2 className="mb-10 text-h3">Results for “{search}”</h2>
      ) : null}

      {featured ? <FeaturedArticle post={featured} /> : null}

      {rest.length > 0 ? (
        <div className={cn(GRID, featured && "mt-16")}>
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

      {totalPages > 1 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          hrefFor={(target) => pageHref(basePath, target, search)}
        />
      ) : null}
    </>
  )
}

const SKELETON_CARDS = 6
const BAR = "rounded-full bg-foreground/6"

function CardSkeleton() {
  return (
    <div>
      <div className="aspect-16/10 rounded-media bg-card" />
      <div className={cn(BAR, "mt-5 h-4 w-1/3")} />
      <div className={cn(BAR, "mt-4 h-6 w-4/5")} />
      <div className={cn(BAR, "mt-3 h-4 w-full")} />
      <div className={cn(BAR, "mt-2 h-4 w-2/3")} />
    </div>
  )
}

export function ArticleResultsSkeleton({ featured }: { featured: boolean }) {
  return (
    <div
      role="status"
      aria-label="Loading articles"
      className="motion-safe:animate-pulse"
    >
      {featured ? (
        <div className="grid rounded-media bg-card lg:grid-cols-12">
          <div className="aspect-16/9 lg:order-last lg:col-span-8 lg:aspect-auto lg:min-h-[26rem]" />
          <div className="flex flex-col gap-8 p-6 md:p-8 lg:col-span-4">
            <div className="flex flex-col gap-4">
              <div className={cn(BAR, "h-4 w-1/2")} />
              <div className={cn(BAR, "h-7 w-full")} />
              <div className={cn(BAR, "h-7 w-3/4")} />
              <div className={cn(BAR, "mt-2 h-4 w-full")} />
              <div className={cn(BAR, "h-4 w-full")} />
              <div className={cn(BAR, "h-4 w-2/3")} />
            </div>
            <div className="mt-auto flex items-center gap-3">
              <div className="size-10 rounded-full bg-foreground/6" />
              <div className={cn(BAR, "h-4 w-32")} />
            </div>
          </div>
        </div>
      ) : null}
      <div className={cn(GRID, featured && "mt-16")}>
        {Array.from({ length: SKELETON_CARDS }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
