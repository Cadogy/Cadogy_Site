import type { MetadataRoute } from "next"
import { caseStudies } from "@/features/marketing/content"

import { absoluteUrl } from "@/config/site"
import { getAllPosts, getCategories } from "@/lib/wordpress-api"

export const revalidate = 3600

const STATIC_ROUTES = [
  { path: "/", priority: 1 },
  { path: "/services", priority: 0.9 },
  { path: "/work", priority: 0.9 },
  { path: "/who-we-are", priority: 0.8 },
  { path: "/contact", priority: 0.8 },
  { path: "/articles", priority: 0.7 },
  { path: "/policies/privacy-policy", priority: 0.2 },
  { path: "/policies/terms-of-use", priority: 0.2 },
] as const

const safely = async <T>(load: () => Promise<T[]>): Promise<T[]> => {
  try {
    return await load()
  } catch (error) {
    console.error("Sitemap source failed", error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories] = await Promise.all([
    safely(getAllPosts),
    safely(getCategories),
  ])

  return [
    ...STATIC_ROUTES.map(({ path, priority }) => ({
      url: absoluteUrl(path),
      priority,
    })),
    ...caseStudies.map((study) => ({
      url: absoluteUrl(`/work/${study.slug}`),
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/articles/${post.slug}`),
      lastModified: new Date(`${post.modified_gmt}Z`),
      priority: 0.6,
    })),
    ...categories
      .filter((category) => category.count > 0)
      .map((category) => ({
        url: absoluteUrl(`/articles/category/${category.slug}`),
        priority: 0.4,
      })),
  ]
}
