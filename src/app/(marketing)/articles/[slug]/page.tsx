import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { sanitizeArticleHtml } from "@/features/articles/sanitize"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { ChevronLeft } from "lucide-react"

import { openGraphFor } from "@/lib/seo/open-graph"
import {
  decodeHtml,
  extractExcerpt,
  featuredImageOf,
  formatDate,
  getAllPosts,
  getPostBySlug,
} from "@/lib/wordpress-api"
import { ArticleSchema } from "@/components/seo/article-schema"
import { OnThisPage } from "@/components/site/on-this-page"

type Props = { params: Promise<{ slug: string }> }

const WORDS_PER_MINUTE = 230

const countWords = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length

const readingMinutes = (html: string) =>
  Math.max(1, Math.round(countWords(html) / WORDS_PER_MINUTE))

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    return (await getAllPosts()).map((post) => ({ slug: post.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug)
  if (!post) return {}
  const title = decodeHtml(post.title.rendered)
  const description = extractExcerpt(post.excerpt.rendered, 160)
  const image = featuredImageOf(post)
  return {
    title,
    description,
    alternates: { canonical: `/articles/${post.slug}` },
    openGraph: {
      ...openGraphFor({
        path: `/articles/${post.slug}`,
        title,
        description,
        image,
      }),
      type: "article",
      publishedTime: `${post.date_gmt}Z`,
      modifiedTime: `${post.modified_gmt}Z`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const post = await getPostBySlug((await params).slug)
  if (!post) notFound()

  const title = decodeHtml(post.title.rendered)
  const description = extractExcerpt(post.excerpt.rendered, 200)
  const author = post._embedded?.author?.[0]?.name ?? "Cadogy"
  const categories = post._embedded?.["wp:term"]?.[0] ?? []
  const tags = post._embedded?.["wp:term"]?.[1] ?? []
  const image = featuredImageOf(post)

  return (
    <>
      <ArticleSchema
        title={title}
        slug={post.slug}
        description={description}
        publishedAt={`${post.date_gmt}Z`}
        modifiedAt={`${post.modified_gmt}Z`}
        image={image}
        authorName={author}
        section={categories[0] ? decodeHtml(categories[0].name) : undefined}
        keywords={tags.map((tag) => decodeHtml(tag.name))}
        wordCount={countWords(post.content.rendered)}
      />
      <article>
        <header className="container-page pt-10 pb-10 sm:pt-14">
          <Link
            href="/articles"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            All articles
          </Link>
          <div className="mt-6 max-w-3xl">
            {categories.length > 0 ? (
              <p className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-chip border bg-card px-2 py-0.5 font-mono text-xs text-brand"
                  >
                    {decodeHtml(category.name)}
                  </span>
                ))}
              </p>
            ) : null}
            <h1 className="mt-5 text-h1">{title}</h1>
            <p className="mt-5 text-lead">{description}</p>
            <p className="mt-6 text-sm text-muted-foreground">
              By {author} ·{" "}
              <time dateTime={`${post.date_gmt}Z`}>
                {formatDate(post.date_gmt)}
              </time>{" "}
              · {readingMinutes(post.content.rendered)} min read
            </p>
          </div>
        </header>

        <div className="container-page">
          <div className="relative isolate aspect-[21/9] transform-gpu overflow-hidden rounded-media border bg-card">
            <Image
              src={image}
              alt=""
              fill
              priority
              sizes="(min-width: 1360px) 1300px, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="container-page grid gap-12 py-12 sm:py-16 lg:grid-cols-12 lg:gap-16">
          <div className="min-w-0 lg:col-span-8">
            <div
              id="article-content"
              className="wordpress-content max-w-[44rem]"
              dangerouslySetInnerHTML={{
                __html: sanitizeArticleHtml(post.content.rendered),
              }}
            />
            {tags.length > 0 ? (
              <footer className="mt-12 max-w-[44rem] border-t pt-6">
                <ul className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <li key={tag.id}>
                      <Link
                        href={`/articles/tag/${tag.slug}`}
                        className="inline-flex min-h-10 items-center rounded-control border px-3 text-sm text-muted-foreground hover:text-foreground"
                      >
                        #{decodeHtml(tag.name)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </footer>
            ) : null}
          </div>
          <aside className="hidden lg:col-span-3 lg:col-start-10 lg:block">
            <OnThisPage
              headingsFrom="#article-content"
              className="lg:sticky lg:top-24"
            />
          </aside>
        </div>
      </article>
      <CtaBand />
    </>
  )
}
