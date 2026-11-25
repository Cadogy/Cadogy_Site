import type { WP_Post } from "@/types/wordpress"
import { siteConfig } from "@/config/site"
import { decodeHtml } from "@/lib/wordpress-api"

const WORDS_PER_MINUTE = 230
const SECONDS_PER_IMAGE = 12
const SECONDS_PER_VIDEO = 30

const withoutCode = (html: string) => html.replace(/<pre[\s\S]*?<\/pre>/g, " ")

export const countWords = (html: string) =>
  withoutCode(html)
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length

const count = (html: string, tag: RegExp) => (html.match(tag) ?? []).length

export const readingMinutes = (html: string) => {
  const seconds =
    (countWords(html) / WORDS_PER_MINUTE) * 60 +
    count(html, /<img\b/g) * SECONDS_PER_IMAGE +
    count(html, /<iframe\b/g) * SECONDS_PER_VIDEO
  return Math.max(1, Math.round(seconds / 60))
}

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
