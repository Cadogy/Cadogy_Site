import type { WP_Post } from "@/types/wordpress"
import {
  decodeHtml,
  extractExcerpt,
  featuredImageOf,
  formatDate,
} from "@/lib/wordpress-api"
import { MediaCard } from "@/components/media/media-card"

export function ArticleCard({ post }: { post: WP_Post }) {
  return (
    <MediaCard
      aspect="landscape"
      headingLevel={2}
      image={featuredImageOf(post)}
      alt=""
      sizes="(min-width: 1024px) 38vw, (min-width: 640px) 56vw, 112vw"
      title={decodeHtml(post.title.rendered)}
      description={extractExcerpt(post.excerpt.rendered, 160)}
      href={`/articles/${post.slug}`}
      meta={
        <>
          Article ·{" "}
          <time dateTime={`${post.date_gmt}Z`}>
            {formatDate(post.date_gmt)}
          </time>
        </>
      }
    />
  )
}
