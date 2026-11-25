import { TextLink } from "@/components/ui/text-link"
import { ProductCapture } from "@/components/media/product-capture"

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
        <ProductCapture
          image={study.image}
          mobileImage={study.mobileImage}
          alt={study.imageAlt}
          sizes="(min-width: 1024px) 60vw, 100vw"
        />
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
            <TextLink href={study.website} external>
              Visit {displayHost(study.website)}
            </TextLink>
          ) : null}
        </div>
      </div>
    </article>
  )
}
