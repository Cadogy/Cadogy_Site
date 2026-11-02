import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { caseStudies } from "@/features/marketing/content"
import { ArrowUpRight } from "lucide-react"

import { breadcrumbSchema } from "@/lib/seo/structured-data"
import { Button } from "@/components/ui/button"
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
  return {
    title: `${study.name} case study`,
    description: study.summary,
    alternates: { canonical: `/work/${study.slug}` },
    openGraph: { images: [{ url: study.image }] },
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
              <dt className="text-meta">Live product</dt>
              <dd className="mt-3">
                <Button asChild variant="secondary">
                  <a href={study.url} target="_blank" rel="noopener noreferrer">
                    {new URL(study.url).host}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                </Button>
              </dd>
            </div>
          </dl>
        </header>

        <div className="px-3 md:px-4">
          <div className="relative aspect-3/4 overflow-hidden rounded-[20px] bg-card sm:hidden">
            <Image
              src={study.mobileImage}
              alt={`${study.name} homepage`}
              fill
              priority
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
              priority
              sizes="100vw"
              quality={85}
              className="object-cover object-top"
            />
          </div>
        </div>

        <section
          aria-labelledby="promises-title"
          className="container-page section"
        >
          <h2 id="promises-title" className="max-w-4xl text-statement">
            What buyers are promised{" "}
            <span className="text-muted-foreground">
              — and what the platform has to guarantee behind the scenes.
            </span>
          </h2>
          <ul className="mt-12 grid border-t sm:grid-cols-2 lg:grid-cols-4">
            {study.promises.map((promise) => (
              <li
                key={promise}
                className="border-b py-6 text-h3 sm:odd:pr-6 sm:even:border-l sm:even:pl-6 lg:border-b-0 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0"
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

        <section aria-labelledby="built-title" className="border-t">
          <div className="container-page section">
            <h2 id="built-title" className="text-h2">
              What we built
            </h2>
            <div className="mt-14 grid border-t sm:grid-cols-2 lg:grid-cols-3">
              {study.capabilities.map((capability) => (
                <div key={capability.title} className="border-b py-8 sm:pr-8">
                  <h3 className="text-h3">{capability.title}</h3>
                  <p className="mt-3 max-w-sm text-pretty text-muted-foreground">
                    {capability.body}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-14">
              <h3 className="text-meta">Technology</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {study.stack.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full bg-foreground/8 px-4 py-2 text-sm"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </article>
      <CtaBand />
    </>
  )
}
