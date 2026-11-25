import { topicOf } from "@/features/articles/post-facts"

import type { WP_Post } from "@/types/wordpress"
import {
  decodeHtml,
  extractExcerpt,
  featuredImageOf,
  formatDate,
} from "@/lib/wordpress-api"
import { MediaCard } from "@/components/media/media-card"

export function ArticleCard({
  post,
  headingLevel = 2,
}: {
  post: WP_Post
  headingLevel?: 2 | 3
}) {
  const topic = topicOf(post)
  return (
    <MediaCard
      headingLevel={headingLevel}
      image={featuredImageOf(post)}
      alt=""
      sizes="(min-width: 1024px) 38vw, (min-width: 640px) 56vw, 112vw"
      title={decodeHtml(post.title.rendered)}
      description={extractExcerpt(post.excerpt.rendered, 160)}
      href={`/articles/${post.slug}`}
      kicker={
        <>
          {topic ? (
            <span className="rounded-chip bg-card px-2 py-0.5 text-foreground">
              {topic}
            </span>
          ) : null}
          <time dateTime={`${post.date_gmt}Z`}>
            {formatDate(post.date_gmt)}
          </time>
        </>
      }
    />
  )
}
