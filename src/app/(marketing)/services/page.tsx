import type { Metadata } from "next"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { PageHeader } from "@/features/marketing/components/page-header"
import { ProcessSteps } from "@/features/marketing/components/process-steps"
import { SectionHeading } from "@/features/marketing/components/section-heading"
import { ServiceExplorer } from "@/features/marketing/components/service-explorer"
import { waysToWork } from "@/features/marketing/content"

import { pageMetadata } from "@/lib/seo/page-metadata"
import {
  breadcrumbSchema,
  serviceCatalogSchema,
} from "@/lib/seo/structured-data"
import { ComparisonTable } from "@/components/ui/comparison-table"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = pageMetadata({
  title: "Services",
  description:
    "Product engineering, payments, AI integration and infrastructure from a senior software studio with a track record in production.",
  path: "/services",
})

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: "Services", path: "/services" }]),
          serviceCatalogSchema(),
        ]}
      />
      <PageHeader
        label="Services"
        title="Everything it takes to ship"
        accent="and run serious software."
        lead="A senior team, a disciplined process and a track record in production. Bring us a product to build, a system to fix or a decision to make."
      />

      <section aria-label="Services" className="container-page pb-24 md:pb-32">
        <ServiceExplorer />
      </section>

      <section
        id="process"
        aria-labelledby="process-title"
        className="scroll-mt-24 border-t section"
      >
        <div className="container-page">
          <SectionHeading
            id="process-title"
            title="How every engagement runs."
            lead="The same three steps whether we're building a product from scratch or hardening one you already have."
          />
          <div className="mt-14">
            <ProcessSteps withExamples />
          </div>
        </div>
      </section>

      <section aria-labelledby="engagements-title" className="border-t section">
        <div className="container-page">
          <SectionHeading
            id="engagements-title"
            title="Ways to work"
            accent="with us."
          />
          <div className="mt-14">
            <ComparisonTable
              caption="Ways to work with us"
              options={waysToWork.options}
              rows={waysToWork.rows}
              highlight={waysToWork.highlight}
            />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
