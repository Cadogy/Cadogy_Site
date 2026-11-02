import Image from "next/image"
import Link from "next/link"

import type { WP_Post } from "@/types/wordpress"
import {
  decodeHtml,
  extractExcerpt,
  featuredImageOf,
  formatDate,
} from "@/lib/wordpress-api"

export function ArticleCard({
  post,
  headingLevel = 3,
}: {
  post: WP_Post
  headingLevel?: 2 | 3
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3"
  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-16/10 overflow-hidden rounded-media bg-card">
        <Image
          src={featuredImageOf(post)}
          alt=""
          fill
          sizes="(min-width: 1024px) 38vw, (min-width: 640px) 56vw, 112vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <Heading className="mt-5 text-h3">
        <Link
          href={`/articles/${post.slug}`}
          className="after:absolute after:inset-0"
        >
          {decodeHtml(post.title.rendered)}
        </Link>
      </Heading>
      <p className="mt-2 line-clamp-2 text-pretty text-muted-foreground">
        {extractExcerpt(post.excerpt.rendered, 160)}
      </p>
      <p className="mt-3 text-meta">
        Article ·{" "}
        <time dateTime={`${post.date_gmt}Z`}>{formatDate(post.date_gmt)}</time>
      </p>
    </article>
  )
}
