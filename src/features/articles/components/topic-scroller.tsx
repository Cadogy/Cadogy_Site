"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { pillTabClass } from "@/components/ui/pill-tab"

type Topic = {
  readonly label: string
  readonly href: string
  readonly current: boolean
}

const EDGE = 4
const STEP = 0.7

const edgesOf = (row: HTMLElement) => ({
  overflow: row.scrollWidth > row.clientWidth + EDGE,
  start: row.scrollLeft <= EDGE,
  end: row.scrollLeft + row.clientWidth >= row.scrollWidth - EDGE,
})

export function TopicScroller({
  topics,
  className,
}: {
  topics: readonly Topic[]
  className?: string
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({
    overflow: false,
    start: true,
    end: true,
  })

  const measure = () => {
    const row = rowRef.current
    if (row) setEdges(edgesOf(row))
  }

  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    row
      .querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView?.({ block: "nearest", inline: "center" })
    setEdges(edgesOf(row))
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => setEdges(edgesOf(row)))
    observer?.observe(row)
    return () => observer?.disconnect()
  }, [])

  const move = (direction: 1 | -1) => {
    const row = rowRef.current
    if (!row) return
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    row.scrollBy({
      left: direction * row.clientWidth * STEP,
      behavior: reduce ? "auto" : "smooth",
    })
  }

  return (
    <nav
      aria-label="Topics"
      className={cn("flex items-center gap-3", className)}
    >
      <div
        ref={rowRef}
        onScroll={measure}
        className="flex min-w-0 flex-1 [scrollbar-width:none] gap-1 overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
      >
        {topics.map((topic) => (
          <Link
            key={topic.href}
            href={topic.href}
            aria-current={topic.current ? "page" : undefined}
            className={cn(
              pillTabClass(topic.current),
              "rounded-full px-5 text-base whitespace-nowrap sm:text-sm"
            )}
          >
            {topic.label}
          </Link>
        ))}
      </div>
      {edges.overflow ? (
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Scroll topics left"
            disabled={edges.start}
            onClick={() => move(-1)}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Scroll topics right"
            disabled={edges.end}
            onClick={() => move(1)}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </nav>
  )
}
