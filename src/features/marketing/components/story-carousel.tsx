import { Carousel } from "@/components/media/carousel"

import type { CaseStudy } from "../content"
import { StoryCard } from "./story-card"

export function StoryCarousel({
  studies,
  action,
}: {
  studies: readonly CaseStudy[]
  action?: React.ReactNode
}) {
  return (
    <Carousel
      label="Case studies"
      itemName="story"
      count={studies.length}
      action={action}
    >
      {studies.map((study) => (
        <StoryCard
          key={study.slug}
          study={study}
          className="w-[88%] shrink-0 carousel-dim snap-start snap-always md:w-[82%] xl:w-[min(82%,1100px)]"
        />
      ))}
    </Carousel>
  )
}
