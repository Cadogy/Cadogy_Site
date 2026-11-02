import Image from "next/image"

import type { CaseStudy } from "../content"
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
        <div className="relative aspect-3/4 overflow-hidden rounded-[20px] bg-card sm:hidden">
          <Image
            src={study.mobileImage}
            alt={`${study.name} homepage`}
            fill
            sizes="100vw"
            quality={85}
            className="object-cover object-left-top"
          />
        </div>
        <div className="relative hidden aspect-video overflow-hidden rounded-[20px] bg-card sm:block">
          <Image
            src={study.image}
            alt={`${study.name} homepage`}
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
        <ul className="mt-8 grid border-t">
          {study.promises.map((promise) => (
            <li key={promise} className="border-b py-3.5 text-[15px]">
              {promise}
            </li>
          ))}
        </ul>
        <ArrowLink
          href={`/work/${study.slug}`}
          className="mt-8"
          ariaLabel={`Read the ${study.name} case study`}
        >
          Read the case study
        </ArrowLink>
      </div>
    </article>
  )
}
