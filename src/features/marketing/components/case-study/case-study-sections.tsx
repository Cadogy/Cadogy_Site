import { TextLink } from "@/components/ui/text-link"
import { VideoEmbed } from "@/components/media/video-embed"

import { displayHost, type CaseStudy } from "../../content"
import { TagList } from "../tag-list"

type Chapter = CaseStudy["chapters"][number]

const number = (index: number) => String(index + 1).padStart(2, "0")

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
            {study.status ? <span>{study.status}</span> : null}
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

/** Body copy for the story: readable length, full contrast. */
function Prose({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <div className="grid max-w-[65ch] gap-5 text-base leading-relaxed text-pretty md:text-lg">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}

export function Challenge({ study }: { study: CaseStudy }) {
  const [opening, ...rest] = study.challenge
  return (
    <section aria-labelledby="challenge-title" className="border-t section">
      <div className="container-page">
        <h2 id="challenge-title" className="text-meta">
          The challenge
        </h2>
        <p className="mt-6 max-w-5xl text-statement">{opening}</p>
        {rest.length > 0 ? (
          <div className="mt-10 grid lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7 lg:col-start-6">
              <Prose paragraphs={rest} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** One part of the story: a sticky heading beside a short essay. */
export function StoryChapter({
  chapter,
  index,
}: {
  chapter: Chapter
  index: number
}) {
  const id = `chapter-${index}`
  return (
    <section aria-labelledby={id} className="border-t section">
      <div className="container-page grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
          <span
            aria-hidden="true"
            className="font-mono text-xs text-muted-foreground tabular-nums"
          >
            {number(index)}
          </span>
          <h2 id={id} className="mt-3 text-h2">
            {chapter.title}
          </h2>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <Prose paragraphs={chapter.paragraphs} />
        </div>
      </div>
    </section>
  )
}

/** A single line set large between chapters, in our own words. */
export function PullLine({ text }: { text: string }) {
  return (
    <aside aria-label="Key point" className="border-t section">
      <p className="container-page max-w-5xl text-statement">
        <span aria-hidden="true" className="text-brand">
          “
        </span>
        {text}
        <span aria-hidden="true" className="text-brand">
          ”
        </span>
      </p>
    </aside>
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

export function Outcome({ study }: { study: CaseStudy }) {
  return (
    <section aria-labelledby="outcome-title" className="border-t section">
      <div className="container-page grid gap-8 lg:grid-cols-12 lg:gap-10">
        <h2
          id="outcome-title"
          className="text-h2 lg:sticky lg:top-24 lg:col-span-4 lg:self-start"
        >
          {study.outcome.title}
        </h2>
        <div className="lg:col-span-7 lg:col-start-6">
          <Prose paragraphs={study.outcome.paragraphs} />
        </div>
      </div>
    </section>
  )
}
