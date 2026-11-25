import { siteConfig } from "@/config/site"

export const openGraphFor = ({
  path,
  title,
  description,
  image,
}: {
  path: string
  title: string
  description: string
  image?: string
}) => ({
  type: "website" as const,
  locale: "en_US",
  siteName: siteConfig.name,
  url: path,
  title,
  description,
  ...(image ? { images: [{ url: image }] } : {}),
})
