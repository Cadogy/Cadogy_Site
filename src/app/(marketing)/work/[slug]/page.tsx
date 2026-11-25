import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { TagList } from "@/features/marketing/components/tag-list"
import { caseStudies, displayHost } from "@/features/marketing/content"
import { ArrowUpRight } from "lucide-react"

import { openGraphFor } from "@/lib/seo/open-graph"
import { breadcrumbSchema } from "@/lib/seo/structured-data"
import { Button } from "@/components/ui/button"
import { ProductCapture } from "@/components/media/product-capture"
import { VideoEmbed } from "@/components/media/video-embed"
import { JsonLd } from "@/components/seo/json-ld"

type Props = { params: Promise<{ slug: string }> }

const findStudy = (slug: string) =>
  caseStudies.find((study) => study.slug === slug)

export const dynamicParams = false

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = findStudy((await params).slug)
  if (!study) return {}
  const title = `${study.name} case study`
  return {
    title,
    description: study.summary,
    alternates: { canonical: `/work/${study.slug}` },
    openGraph: openGraphFor({
      path: `/work/${study.slug}`,
      title,
      description: study.summary,
      image: study.image,
    }),
  }
}

export default async function CaseStudyPage({ params }: Props) {
  const study = findStudy((await params).slug)
  if (!study) notFound()

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Work", path: "/work" },
          { name: study.name, path: `/work/${study.slug}` },
        ])}
      />
      <article>
        <header className="container-page grid gap-10 pt-20 pb-14 md:pt-28 lg:grid-cols-12 lg:items-end xl:pt-36">
          <div className="lg:col-span-8">
            <p className="text-meta">Case study · {study.category}</p>
            <h1 className="mt-5 text-display">{study.name}</h1>
            <p className="mt-7 max-w-2xl text-lead">{study.summary}</p>
          </div>
          <dl className="grid gap-6 border-t pt-6 lg:col-span-4">
            <div>
              <dt className="text-meta">Our role</dt>
              <dd className="mt-1">{study.role}</dd>
            </div>
            <div>
              <dt className="text-meta">{study.productLabel}</dt>
              <dd className="mt-3 flex flex-wrap gap-2">
                {[study.website, ...study.links]
                  .filter((href) => href !== undefined)
                  .map((href, index) => (
                    <Button
                      key={href}
                      asChild
                      variant={index === 0 ? "secondary" : "ghost"}
                    >
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {displayHost(href)}
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      </a>
                    </Button>
                  ))}
              </dd>
            </div>
          </dl>
        </header>

        <div className="container-page px-3 md:px-4">
          <ProductCapture
            image={study.image}
            mobileImage={study.mobileImage}
            alt={study.imageAlt}
            sizes="100vw"
            priority
          />
        </div>

        <section
          aria-labelledby="promises-title"
          className="container-page section"
        >
          <h2 id="promises-title" className="max-w-4xl text-statement">
            {study.promisesHeading.lead}{" "}
            <span className="text-muted-foreground">
              {study.promisesHeading.rest}
            </span>
          </h2>
          <ul className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4">
            {study.promises.map((promise) => (
              <li
                key={promise}
                className="border-t py-6 text-h3 sm:odd:pr-6 sm:even:border-l sm:even:pl-6 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0"
              >
                {promise}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="challenge-title" className="border-t">
          <div className="container-page grid gap-10 section lg:grid-cols-12">
            <h2 id="challenge-title" className="text-h2 lg:col-span-4">
              The challenge
            </h2>
            <div className="space-y-6 text-lead lg:col-span-7 lg:col-start-6">
              {study.challenge.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        {study.video ? (
          <section aria-labelledby="video-title" className="border-t">
            <div className="container-page section">
              <h2 id="video-title" className="text-h2">
                Watch the demo
              </h2>
              <div className="mt-12">
                <VideoEmbed video={study.video} />
              </div>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="glance-title" className="border-t">
          <div className="container-page section">
            <h2 id="glance-title" className="text-h2">
              At a glance
            </h2>
            <dl className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {study.facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex flex-col-reverse gap-2 border-t py-6 pr-6"
                >
                  <dt className="text-meta">{fact.label}</dt>
                  <dd className="text-h1 tabular-nums">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-muted-foreground">
              {study.factsSource}
            </p>
          </div>
        </section>

        <section aria-labelledby="flow-title" className="border-t">
          <div className="container-page grid gap-10 section lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 id="flow-title" className="text-h2">
                {study.flow.title}
              </h2>
              <p className="mt-4 max-w-sm text-muted-foreground">
                {study.flow.intro}
              </p>
            </div>
            <ol className="rule-list lg:col-span-8">
              {study.flow.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="grid gap-2 py-6 sm:grid-cols-[4rem_12rem_1fr] sm:gap-6"
                >
                  <span className="text-meta tabular-nums" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-h3">{step.title}</h3>
                  <p className="text-pretty text-muted-foreground">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {study.chapters.map((chapter, index) => (
          <section
            key={chapter.title}
            aria-labelledby={`chapter-${index}`}
            className="border-t"
          >
            <div className="container-page grid gap-10 section lg:grid-cols-12">
              <div className="lg:col-span-4">
                <h2 id={`chapter-${index}`} className="text-h2">
                  {chapter.title}
                </h2>
                <p className="mt-4 max-w-sm text-muted-foreground">
                  {chapter.intro}
                </p>
              </div>
              <div className="grid gap-x-10 sm:grid-cols-2 lg:col-span-8">
                {chapter.points.map((point) => (
                  <div key={point.title} className="border-t py-6">
                    <h3 className="text-h3">{point.title}</h3>
                    <p className="mt-3 text-pretty text-muted-foreground">
                      {point.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section aria-labelledby="stack-title" className="border-t">
          <div className="container-page section">
            <h2 id="stack-title" className="text-h2">
              Technology
            </h2>
            <TagList items={study.stack} className="mt-8" />
          </div>
        </section>
      </article>
      <CtaBand />
    </>
  )
}
