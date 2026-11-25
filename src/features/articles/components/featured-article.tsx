import Image from "next/image"
import Link from "next/link"

import type { WP_Post } from "@/types/wordpress"
import {
  decodeHtml,
  extractExcerpt,
  featuredImageOf,
  formatDate,
} from "@/lib/wordpress-api"

import { authorOf, readingMinutes, topicOf } from "../post-facts"
import { PostAuthor } from "./post-author"

export function FeaturedArticle({ post }: { post: WP_Post }) {
  const title = decodeHtml(post.title.rendered)
  const topic = topicOf(post)
  return (
    <section
      aria-label="Latest article"
      className="group relative isolate grid transform-gpu overflow-hidden rounded-media border bg-card lg:grid-cols-12"
    >
      <div className="relative aspect-16/9 overflow-hidden lg:order-last lg:col-span-8 lg:aspect-auto lg:min-h-[26rem]">
        <Image
          src={featuredImageOf(post)}
          alt=""
          fill
          loading="eager"
          fetchPriority="high"
          quality={85}
          sizes="(min-width: 1360px) 870px, (min-width: 1024px) 64vw, 100vw"
          className="object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-col gap-8 p-6 md:p-8 lg:col-span-4">
        <div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {topic ? <span className="text-brand">{topic}</span> : null}
            <time dateTime={`${post.date_gmt}Z`}>
              {formatDate(post.date_gmt)}
            </time>
            <span>{readingMinutes(post.content.rendered)} min read</span>
          </p>
          <h2 className="mt-4 text-h3 text-balance md:text-h2 lg:text-h3">
            <Link
              href={`/articles/${post.slug}`}
              className="after:absolute after:inset-0"
            >
              {title}
            </Link>
          </h2>
          <p className="mt-4 line-clamp-3 text-pretty text-muted-foreground">
            {extractExcerpt(post.excerpt.rendered, 200)}
          </p>
        </div>
        <div className="mt-auto">
          <PostAuthor author={authorOf(post)} />
        </div>
      </div>
    </section>
  )
}
