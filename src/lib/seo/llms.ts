import { caseStudies, faqs, services } from "@/features/marketing/content"

import { absoluteUrl, siteConfig } from "@/config/site"

type ArticleEntry = {
  readonly title: string
  readonly slug: string
  readonly summary: string
}

const section = (title: string, lines: readonly string[]) => [
  `## ${title}`,
  "",
  ...lines,
  "",
]

export const buildLlmsTxt = ({
  articles,
}: {
  articles: readonly ArticleEntry[]
}) =>
  [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    `Founded: ${siteConfig.foundingYear}`,
    `Location: ${siteConfig.location.label}, United States (working with clients everywhere)`,
    `Founders: ${siteConfig.founders.map((founder) => `${founder.name} (${founder.role})`).join(", ")}`,
    `Contact: ${siteConfig.email}`,
    `Start a project: ${absoluteUrl("/contact")}`,
    "",
    ...section(
      "Services",
      services.map(
        (service) =>
          `- [${service.title}](${absoluteUrl(`/services#${service.slug}`)}): ${service.summary} ${service.detail}`
      )
    ),
    ...section(
      "Work",
      caseStudies.map(
        (study) =>
          `- [${study.name}](${absoluteUrl(`/work/${study.slug}`)}): ${study.summary} ${study.role}`
      )
    ),
    ...section("Company", [
      `- [About Cadogy](${absoluteUrl("/who-we-are")}): Who we are, how we work and the people behind the studio.`,
      `- [Services](${absoluteUrl("/services")}): Capabilities, process and ways to work with us.`,
      `- [Privacy policy](${absoluteUrl("/policies/privacy-policy")})`,
      `- [Terms of use](${absoluteUrl("/policies/terms-of-use")})`,
    ]),
    ...(articles.length > 0
      ? section(
          "Articles",
          articles.map(
            (article) =>
              `- [${article.title}](${absoluteUrl(`/articles/${article.slug}`)}): ${article.summary}`
          )
        )
      : []),
    ...section(
      "Frequently asked questions",
      faqs.flatMap((faq) => [`### ${faq.question}`, "", faq.answer, ""])
    ),
  ].join("\n")
