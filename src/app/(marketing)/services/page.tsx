import type { Metadata } from "next"
import Image from "next/image"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { PageHeader } from "@/features/marketing/components/page-header"
import { ProcessSteps } from "@/features/marketing/components/process-steps"
import { SectionHeading } from "@/features/marketing/components/section-heading"
import { engagementModels, services } from "@/features/marketing/content"

import {
  breadcrumbSchema,
  serviceCatalogSchema,
} from "@/lib/seo/structured-data"
import { cn } from "@/lib/utils"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
  title: "Services",
  description:
    "Product engineering, payments, AI integration and infrastructure from a senior software studio with a track record in production.",
  alternates: { canonical: "/services" },
}

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

      <div className="container-page grid gap-24 pb-24 md:gap-32 md:pb-32">
        {services.map((service, index) => (
          <section
            key={service.slug}
            id={service.slug}
            aria-labelledby={`${service.slug}-title`}
            className="grid scroll-mt-24 gap-10 lg:grid-cols-12 lg:items-center lg:gap-16"
          >
            <div
              className={cn(
                "relative aspect-4/3 overflow-hidden rounded-[20px] bg-card lg:col-span-7",
                index % 2 === 1 && "lg:order-2"
              )}
            >
              <Image
                src={service.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 78vw, 135vw"
                quality={85}
                className="object-cover"
              />
            </div>
            <div className="lg:col-span-5">
              <p className="text-meta">0{index + 1}</p>
              <h2 id={`${service.slug}-title`} className="mt-4 text-h2">
                {service.title}
              </h2>
              <p className="mt-5 text-lead">{service.detail}</p>
              <ul className="mt-8 grid border-t">
                {service.includes.map((item) => (
                  <li key={item} className="border-b py-3.5 text-[15px]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <section aria-labelledby="process-title" className="border-t section">
        <div className="container-page">
          <SectionHeading
            id="process-title"
            title="How every engagement runs."
            lead="The same three steps whether we're building a product from scratch or hardening one you already have."
          />
          <div className="mt-14">
            <ProcessSteps />
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
          <div className="mt-14 grid border-t lg:grid-cols-3">
            {engagementModels.map((model) => (
              <article
                key={model.title}
                className="border-b py-10 lg:border-b-0 lg:border-l lg:px-8 lg:first:border-l-0 lg:first:pl-0"
              >
                <h3 className="text-h3">{model.title}</h3>
                <p className="mt-3 max-w-sm text-pretty text-muted-foreground">
                  {model.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
