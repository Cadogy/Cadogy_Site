import Image from "next/image"
import Link from "next/link"
import { topicOf } from "@/features/articles/post-facts"
import { ChevronRight } from "lucide-react"

import type { WP_Post } from "@/types/wordpress"
import {
  decodeHtml,
  extractExcerpt,
  featuredImageOf,
  formatDate,
} from "@/lib/wordpress-api"
import { Carousel } from "@/components/media/carousel"

function ArticleSlide({ post }: { post: WP_Post }) {
  const topic = topicOf(post)
  return (
    <li className="group relative flex w-[17rem] shrink-0 snap-start flex-col sm:w-[20rem] lg:w-[22rem]">
      <div className="relative isolate aspect-[7/8] transform-gpu overflow-hidden rounded-media bg-card">
        <Image
          src={featuredImageOf(post)}
          alt=""
          fill
          quality={85}
          sizes="(min-width: 1024px) 716px, (min-width: 640px) 651px, 553px"
          className="object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      </div>
      <p className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
        {topic ? <span className="text-foreground">{topic}</span> : null}
        <time dateTime={`${post.date_gmt}Z`}>{formatDate(post.date_gmt)}</time>
      </p>
      <h3 className="mt-2 font-medium text-pretty">
        <Link
          href={`/articles/${post.slug}`}
          className="after:absolute after:inset-0"
        >
          {decodeHtml(post.title.rendered)}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-pretty text-muted-foreground">
        {extractExcerpt(post.excerpt.rendered, 140)}
      </p>
      <span
        aria-hidden="true"
        className="mt-4 inline-flex items-center gap-1 text-sm text-brand"
      >
        Read article
        <ChevronRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </span>
    </li>
  )
}

export function ArticleRail({
  posts,
  action,
}: {
  posts: readonly WP_Post[]
  action?: React.ReactNode
}) {
  return (
    <Carousel
      label="Latest articles"
      itemName="article"
      count={posts.length}
      action={action}
    >
      {posts.map((post) => (
        <ArticleSlide key={post.id} post={post} />
      ))}
    </Carousel>
  )
}
