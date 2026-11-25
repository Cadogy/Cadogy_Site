import { Check } from "lucide-react"

import { RollingNumber } from "@/components/ui/rolling-number"
import { TextLink } from "@/components/ui/text-link"
import { VideoEmbed } from "@/components/media/video-embed"

import { displayHost, type CaseStudy } from "../../content"
import { TagList } from "../tag-list"

type Chapter = CaseStudy["chapters"][number]

const number = (index: number) => String(index + 1).padStart(2, "0")

export function AtAGlance({ study }: { study: CaseStudy }) {
  return (
    <section aria-labelledby="glance-title" className="border-t">
      <h2 id="glance-title" className="sr-only">
        At a glance
      </h2>
      <div className="container-page">
        <dl className="grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-0 lg:divide-x">
          {study.facts.map((fact) => (
            <div
              key={fact.label}
              className="flex flex-col-reverse gap-2 py-8 lg:py-12 lg:pl-8 lg:first:pl-0"
            >
              <dt className="text-sm text-muted-foreground">{fact.label}</dt>
              <dd className="text-h1 tabular-nums">
                <RollingNumber value={fact.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export function ProjectDetails({
  study,
  links,
}: {
  study: CaseStudy
  links: readonly string[]
}) {
  return (
    <aside aria-label="Project details" className="border-t">
      <dl className="container-page grid gap-x-10 gap-y-6 py-10 text-sm sm:grid-cols-3">
        <div className="grid content-start gap-1">
          <dt className="text-muted-foreground">Category</dt>
          <dd>{study.category}</dd>
        </div>
        <div className="grid content-start gap-1">
          <dt className="text-muted-foreground">Our role</dt>
          <dd>{study.role}</dd>
        </div>
        <div className="grid content-start gap-1">
          <dt className="text-muted-foreground">{study.productLabel}</dt>
          <dd className="grid gap-1">
            {links.map((href) => (
              <TextLink key={href} href={href} external>
                {displayHost(href)}
              </TextLink>
            ))}
          </dd>
        </div>
        <div className="grid gap-3 border-t pt-6 sm:col-span-3 lg:grid-cols-[8rem_1fr] lg:items-baseline">
          <dt className="text-muted-foreground">Built with</dt>
          <dd>
            <TagList items={study.stack} />
          </dd>
        </div>
      </dl>
    </aside>
  )
}

export function Promises({ study }: { study: CaseStudy }) {
  return (
    <section aria-labelledby="promises-title" className="border-t section">
      <div className="container-page grid gap-10 lg:grid-cols-12 lg:gap-16">
        <h2
          id="promises-title"
          className="text-h2 lg:sticky lg:top-24 lg:col-span-5 lg:self-start"
        >
          {study.promisesHeading.lead}{" "}
          <span className="text-muted-foreground">
            {study.promisesHeading.rest}
          </span>
        </h2>
        <ul className="rule-list lg:col-span-7">
          {study.promises.map((promise) => (
            <li key={promise} className="flex items-center gap-4 py-5 text-h3">
              <Check
                className="size-5 shrink-0 text-brand"
                aria-hidden="true"
              />
              {promise}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Problem({ study }: { study: CaseStudy }) {
  const [opening, ...rest] = study.challenge
  return (
    <section aria-labelledby="challenge-title" className="border-t section">
      <div className="container-page">
        <h2 id="challenge-title" className="text-meta">
          Problem
        </h2>
        <p className="mt-6 max-w-5xl text-statement">{opening}</p>
        {rest.length > 0 ? (
          <div className="mt-10 grid max-w-5xl gap-6 text-lead md:grid-cols-2">
            {rest.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function Flow({ study }: { study: CaseStudy }) {
  return (
    <section aria-labelledby="flow-title" className="border-t section">
      <div className="container-page">
        <h2 id="flow-title" className="text-h2">
          {study.flow.title}
        </h2>
        <p className="mt-3 max-w-2xl text-lead">{study.flow.intro}</p>
        <ol className="mt-12 grid gap-8 lg:auto-cols-fr lg:grid-flow-col lg:gap-6">
          {study.flow.steps.map((step, index) => (
            <li
              key={step.title}
              className="relative border-l pl-6 lg:border-t lg:border-l-0 lg:pt-6 lg:pl-0"
            >
              <span
                aria-hidden="true"
                className="absolute top-0 -left-[5px] size-2.5 rounded-full bg-brand lg:-top-[5px] lg:left-0"
              />
              <span
                aria-hidden="true"
                className="font-mono text-xs text-muted-foreground tabular-nums"
              >
                {number(index)}
              </span>
              <h3 className="mt-2 font-medium">{step.title}</h3>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function Demo({ study }: { study: CaseStudy }) {
  if (!study.video) return null
  return (
    <section aria-labelledby="video-title" className="border-t section">
      <div className="container-page">
        <h2 id="video-title" className="text-h2">
          Watch the demo
        </h2>
        <figure aria-labelledby="video-caption" className="mt-10">
          <VideoEmbed video={study.video} />
          <figcaption
            id="video-caption"
            className="mt-3 text-sm text-muted-foreground"
          >
            Fig. 1 · {study.video.title}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

function SplitChapter({ chapter, id }: { chapter: Chapter; id: string }) {
  return (
    <div className="container-page grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
        <h2 id={id} className="text-h2">
          {chapter.title}
        </h2>
        <p className="mt-4 text-lead">{chapter.intro}</p>
      </div>
      <div className="grid gap-x-10 sm:grid-cols-2 lg:col-span-8">
        {chapter.points.map((point) => (
          <div key={point.title} className="border-t py-6">
            <h3 className="font-medium">{point.title}</h3>
            <p className="mt-2 text-pretty text-muted-foreground">
              {point.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function IndexChapter({ chapter, id }: { chapter: Chapter; id: string }) {
  return (
    <div className="container-page">
      <h2 id={id} className="text-h2">
        {chapter.title}
      </h2>
      <p className="mt-4 max-w-2xl text-lead">{chapter.intro}</p>
      <ol className="mt-10 rule-list">
        {chapter.points.map((point, index) => (
          <li
            key={point.title}
            className="grid gap-2 py-6 md:grid-cols-12 md:gap-10"
          >
            <span
              aria-hidden="true"
              className="text-h3 text-muted-foreground tabular-nums md:col-span-1"
            >
              {number(index)}
            </span>
            <h3 className="text-h3 md:col-span-4">{point.title}</h3>
            <p className="text-pretty text-muted-foreground md:col-span-7">
              {point.body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function SpotlightChapter({ chapter, id }: { chapter: Chapter; id: string }) {
  const [lead, ...rest] = chapter.points
  return (
    <div className="container-page">
      <h2 id={id} className="text-h2">
        {chapter.title}
      </h2>
      <p className="mt-4 max-w-2xl text-lead">{chapter.intro}</p>
      {lead ? (
        <div className="mt-10 grid gap-4 border-t pt-8 lg:grid-cols-12 lg:gap-16">
          <h3 className="text-statement lg:col-span-5">{lead.title}</h3>
          <p className="text-lead lg:col-span-7">{lead.body}</p>
        </div>
      ) : null}
      <div className="mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((point) => (
          <div key={point.title} className="border-t py-6">
            <h3 className="font-medium">{point.title}</h3>
            <p className="mt-2 text-pretty text-muted-foreground">
              {point.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

const LAYOUTS = [SplitChapter, IndexChapter, SpotlightChapter] as const

export function Chapters({ study }: { study: CaseStudy }) {
  return study.chapters.map((chapter, index) => {
    const Layout = LAYOUTS[index % LAYOUTS.length] ?? SplitChapter
    const id = `chapter-${index}`
    return (
      <section
        key={chapter.title}
        aria-labelledby={id}
        className="border-t section"
      >
        <Layout chapter={chapter} id={id} />
      </section>
    )
  })
}
