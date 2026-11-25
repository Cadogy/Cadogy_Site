import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { TagList } from "@/features/marketing/components/tag-list"
import { caseStudies, displayHost } from "@/features/marketing/content"
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react"

import { openGraphFor } from "@/lib/seo/open-graph"
import { breadcrumbSchema } from "@/lib/seo/structured-data"
import { Button } from "@/components/ui/button"
import { RollingNumber } from "@/components/ui/rolling-number"
import { TextLink } from "@/components/ui/text-link"
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

  const next =
    caseStudies[(caseStudies.indexOf(study) + 1) % caseStudies.length]
  const links = [study.website, ...study.links].filter(
    (href) => href !== undefined
  )

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Work", path: "/work" },
          { name: study.name, path: `/work/${study.slug}` },
        ])}
      />
      <article>
        <header className="container-page pt-6 max-md:px-0 md:pt-14">
          <div className="isolate grid transform-gpu overflow-hidden border-t bg-card md:rounded-media md:border lg:grid-cols-12">
            <div className="flex flex-col px-5 py-6 sm:p-10 lg:col-span-5">
              <Link
                href="/work"
                className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                All work
              </Link>
              <p className="mt-6 text-meta">Case study · {study.category}</p>
              <h1 className="mt-3 text-h1">{study.name}</h1>
              <p className="mt-5 text-lead">{study.summary}</p>
              {study.website ? (
                <Button asChild className="mt-8 self-start">
                  <a
                    href={study.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit {displayHost(study.website)}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                </Button>
              ) : null}
            </div>
            <div className="relative min-h-72 border-t lg:col-span-7 lg:border-t-0 lg:border-l">
              <Image
                src={study.image}
                alt={study.imageAlt}
                fill
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1024px) 58vw, 100vw"
                quality={85}
                className="object-cover object-top"
              />
            </div>
          </div>
        </header>

        <div className="container-page grid gap-12 pt-14 pb-24 md:pb-32 lg:grid-cols-12 lg:gap-16">
          <aside
            aria-label="Project details"
            className="lg:sticky lg:top-24 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:self-start"
          >
            <dl className="rule-list text-sm">
              <div className="grid gap-1 py-4">
                <dt className="text-muted-foreground">Category</dt>
                <dd>{study.category}</dd>
              </div>
              <div className="grid gap-1 py-4">
                <dt className="text-muted-foreground">Our role</dt>
                <dd>{study.role}</dd>
              </div>
              <div className="grid gap-2 py-4">
                <dt className="text-muted-foreground">{study.productLabel}</dt>
                <dd className="grid gap-1">
                  {links.map((href) => (
                    <TextLink key={href} href={href} external>
                      {displayHost(href)}
                    </TextLink>
                  ))}
                </dd>
              </div>
              <div className="grid gap-3 py-4">
                <dt className="text-muted-foreground">Built with</dt>
                <dd>
                  <TagList items={study.stack} />
                </dd>
              </div>
            </dl>
          </aside>

          <div className="min-w-0 lg:col-span-8 lg:row-start-1">
            <section aria-labelledby="promises-title">
              <h2 id="promises-title" className="text-h2">
                {study.promisesHeading.lead}{" "}
                <span className="text-muted-foreground">
                  {study.promisesHeading.rest}
                </span>
              </h2>
              <ul className="mt-8 rule-list">
                {study.promises.map((promise) => (
                  <li key={promise} className="py-4">
                    {promise}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="glance-title" className="mt-16">
              <h2 id="glance-title" className="sr-only">
                At a glance
              </h2>
              <dl className="grid grid-cols-2 border-t sm:grid-cols-3">
                {study.facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="flex flex-col-reverse gap-1 py-6 pr-4"
                  >
                    <dt className="text-sm text-muted-foreground">
                      {fact.label}
                    </dt>
                    <dd className="text-h1 tabular-nums">
                      <RollingNumber value={fact.value} />
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-muted-foreground">
                {study.factsSource}
              </p>
            </section>

            <section
              aria-labelledby="challenge-title"
              className="mt-16 border-t pt-10"
            >
              <h2 id="challenge-title" className="text-h3">
                Problem
              </h2>
              <div className="mt-4 space-y-5 text-lead">
                {study.challenge.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section
              aria-labelledby="flow-title"
              className="mt-16 border-t pt-10"
            >
              <h2 id="flow-title" className="text-h3">
                {study.flow.title}
              </h2>
              <p className="mt-2 text-muted-foreground">{study.flow.intro}</p>
              <ol className="mt-6 rule-list">
                {study.flow.steps.map((step, index) => (
                  <li
                    key={step.title}
                    className="grid gap-1 py-5 sm:grid-cols-[3rem_1fr]"
                  >
                    <span
                      className="font-mono text-xs text-muted-foreground tabular-nums sm:pt-1"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-medium">{step.title}</h3>
                      <p className="mt-1 text-pretty text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {study.video ? (
              <section
                aria-labelledby="video-title"
                className="mt-16 border-t pt-10"
              >
                <h2 id="video-title" className="text-h3">
                  Watch the demo
                </h2>
                <figure aria-labelledby="video-caption" className="mt-6">
                  <VideoEmbed video={study.video} />
                  <figcaption
                    id="video-caption"
                    className="mt-2 text-sm text-muted-foreground"
                  >
                    Fig. 1 · {study.video.title}
                  </figcaption>
                </figure>
              </section>
            ) : null}

            {study.chapters.map((chapter, index) => (
              <section
                key={chapter.title}
                aria-labelledby={`chapter-${index}`}
                className="mt-16 border-t pt-10"
              >
                <h2 id={`chapter-${index}`} className="text-h2">
                  {chapter.title}
                </h2>
                <p className="mt-3 text-lead">{chapter.intro}</p>
                <div className="mt-8 grid gap-x-10 sm:grid-cols-2">
                  {chapter.points.map((point) => (
                    <div key={point.title} className="border-t py-6">
                      <h3 className="font-medium">{point.title}</h3>
                      <p className="mt-2 text-pretty text-muted-foreground">
                        {point.body}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {next && next.slug !== study.slug ? (
          <nav aria-label="More work" className="border-t">
            <Link
              href={`/work/${next.slug}`}
              className="group container-page flex min-h-24 items-center justify-between gap-6 py-10"
            >
              <span>
                <span className="block text-meta">Next case study</span>
                <span className="mt-1 block text-h2">{next.name}</span>
              </span>
              <ChevronRight
                className="size-6 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
          </nav>
        ) : null}
      </article>
      <CtaBand />
    </>
  )
}
