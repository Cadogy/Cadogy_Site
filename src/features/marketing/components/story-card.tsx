import Image from "next/image"
import Link from "next/link"
import { Check, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import type { CaseStudy } from "../content"

const TONES = {
  playerbay: "bg-story-playerbay",
  sidecar: "bg-story-sidecar",
  "graceful-era": "bg-story-graceful-era",
  disciples: "bg-story-disciples",
  oden: "bg-story-oden",
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
        {/* What the product promises its users says more on a teaser card than
            raw counts; the full facts live on the case study page. */}
        <ul
          aria-label={`What ${study.name} promises`}
          className="mt-10 grid gap-3"
        >
          {study.promises.slice(0, 3).map((promise) => (
            <li key={promise} className="flex items-start gap-3 text-white">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white/15">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-base leading-snug">{promise}</span>
            </li>
          ))}
        </ul>
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
            study.story.tone === "playerbay" ? "object-left-top" : "object-top"
          )}
        />
      </div>
    </li>
  )
}
