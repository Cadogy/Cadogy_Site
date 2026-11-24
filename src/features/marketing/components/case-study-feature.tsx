import Image from "next/image"
import { ArrowUpRight } from "lucide-react"

import { displayHost, type CaseStudy } from "../content"
import { ArrowLink } from "./arrow-link"

export function CaseStudyFeature({
  study,
  headingLevel = 3,
}: {
  study: CaseStudy
  headingLevel?: 2 | 3
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3"
  return (
    <article className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
      <div className="lg:order-2">
        <div className="relative aspect-3/4 overflow-hidden rounded-media bg-card sm:hidden">
          <Image
            src={study.mobileImage}
            alt={study.imageAlt}
            fill
            sizes="100vw"
            quality={85}
            className="object-cover object-left-top"
          />
        </div>
        <div className="relative hidden aspect-video overflow-hidden rounded-media bg-card sm:block">
          <Image
            src={study.image}
            alt={study.imageAlt}
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            quality={85}
            className="object-cover object-top"
          />
        </div>
      </div>
      <div>
        <p className="text-meta">{study.category} · Built and run by Cadogy</p>
        <Heading className="mt-4 text-h2">{study.name}</Heading>
        <p className="mt-5 text-lead">{study.summary}</p>
        <ul className="mt-8 rule-list">
          {study.promises.map((promise) => (
            <li key={promise} className="py-3.5">
              {promise}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          <ArrowLink
            href={`/work/${study.slug}`}
            ariaLabel={`Read the ${study.name} case study`}
          >
            Read the case study
          </ArrowLink>
          {study.website ? (
            <a
              href={study.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Visit {displayHost(study.website)}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}
