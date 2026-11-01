import { absoluteUrl, siteConfig } from "@/config/site"
import { breadcrumbSchema } from "@/lib/seo/structured-data"

import { JsonLd } from "./json-ld"

type ArticleSchemaProps = {
  readonly title: string
  readonly slug: string
  readonly description: string
  readonly publishedAt: string
  readonly modifiedAt: string
  readonly image: string
  readonly authorName: string
  readonly section?: string
  readonly keywords: readonly string[]
  readonly wordCount: number
}

const authorFor = (name: string) => {
  const founder = siteConfig.founders.find((person) => person.name === name)
  return founder
    ? {
        "@type": "Person",
        name: founder.name,
        jobTitle: founder.role,
        url: absoluteUrl("/who-we-are"),
        sameAs: [founder.linkedin],
      }
    : { "@type": "Organization", name: siteConfig.name, url: siteConfig.url }
}

export function ArticleSchema(props: ArticleSchemaProps) {
  const url = absoluteUrl(`/articles/${props.slug}`)
  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: props.title,
    description: props.description,
    image: props.image.startsWith("http")
      ? props.image
      : absoluteUrl(props.image),
    datePublished: props.publishedAt,
    dateModified: props.modifiedAt,
    author: authorFor(props.authorName),
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/images/assets/logos/cadogy-shield.png"),
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    articleSection: props.section,
    keywords: props.keywords.join(", "),
    wordCount: props.wordCount,
    inLanguage: "en-US",
  }

  return (
    <JsonLd
      data={[
        article,
        breadcrumbSchema([
          { name: "Articles", path: "/articles" },
          { name: props.title, path: `/articles/${props.slug}` },
        ]),
      ]}
    />
  )
}
