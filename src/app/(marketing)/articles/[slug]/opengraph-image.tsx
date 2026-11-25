import { topicOf } from "@/features/articles/post-facts"
import {
  renderCover,
  SHARE_SIZE,
} from "@/features/articles/server/render-cover"

import { siteConfig } from "@/config/site"
import { decodeHtml, getPostBySlug } from "@/lib/wordpress-api"

export const alt = `An article from ${siteConfig.name}`
export const size = SHARE_SIZE
export const contentType = "image/png"

type Props = { params: Promise<{ slug: string }> }

export default async function ShareImage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug).catch(() => null)
  return renderCover({
    slug,
    topic: post ? (topicOf(post) ?? "Engineering") : "Engineering",
    title: post ? decodeHtml(post.title.rendered) : siteConfig.name,
    size: SHARE_SIZE,
  })
}
