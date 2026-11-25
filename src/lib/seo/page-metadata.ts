import type { Metadata } from "next"

import { siteConfig } from "@/config/site"

const SEPARATOR = " · "

export const brandedTitle = (title: string) =>
  `${title}${SEPARATOR}${siteConfig.name}`

export const TITLE_TEMPLATE = brandedTitle("%s")

export const pageMetadata = ({
  title,
  description,
  path,
  image,
  absoluteTitle = false,
  article,
}: {
  title: string
  description: string
  path: string
  image?: string
  absoluteTitle?: boolean
  article?: { publishedTime: string; modifiedTime: string }
}): Metadata => {
  const fullTitle = absoluteTitle ? title : brandedTitle(title)
  const images = image ? [{ url: image }] : undefined
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: article ? "article" : "website",
      locale: "en_US",
      siteName: siteConfig.name,
      url: path,
      title: fullTitle,
      description,
      ...(images ? { images } : {}),
      ...(article ?? {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}
