import type { Metadata } from "next"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { PageHeader } from "@/features/marketing/components/page-header"
import { StoryCard } from "@/features/marketing/components/story-card"
import { caseStudies } from "@/features/marketing/content"

import { breadcrumbSchema } from "@/lib/seo/structured-data"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
  title: "Work",
  description: "Software we've designed, built and still run in production.",
  alternates: { canonical: "/work" },
}

export default function WorkPage() {
  return (
    <>
      <JsonLd data={[breadcrumbSchema([{ name: "Work", path: "/work" }])]} />
      <PageHeader
        label="Work"
        title="Software we've built"
        accent="and still run."
        lead="We'd rather show than tell. These are products we designed, built and still run today, from a live marketplace to open-source developer tools."
      />
      <section className="container-page pb-24 md:pb-32">
        <ul aria-label="Case studies" className="grid gap-6">
          {caseStudies.map((study) => (
            <StoryCard key={study.slug} study={study} headingLevel={2} />
          ))}
        </ul>
      </section>
      <CtaBand />
    </>
  )
}
