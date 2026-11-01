import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { sanitizeArticleHtml } from "@/features/articles/sanitize"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { ArrowLeft } from "lucide-react"

import {
  decodeHtml,
  extractExcerpt,
  featuredImageOf,
  formatDate,
  getAllPosts,
  getPostBySlug,
} from "@/lib/wordpress-api"
import { ArticleSchema } from "@/components/seo/article-schema"

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
      type: "article",
      title,
      description,
      publishedTime: `${post.date_gmt}Z`,
      modifiedTime: `${post.modified_gmt}Z`,
      images: [{ url: image }],
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
        <header className="container-page max-w-3xl pt-12 pb-10 sm:pt-20">
          <Link
            href="/articles"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All articles
          </Link>
          {categories.length > 0 ? (
            <p className="mt-6 text-meta">
              {categories
                .map((category) => decodeHtml(category.name))
                .join(" · ")}
            </p>
          ) : null}
          <h1 className="mt-4 text-h1">{title}</h1>
          <p className="mt-5 text-lead">{description}</p>
          <p className="mt-6 text-sm text-muted-foreground">
            By {author} ·{" "}
            <time dateTime={`${post.date_gmt}Z`}>
              {formatDate(post.date_gmt)}
            </time>{" "}
            · {readingMinutes(post.content.rendered)} min read
          </p>
        </header>

        <div className="container-page max-w-5xl">
          <div className="relative aspect-video overflow-hidden rounded-2xl border bg-muted">
            <Image
              src={image}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div
          className="wordpress-content container-page max-w-3xl py-12 sm:py-16"
          dangerouslySetInnerHTML={{
            __html: sanitizeArticleHtml(post.content.rendered),
          }}
        />

        {tags.length > 0 ? (
          <footer className="container-page max-w-3xl pb-8">
            <ul className="flex flex-wrap gap-2 border-t pt-6">
              {tags.map((tag) => (
                <li key={tag.id}>
                  <Link
                    href={`/articles/tag/${tag.slug}`}
                    className="inline-flex min-h-10 items-center rounded-full border px-3 text-sm text-muted-foreground hover:text-foreground"
                  >
                    #{decodeHtml(tag.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </footer>
        ) : null}
      </article>
      <CtaBand />
    </>
  )
}
