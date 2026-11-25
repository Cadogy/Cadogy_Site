import "server-only"

import { cacheLife, cacheTag } from "next/cache"
import { contentTags } from "@/features/articles/cache-tags"

import { env } from "@/env"
import type { WP_Post, WP_Term } from "@/types/wordpress"

const PAGE_SIZE_MAX = 100

const PLACEHOLDER_IMAGE = "/images/placeholder/article-placeholder.svg"

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
  "&#8217;": "’",
  "&#8216;": "‘",
  "&#8220;": "“",
  "&#8221;": "”",
  "&#8211;": "–",
  "&#8212;": "—",
  "&hellip;": "…",
  "&#8230;": "…",
  "&nbsp;": " ",
}

export const decodeHtml = (html: string) =>
  html.replace(/&(?:#\d+|[a-z]+);/gi, (entity) => ENTITIES[entity] ?? entity)

export const extractExcerpt = (content: string, maxLength = 160) => {
  const plain = decodeHtml(content.replace(/<[^>]+>/g, "")).trim()
  if (plain.length <= maxLength) return plain
  const cut = plain.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:]$/, "")}…`
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
})

export const formatDate = (isoDate: string) =>
  dateFormatter.format(
    new Date(isoDate.endsWith("Z") ? isoDate : `${isoDate}Z`)
  )

const isPastLastPage = async (response: Response) =>
  response.status === 400 &&
  (await response
    .clone()
    .json()
    .then((body: unknown) =>
      Boolean(
        body &&
        typeof body === "object" &&
        "code" in body &&
        body.code === "rest_post_invalid_page_number"
      )
    )
    .catch(() => false))

const NO_POSTS = { posts: [], totalPages: 1, totalPosts: 0 }

const requestWordPress = (path: string, params: Record<string, string>) =>
  fetch(`${env.NEXT_PUBLIC_WP_API_URL}/${path}?${new URLSearchParams(params)}`)

const ensureOk = (response: Response, path: string) => {
  if (!response.ok)
    throw new Error(`WordPress request failed (${response.status}): ${path}`)
  return response
}

const fetchWordPress = async (path: string, params: Record<string, string>) =>
  ensureOk(await requestWordPress(path, params), path)

export const getPosts = async ({
  page = 1,
  perPage = 9,
  search = "",
  categoryId = "",
  tagId = "",
}: {
  page?: number
  perPage?: number
  search?: string
  categoryId?: string | number
  tagId?: string | number
} = {}) => {
  "use cache"
  cacheLife("content")
  cacheTag(...contentTags.posts())
  const response = await requestWordPress("posts", {
    _embed: "true",
    status: "publish",
    per_page: String(perPage),
    page: String(page),
    ...(search ? { search } : {}),
    ...(categoryId ? { categories: String(categoryId) } : {}),
    ...(tagId ? { tags: String(tagId) } : {}),
  })
  if (await isPastLastPage(response)) return NO_POSTS
  const posts: WP_Post[] = await ensureOk(response, "posts").json()
  return {
    posts,
    totalPages: Number(response.headers.get("X-WP-TotalPages") ?? 1),
    totalPosts: Number(response.headers.get("X-WP-Total") ?? 0),
  }
}

export const getLatestPosts = async (count: number) => {
  try {
    return (await getPosts({ perPage: count })).posts
  } catch (error) {
    console.error("Failed to load latest posts", error)
    return []
  }
}

export const getPostBySlug = async (slug: string): Promise<WP_Post | null> => {
  "use cache"
  cacheLife("content")
  cacheTag(...contentTags.post(slug))
  const response = await fetchWordPress("posts", {
    _embed: "true",
    status: "publish",
    slug,
  })
  const posts: WP_Post[] = await response.json()
  return posts[0] ?? null
}

const getTerms = async (
  taxonomy: "categories" | "tags"
): Promise<WP_Term[]> => {
  "use cache"
  cacheLife("content")
  cacheTag(...contentTags.terms())
  return (
    await fetchWordPress(taxonomy, { per_page: String(PAGE_SIZE_MAX) })
  ).json()
}

export const getCategories = () => getTerms("categories")

export const getTags = () => getTerms("tags")

export const getAllPosts = async (): Promise<WP_Post[]> => {
  const first = await getPosts({ perPage: PAGE_SIZE_MAX })
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
      getPosts({ perPage: PAGE_SIZE_MAX, page: index + 2 })
    )
  )
  return [...first.posts, ...rest.flatMap((result) => result.posts)]
}

export const featuredImageOf = (post: WP_Post) =>
  post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? PLACEHOLDER_IMAGE
