import { faqs, services } from "@/features/marketing/content"

import { absoluteUrl, siteConfig } from "@/config/site"

const organizationRef = {
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
} as const

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
  logo: absoluteUrl("/images/assets/logos/cadogy-shield.png"),
  address: {
    "@type": "PostalAddress",
    addressRegion: siteConfig.location.region,
    addressCountry: siteConfig.location.country,
  },
  areaServed: [
    { "@type": "Place", name: "South Florida" },
    { "@type": "Country", name: "United States" },
  ],
  founder: siteConfig.founders.map((founder) => ({
    "@type": "Person",
    name: founder.name,
    jobTitle: founder.role,
    sameAs: [founder.linkedin],
  })),
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

export const faqSchema = () => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
})

export const personSchema = () =>
  siteConfig.founders.map((founder) => ({
    "@context": "https://schema.org",
    "@type": "Person",
    name: founder.name,
    jobTitle: founder.role,
    description: founder.bio,
    image: absoluteUrl(founder.image),
    worksFor: organizationRef,
    sameAs: [founder.linkedin],
  }))
