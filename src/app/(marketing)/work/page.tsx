import type { Metadata } from "next"
import { CaseStudyFeature } from "@/features/marketing/components/case-study-feature"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { PageHeader } from "@/features/marketing/components/page-header"
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
        lead="We'd rather show than tell. These are products we designed, engineered and operate today, with real customers and real money moving through them."
      />
      <section
        aria-label="Case studies"
        className="container-page grid gap-24 border-t pt-16 pb-24 md:pt-24 md:pb-32"
      >
        {caseStudies.map((study) => (
          <CaseStudyFeature key={study.slug} study={study} headingLevel={2} />
        ))}
      </section>
      <CtaBand />
    </>
  )
}
