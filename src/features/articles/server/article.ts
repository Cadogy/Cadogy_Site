import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import { getPostBySlug } from "@/lib/wordpress-api"

import { contentTags } from "../cache-tags"
import { faqFromArticleHtml } from "../faq"
import { sanitizeArticleHtml } from "../sanitize"

export const getArticle = async (slug: string) => {
  "use cache"
  cacheLife("content")
  cacheTag(...contentTags.post(slug))
  const post = await getPostBySlug(slug)
  if (!post) return null
  const content = sanitizeArticleHtml(post.content.rendered)
  return { post, content, questions: faqFromArticleHtml(content) }
}
