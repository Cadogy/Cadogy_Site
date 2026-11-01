import "server-only"

import { getCategories } from "@/lib/wordpress-api"

export const getTopics = async () => {
  try {
    return (await getCategories()).filter(
      (category) => category.count > 0 && category.slug !== "uncategorized"
    )
  } catch (error) {
    console.error("Failed to load article topics", error)
    return []
  }
}

export const parsePage = (value: string | undefined) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}
