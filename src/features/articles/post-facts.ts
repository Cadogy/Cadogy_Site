import type { WP_Post } from "@/types/wordpress"
import { siteConfig } from "@/config/site"
import { decodeHtml } from "@/lib/wordpress-api"

const WORDS_PER_MINUTE = 230

export const countWords = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length

export const readingMinutes = (html: string) =>
  Math.max(1, Math.round(countWords(html) / WORDS_PER_MINUTE))

export type PostAuthor = {
  readonly name: string
  readonly role?: string
  readonly image?: string
}

export const authorOf = (post: WP_Post): PostAuthor => {
  const name = post._embedded?.author?.[0]?.name ?? siteConfig.name
  const founder = siteConfig.founders.find((person) => person.name === name)
  return founder ? { name, role: founder.role, image: founder.image } : { name }
}

export const topicOf = (post: WP_Post) => {
  const topic = post._embedded?.["wp:term"]?.[0]?.find(
    (term) => term.slug !== "uncategorized"
  )
  return topic ? decodeHtml(topic.name) : undefined
}
