"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const GUTTER =
  "scroll-px-5 px-5 md:scroll-px-8 md:px-8 xl:scroll-px-[max(3rem,calc((100vw-1360px)/2+3rem))] xl:px-[max(3rem,calc((100vw-1360px)/2+3rem))]"

export function Carousel({
  label,
  itemName,
  count,
  action,
  children,
}: {
  label: string
  itemName: string
  count: number
  action?: React.ReactNode
  children: React.ReactNode
}) {
  const trackRef = useRef<HTMLUListElement>(null)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [edges, setEdges] = useState({ start: true, end: count < 2 })

  const onPointerDown = (event: React.PointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return
    drag.current = {
      x: event.clientX,
      left: event.currentTarget.scrollLeft,
      moved: false,
    }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLUListElement>) => {
    const start = drag.current
    if (!start) return
    const distance = event.clientX - start.x
    if (!start.moved && Math.abs(distance) < 4) return
    if (!start.moved) {
      drag.current = { ...start, moved: true }
      setDragging(true)
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }
    event.currentTarget.scrollLeft = start.left - distance
  }

  const endDrag = (event: React.PointerEvent<HTMLUListElement>) => {
    const moved = drag.current?.moved
    drag.current = null
    if (!moved) return
    event.currentTarget.releasePointerCapture?.(event.pointerId)
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
    track.scrollBy({ left: direction * (card.offsetWidth + 16) })
  }

  return (
    <div>
      <div className="container-page mb-8 flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          size="icon"
          aria-label={`Previous ${itemName}`}
          disabled={edges.start}
          onClick={() => move(-1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label={`Next ${itemName}`}
          disabled={edges.end}
          onClick={() => move(1)}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
        {action ? <span className="ml-2">{action}</span> : null}
      </div>
      <ul
        ref={trackRef}
        aria-label={label}
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(event) => event.preventDefault()}
        className={cn(
          "flex cursor-grab [scrollbar-width:none] gap-4 overflow-x-auto overscroll-x-contain pb-2 select-none motion-safe:scroll-smooth [&::-webkit-scrollbar]:hidden",
          GUTTER,
          dragging
            ? "cursor-grabbing snap-none motion-safe:scroll-auto"
            : "snap-x snap-mandatory"
        )}
      >
        {children}
      </ul>
    </div>
  )
}
