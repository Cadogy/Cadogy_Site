import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RollingNumber } from "@/components/ui/rolling-number"

import type { CaseStudy } from "../content"

const TONES = {
  playerbay: "bg-story-playerbay",
  sidecar: "bg-story-sidecar",
} as const

export function StoryCard({
  study,
  headingLevel = 3,
  className,
}: {
  study: CaseStudy
  headingLevel?: 2 | 3
  className?: string
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3"
  return (
    <li
      className={cn(
        "group relative isolate grid transform-gpu overflow-hidden rounded-media md:grid-cols-2",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col p-6 text-white sm:p-10 lg:p-12",
          TONES[study.story.tone]
        )}
      >
        <p className="text-sm font-medium text-white/80">{study.name}</p>
        <Heading className="mt-4 text-h2 text-white">
          {study.story.headline}
        </Heading>
        <dl className="mt-10 grid grid-cols-2 gap-6">
          {study.facts.slice(0, 2).map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse gap-1">
              <dt className="text-sm text-white/80">{fact.label}</dt>
              <dd className="text-h1 text-white tabular-nums">
                <RollingNumber value={fact.value} />
              </dd>
            </div>
          ))}
        </dl>
        <Button
          asChild
          className="mt-10 self-start bg-white text-black hover:bg-white/90 md:mt-auto"
        >
          <Link
            href={`/work/${study.slug}`}
            aria-label={`Read the ${study.name} case study`}
          >
            Read the story
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <div className="relative aspect-16/10 md:aspect-auto md:min-h-[34rem]">
        <Image
          src={study.story.image ?? study.image}
          alt={study.imageAlt}
          fill
          sizes="(min-width: 768px) 45vw, 90vw"
          quality={85}
          draggable={false}
          className={cn(
            "object-cover",
            study.story.tone === "sidecar" ? "object-top" : "object-left-top"
          )}
        />
      </div>
    </li>
  )
}
