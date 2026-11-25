import Image from "next/image"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { SignalGrid } from "@/components/media/signal-grid"

const FROM_BEHIND = [0.5, 0.75] as const

const LABEL_SIDE = [
  "right-[calc(100%+2rem)] items-end text-right",
  "left-[calc(100%+2rem)]",
] as const

export function FoundersStage() {
  return (
    <figure
      aria-labelledby="founders-caption"
      className="relative pt-6 md:pt-10"
    >
      <div className="relative isolate h-[26rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_62%,transparent)] sm:h-[32rem] lg:h-[clamp(30rem,calc(100svh-14rem),42rem)]">
        <SignalGrid
          origin={FROM_BEHIND}
          peak={0.28}
          base={0.012}
          className="-z-10 [mask-image:radial-gradient(ellipse_90%_55%_at_50%_30%,black_30%,transparent_80%),linear-gradient(to_bottom,black_35%,transparent_65%)] [mask-composite:intersect] md:[mask-image:radial-gradient(ellipse_60%_75%_at_50%_70%,black_25%,transparent_75%),linear-gradient(to_right,black_22%,transparent_40%,transparent_60%,black_78%)]"
        />
        <div className="absolute top-8 left-1/2 aspect-[1121/2316] h-[145%] -translate-x-1/2">
          <Image
            src="/images/studio/team.webp"
            alt="Charles Knapp and Dylan Safra, Cadogy's founders"
            fill
            loading="eager"
            fetchPriority="high"
            quality={85}
            sizes="(min-width: 1024px) 540px, (min-width: 640px) 420px, 340px"
          />
          <figcaption id="founders-caption" className="hidden md:block">
            {siteConfig.founders.map((founder, index) => (
              <FounderLabel
                key={founder.name}
                name={founder.name}
                role={founder.role}
                className={cn(
                  "absolute top-[23%] whitespace-nowrap",
                  LABEL_SIDE[index]
                )}
                last={index === siteConfig.founders.length - 1}
              />
            ))}
          </figcaption>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="container-page -mt-10 flex justify-between gap-6 md:hidden"
      >
        {siteConfig.founders.map((founder, index) => (
          <FounderLabel
            key={founder.name}
            name={founder.name}
            role={founder.role}
            className={cn(index === 1 && "items-end text-right")}
            last
          />
        ))}
      </div>
    </figure>
  )
}

function FounderLabel({
  name,
  role,
  className,
  last,
}: {
  name: string
  role: string
  className?: string
  last: boolean
}) {
  return (
    <span className={cn("flex flex-col text-sm", className)}>
      <span className="font-medium text-foreground">{name}</span>
      <span className="sr-only">, </span>
      <span className="text-muted-foreground">{role}</span>
      {last ? null : <span className="sr-only">; </span>}
    </span>
  )
}
