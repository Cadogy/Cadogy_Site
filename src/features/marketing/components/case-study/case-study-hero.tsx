import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SignalGrid } from "@/components/media/signal-grid"

import { displayHost, type CaseStudy } from "../../content"

const TONES = { playerbay: "--brand", sidecar: "--violet" } as const
const FROM_BELOW = [0.5, 1] as const

export function CaseStudyHero({ study }: { study: CaseStudy }) {
  return (
    <header className="relative isolate overflow-hidden bg-background">
      <SignalGrid
        origin={FROM_BELOW}
        tone={TONES[study.story.tone]}
        peak={0.3}
        base={0.012}
        className="-z-10 [mask-image:linear-gradient(to_bottom,transparent,black_30%)] sm:[mask-image:linear-gradient(to_bottom,transparent_25%,black_80%),linear-gradient(to_right,black_15%,transparent_38%,transparent_62%,black_85%)] sm:[mask-composite:intersect]"
      />
      <div className="container-page flex flex-col items-center pt-8 text-center md:pt-12">
        <Link
          href="/work"
          className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          All work
        </Link>
        <p className="mt-6 text-meta md:mt-8">Case study · {study.category}</p>
        <h1 className="mt-4 text-display">{study.name}</h1>
        <p className="mt-5 max-w-2xl text-lead">{study.summary}</p>
        {study.website ? (
          <Button asChild size="lg" className="mt-8">
            <a href={study.website} target="_blank" rel="noopener noreferrer">
              Visit {displayHost(study.website)}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </Button>
        ) : null}
      </div>
      <div className="container-page mt-12 md:mt-16">
        <div className="relative isolate mx-auto aspect-[4/5] max-w-md transform-gpu overflow-hidden rounded-t-media bg-card sm:aspect-[16/9] sm:max-w-5xl lg:aspect-[16/7.5]">
          <Image
            src={study.mobileImage}
            alt={study.imageAlt}
            fill
            loading="eager"
            fetchPriority="high"
            quality={85}
            sizes="(min-width: 640px) 1px, 448px"
            className="object-cover object-top sm:hidden"
          />
          <Image
            src={study.hero.image}
            alt={study.imageAlt}
            fill
            loading="eager"
            quality={85}
            sizes="(min-width: 1024px) 1024px, 100vw"
            className={cn("hidden object-cover sm:block", study.hero.focus)}
          />
        </div>
      </div>
    </header>
  )
}
