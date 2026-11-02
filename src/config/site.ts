const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.cadogy.com"

export type Founder = {
  readonly name: string
  readonly role: string
  readonly bio: string
  readonly image: string
  readonly linkedin: string
  readonly email: string
}

export const siteConfig = {
  name: "Cadogy",
  tagline: "Senior software studio",
  description:
    "Cadogy is a senior software studio in South Florida. We design, build and run web apps, marketplaces, payment systems and AI features for growing businesses.",
  url: baseUrl,
  email: "hello@cadogy.com",
  foundingYear: 2020,
  location: { label: "South Florida", region: "FL", country: "US" },
  ogImage: "/opengraph-image",
  social: {
    linkedin: "https://www.linkedin.com/company/cadogy",
    github: "https://github.com/cadogy",
    instagram: "https://www.instagram.com/cadogyweb",
  },
  founders: [
    {
      name: "Charles Knapp",
      role: "Co-Founder & CTO",
      bio: "Charles leads engineering. He builds and runs the parts of a product where reliability matters most — payments, authentication, real-time features and the infrastructure underneath — and leads engineering for PlayerBay.",
      image: "/images/authors/charles_k_author.jpg",
      linkedin: "https://www.linkedin.com/in/knappcharles",
      email: "charles@cadogy.com",
    },
    {
      name: "Dylan Safra",
      role: "Co-Founder & CFO",
      bio: "Dylan runs the business side: budgets, timelines and growth. He keeps every engagement scoped, on schedule and set up to succeed commercially, so what we build actually ships.",
      image: "/images/authors/dylan_s_author.jpg",
      linkedin: "https://www.linkedin.com/in/dylansafra",
      email: "dylan@cadogy.com",
    },
  ] satisfies readonly Founder[],
  nav: [
    { label: "Work", href: "/work" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/who-we-are" },
    { label: "Articles", href: "/articles" },
  ],
} as const

export const absoluteUrl = (path = "/") =>
  new URL(path, siteConfig.url).toString()
