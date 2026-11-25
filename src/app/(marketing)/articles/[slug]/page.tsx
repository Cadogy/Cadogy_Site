import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PostAuthor } from "@/features/articles/components/post-author"
import { ShareArticle } from "@/features/articles/components/share-article"
import { faqFromArticleHtml } from "@/features/articles/faq"
import {
  authorOf,
  countWords,
  readingMinutes,
} from "@/features/articles/post-facts"
import { sanitizeArticleHtml } from "@/features/articles/sanitize"
import { ArticleCard } from "@/features/marketing/components/article-card"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { ArrowLeft, ChevronRight } from "lucide-react"

import { absoluteUrl } from "@/config/site"
import { openGraphFor } from "@/lib/seo/open-graph"
import { faqSchema } from "@/lib/seo/structured-data"
import {
  decodeHtml,
  extractExcerpt,
  featuredImageOf,
  formatDate,
  getAllPosts,
  getLatestPosts,
  getPostBySlug,
} from "@/lib/wordpress-api"
import { Button } from "@/components/ui/button"
import { ArticleSchema } from "@/components/seo/article-schema"
import { JsonLd } from "@/components/seo/json-ld"
import { OnThisPage } from "@/components/site/on-this-page"

type Props = { params: Promise<{ slug: string }> }

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
  return {
    title,
    description,
    alternates: { canonical: `/articles/${post.slug}` },
    openGraph: {
      ...openGraphFor({
        path: `/articles/${post.slug}`,
        title,
        description,
      }),
      type: "article",
      publishedTime: `${post.date_gmt}Z`,
      modifiedTime: `${post.modified_gmt}Z`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const post = await getPostBySlug((await params).slug)
  if (!post) notFound()

  const title = decodeHtml(post.title.rendered)
  const description = extractExcerpt(post.excerpt.rendered, 200)
  const author = authorOf(post)
  const url = absoluteUrl(`/articles/${post.slug}`)
  const more = (await getLatestPosts(3))
    .filter((other) => other.id !== post.id)
    .slice(0, 2)
  const categories = post._embedded?.["wp:term"]?.[0] ?? []
  const tags = post._embedded?.["wp:term"]?.[1] ?? []
  const image = featuredImageOf(post)
  const content = sanitizeArticleHtml(post.content.rendered)
  const questions = faqFromArticleHtml(content)

  return (
    <>
      {questions.length > 0 ? <JsonLd data={faqSchema(questions)} /> : null}
      <ArticleSchema
        title={title}
        slug={post.slug}
        description={description}
        publishedAt={`${post.date_gmt}Z`}
        modifiedAt={`${post.modified_gmt}Z`}
        image={image}
        authorName={author.name}
        section={categories[0] ? decodeHtml(categories[0].name) : undefined}
        keywords={tags.map((tag) => decodeHtml(tag.name))}
        wordCount={countWords(post.content.rendered)}
      />
      <article>
        <header className="container-page pt-10 sm:pt-14">
          <Link
            href="/articles"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All articles
          </Link>
          <div className="mt-8 max-w-4xl">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/articles/category/${category.slug}`}
                  className="text-brand hover:underline"
                >
                  {decodeHtml(category.name)}
                </Link>
              ))}
              <time dateTime={`${post.date_gmt}Z`}>
                {formatDate(post.date_gmt)}
              </time>
              <span>{readingMinutes(post.content.rendered)} min read</span>
            </p>
            <h1 className="mt-5 text-h1 text-balance">{title}</h1>
            <p className="mt-5 max-w-3xl text-lead">{description}</p>
          </div>
        </header>

        <div className="container-page mt-12 grid gap-10 border-t pt-10 lg:grid-cols-12 lg:gap-12">
          <aside className="flex flex-wrap items-start justify-between gap-6 lg:col-span-2 lg:flex-col lg:justify-start">
            <div className="lg:sticky lg:top-24 lg:grid lg:gap-8">
              <PostAuthor author={author} />
              <div className="mt-6 lg:mt-0">
                <ShareArticle url={url} title={title} />
              </div>
            </div>
          </aside>

          <div className="min-w-0 lg:col-span-7">
            <div className="relative isolate aspect-16/9 transform-gpu overflow-hidden rounded-media border bg-card">
              <Image
                src={image}
                alt=""
                fill
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1360px) 780px, (min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
            </div>
            <div
              id="article-content"
              className="wordpress-content mt-10 max-w-[44rem]"
              dangerouslySetInnerHTML={{
                __html: content,
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

          <aside className="hidden lg:col-span-3 lg:block">
            <div className="lg:sticky lg:top-24">
              <OnThisPage headingsFrom="#article-content" />
              <div className="mt-8 border-t pt-6">
                <p className="text-sm text-muted-foreground">
                  Building something like this?
                </p>
                <Button asChild className="mt-4 w-full">
                  <Link href="/contact">
                    Start a project
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </article>

      {more.length > 0 ? (
        <section
          aria-labelledby="more-title"
          className="container-page section-tight"
        >
          <div className="border-t pt-12 lg:grid lg:grid-cols-12 lg:gap-x-12">
            <h2
              id="more-title"
              className="text-h2 lg:col-span-7 lg:col-start-3"
            >
              More articles to read
            </h2>
            <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:col-span-7 lg:col-start-3">
              {more.map((other) => (
                <ArticleCard key={other.id} post={other} headingLevel={3} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <CtaBand />
    </>
  )
}
