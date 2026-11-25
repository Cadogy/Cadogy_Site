"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import type { CaseStudy } from "../content"
import { StoryCard } from "./story-card"

const scrollBehavior = (): ScrollBehavior =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth"

export function StoryCarousel({
  studies,
  action,
}: {
  studies: readonly CaseStudy[]
  action?: React.ReactNode
}) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: studies.length < 2 })
  const drag = useRef<{
    x: number
    left: number
    moved: boolean
    velocity: number
    lastX: number
    lastTime: number
  } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [settling, setSettling] = useState(false)

  const onPointerDown = (event: React.PointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return
    drag.current = {
      x: event.clientX,
      left: event.currentTarget.scrollLeft,
      moved: false,
      velocity: 0,
      lastX: event.clientX,
      lastTime: event.timeStamp,
    }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLUListElement>) => {
    const start = drag.current
    if (!start) return
    const distance = event.clientX - start.x
    if (!start.moved && Math.abs(distance) < 4) return
    if (!start.moved) {
      setDragging(true)
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }
    const elapsed = Math.max(event.timeStamp - start.lastTime, 1)
    drag.current = {
      ...start,
      moved: true,
      velocity: (event.clientX - start.lastX) / elapsed,
      lastX: event.clientX,
      lastTime: event.timeStamp,
    }
    event.currentTarget.scrollLeft = start.left - distance
  }

  const settle = (track: HTMLUListElement, velocity: number) => {
    const cards = Array.from(track.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    )
    const first = cards[0]
    if (!first) return
    const origin = first.offsetLeft
    const projected = track.scrollLeft - velocity * 250
    const target = cards.reduce(
      (best, card) =>
        Math.abs(card.offsetLeft - origin - projected) <
        Math.abs(best - projected)
          ? card.offsetLeft - origin
          : best,
      0
    )
    setSettling(true)
    track.scrollTo({ left: target, behavior: scrollBehavior() })
    window.setTimeout(() => setSettling(false), 450)
  }

  const endDrag = (event: React.PointerEvent<HTMLUListElement>) => {
    const state = drag.current
    drag.current = null
    if (!state?.moved) return
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    settle(event.currentTarget, state.velocity)
    window.setTimeout(() => setDragging(false), 0)
  }

  const onClickCapture = (event: React.MouseEvent<HTMLUListElement>) => {
    if (!dragging) return
    event.preventDefault()
    event.stopPropagation()
  }

  const measure = () => {
    const track = trackRef.current
    if (!track) return
    setEdges({
      start: track.scrollLeft <= 4,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
    })
  }

  const move = (direction: 1 | -1) => {
    const track = trackRef.current
    const card = track?.firstElementChild
    if (!track || !(card instanceof HTMLElement)) return
    track.scrollBy({
      left: direction * (card.offsetWidth + 16),
      behavior: scrollBehavior(),
    })
  }

  return (
    <div>
      <div className="container-page mb-8 flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          size="icon"
          aria-label="Previous story"
          disabled={edges.start}
          onClick={() => move(-1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Next story"
          disabled={edges.end}
          onClick={() => move(1)}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
        {action}
      </div>
      <ul
        ref={trackRef}
        aria-label="Case studies"
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(event) => event.preventDefault()}
        className={cn(
          "flex cursor-grab scroll-px-5 [scrollbar-width:none] gap-4 overflow-x-auto overscroll-x-contain px-5 pb-2 select-none md:scroll-px-8 md:px-8 xl:scroll-px-[max(3rem,calc((100vw-1360px)/2+3rem))] xl:px-[max(3rem,calc((100vw-1360px)/2+3rem))] [&::-webkit-scrollbar]:hidden",
          dragging && "cursor-grabbing",
          dragging || settling ? "snap-none" : "snap-x snap-mandatory"
        )}
      >
        {studies.map((study) => (
          <StoryCard
            key={study.slug}
            study={study}
            className="w-[88%] shrink-0 snap-start md:w-[82%] xl:w-[min(82%,1100px)]"
          />
        ))}
      </ul>
    </div>
  )
}
