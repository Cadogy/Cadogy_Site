import { Fragment } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CaseStudyHero } from "@/features/marketing/components/case-study/case-study-hero"
import {
  Challenge,
  Demo,
  Flow,
  Outcome,
  ProjectDetails,
  PullLine,
  StoryChapter,
} from "@/features/marketing/components/case-study/case-study-sections"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { caseStudies } from "@/features/marketing/content"
import { ChevronRight } from "lucide-react"

import { pageMetadata } from "@/lib/seo/page-metadata"
import { breadcrumbSchema } from "@/lib/seo/structured-data"
import { JsonLd } from "@/components/seo/json-ld"

type Props = { params: Promise<{ slug: string }> }

const findStudy = (slug: string) =>
  caseStudies.find((study) => study.slug === slug)

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = findStudy((await params).slug)
  if (!study) return {}
  return pageMetadata({
    title: `${study.name} case study`,
    description: study.summary,
    path: `/work/${study.slug}`,
    image: study.image,
  })
}

export default async function CaseStudyPage({ params }: Props) {
  const study = findStudy((await params).slug)
  if (!study) notFound()

  const next =
    caseStudies[(caseStudies.indexOf(study) + 1) % caseStudies.length]
  const links = [study.website, ...study.links].filter(
    (href) => href !== undefined
  )
  const [first, ...rest] = study.chapters

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Work", path: "/work" },
          { name: study.name, path: `/work/${study.slug}` },
        ])}
      />
      <article>
        <CaseStudyHero study={study} />
        <ProjectDetails study={study} links={links} />
        <Challenge study={study} />
        {first ? <StoryChapter chapter={first} index={0} /> : null}
        <Flow study={study} />
        <Demo study={study} />
        {rest.map((chapter, index) => (
          <Fragment key={chapter.title}>
            <StoryChapter chapter={chapter} index={index + 1} />
            {index === 0 ? <PullLine text={study.pullLine} /> : null}
          </Fragment>
        ))}
        <Outcome study={study} />

        {next && next.slug !== study.slug ? (
          <nav aria-label="More work" className="border-t">
            <Link
              href={`/work/${next.slug}`}
              className="group container-page flex min-h-24 items-center justify-between gap-6 section-tight"
            >
              <span>
                <span className="block text-meta">Next case study</span>
                <span className="mt-2 block text-display">{next.name}</span>
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
