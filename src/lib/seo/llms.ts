import {
  caseStudies,
  faqs,
  principles,
  processSteps,
  services,
  waysToWork,
} from "@/features/marketing/content"

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

const sentence = (items: readonly string[]) => `${items.join("; ")}.`

const founders = siteConfig.founders.map(
  (founder) => `${founder.name} (${founder.role}): ${founder.linkedin}`
)

const overview = [
  `${siteConfig.name} is a two-person senior software studio, founded in ${siteConfig.foundingYear} in ${siteConfig.location.label} by ${siteConfig.founders.map((founder) => founder.name).join(" and ")}. The founders do the work themselves: the people a client talks to are the people who design, build, test and ship the software. There are no account managers or handoffs.`,
  "",
  "We build and run our own products in production, including a two-sided marketplace and an open-source developer tool, so the practices we bring to client work are the ones we rely on every day.",
  "",
]

const keyFacts = [
  `- Founded: ${siteConfig.foundingYear}`,
  `- Location: ${siteConfig.location.label}, United States. We work with clients everywhere.`,
  "- Team: two founders, both hands-on",
  ...founders.map((founder) => `- Founder: ${founder}`),
  `- Contact: ${siteConfig.email}`,
  `- Start a project: ${absoluteUrl("/contact")}`,
  `- Ways to work: ${waysToWork.options.map((option) => option.title).join(", ")}`,
]

const serviceLines = services.map(
  (service) =>
    `- [${service.title}](${absoluteUrl(`/services#${service.slug}`)}): ${service.summary} ${service.detail} Includes: ${sentence(service.includes)}`
)

const workLines = caseStudies.map((study) =>
  [
    `- [${study.name}](${absoluteUrl(`/work/${study.slug}`)}): ${study.summary} ${study.role}`,
    `  - Figures: ${sentence(study.facts.map((fact) => `${fact.label}: ${fact.value}`))} ${study.factsSource}`,
    `  - Built with: ${study.stack.join(", ")}`,
    ...(study.website ? [`  - Live site: ${study.website}`] : []),
  ].join("\n")
)

const processLines = [
  ...processSteps.map((step) => `- ${step.title}: ${step.body}`),
  ...principles.map((principle) => `- ${principle.title}: ${principle.body}`),
]

const waysToWorkLines = waysToWork.options.map((option, index) => {
  const label =
    "note" in option
      ? `${option.title} (${option.note.toLowerCase()})`
      : option.title
  const details = waysToWork.rows.map(
    (row) => `${row.topic}: ${row.values[index]}`
  )
  return `- ${label}: ${details.join(". ")}.`
})

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
    ...overview,
    ...section("Key facts", keyFacts),
    ...section("Services", serviceLines),
    ...section("Work", workLines),
    ...section("How we work", processLines),
    ...section("Ways to work with us", waysToWorkLines),
    ...section("Company", [
      `- [About Cadogy](${absoluteUrl("/who-we-are")}): Who we are, how we work and the people behind the studio.`,
      `- [Services](${absoluteUrl("/services")}): Capabilities, process and ways to work with us.`,
      `- [Work](${absoluteUrl("/work")}): Case studies of the products we built and run.`,
      `- [Articles](${absoluteUrl("/articles")}): What we learn building and running production software.`,
      `- [Start a project](${absoluteUrl("/contact")}): Tell us what you're building. One of the founders replies.`,
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
      faqs
        .flatMap((faq) => ["", `### ${faq.question}`, "", faq.answer])
        .slice(1)
    ),
    ...section("Optional", [
      `- [Privacy policy](${absoluteUrl("/policies/privacy-policy")})`,
      `- [Terms of use](${absoluteUrl("/policies/terms-of-use")})`,
    ]),
  ]
    .join("\n")
    .trimEnd()
    .concat("\n")
