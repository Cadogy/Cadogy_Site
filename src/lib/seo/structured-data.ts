import { faqs, services } from "@/features/marketing/content"

import { absoluteUrl, siteConfig, type Founder } from "@/config/site"

const LOGO_PATH = "/images/assets/logos/cadogy-shield.png"

const organizationRef = {
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
} as const

const founderRef = (founder: Founder) => ({
  "@type": "Person",
  name: founder.name,
  jobTitle: founder.role,
  sameAs: [founder.linkedin],
})

export const professionalServiceSchema = () => ({
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": absoluteUrl("/#business"),
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  email: siteConfig.email,
  foundingDate: String(siteConfig.foundingYear),
  image: absoluteUrl(siteConfig.ogImage),
  logo: absoluteUrl(LOGO_PATH),
  address: {
    "@type": "PostalAddress",
    addressRegion: siteConfig.location.region,
    addressCountry: siteConfig.location.country,
  },
  areaServed: [
    { "@type": "Place", name: "South Florida" },
    { "@type": "Country", name: "United States" },
  ],
  founder: siteConfig.founders.map(founderRef),
  sameAs: Object.values(siteConfig.social),
  knowsAbout: services.map((service) => service.title),
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Software engineering services",
    itemListElement: services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.title,
        description: service.summary,
      },
    })),
  },
})

export const websiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": absoluteUrl("/#website"),
  name: siteConfig.name,
  url: siteConfig.url,
  publisher: organizationRef,
  potentialAction: {
    "@type": "SearchAction",
    target: `${absoluteUrl("/articles")}?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
})

export type Crumb = { readonly name: string; readonly path: string }

export const breadcrumbSchema = (crumbs: readonly Crumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ name: "Home", path: "/" }, ...crumbs].map(
    (crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })
  ),
})

export const serviceCatalogSchema = () => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Cadogy services",
  itemListElement: services.map((service, index) => ({
    "@type": "Service",
    position: index + 1,
    name: service.title,
    description: service.detail,
    serviceType: service.title,
    url: absoluteUrl(`/services#${service.slug}`),
    areaServed: { "@type": "Country", name: "United States" },
    provider: organizationRef,
  })),
})

type Faq = { readonly question: string; readonly answer: string }

export const faqSchema = (items: readonly Faq[] = faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
})

export const personSchema = () =>
  siteConfig.founders.map((founder) => ({
    "@context": "https://schema.org",
    ...founderRef(founder),
    description: founder.bio,
    image: absoluteUrl(founder.image),
    worksFor: organizationRef,
  }))

export type ArticleFacts = {
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
    ? { ...founderRef(founder), url: absoluteUrl("/who-we-are") }
    : organizationRef
}

export const articleSchema = (article: ArticleFacts) => {
  const url = absoluteUrl(`/articles/${article.slug}`)
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    image: article.image.startsWith("http")
      ? article.image
      : absoluteUrl(article.image),
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt,
    author: authorFor(article.authorName),
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: absoluteUrl(LOGO_PATH) },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    articleSection: article.section,
    keywords: article.keywords.join(", "),
    wordCount: article.wordCount,
    inLanguage: "en-US",
  }
}
