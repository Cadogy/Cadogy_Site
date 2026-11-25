"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react"
import { Pause, Play } from "lucide-react"

import { useInView } from "@/lib/hooks/use-in-view"
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { pillTabClass } from "@/components/ui/pill-tab"

import type { CaseStudy } from "../content"
import { CaseStudyFeature } from "./case-study-feature"

const ROTATION_MS = 8000
const targetFor = (key: string, active: number, last: number) => {
  const targets: Partial<Record<string, number>> = {
    ArrowRight: active + 1,
    ArrowDown: active + 1,
    ArrowLeft: active - 1,
    ArrowUp: active - 1,
    Home: 0,
    End: last,
  }
  return targets[key]
}

export function CaseStudyShowcase({
  studies,
}: {
  studies: readonly CaseStudy[]
}) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [stopped, setStopped] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const reducedMotion = useReducedMotion()
  const inView = useInView(rootRef)

  const canRotate = studies.length > 1 && !reducedMotion
  const rotating = canRotate && !stopped && !hovering && !focused && inView

  useEffect(() => {
    if (!rotating) return
    const timer = setTimeout(
      () => setActive((current) => (current + 1) % studies.length),
      ROTATION_MS
    )
    return () => clearTimeout(timer)
  }, [rotating, active, studies.length])

  const select = (index: number) => {
    const next = (index + studies.length) % studies.length
    setStopped(true)
    setActive(next)
    const tab = tabsRef.current?.children[next]
    if (tab instanceof HTMLElement) tab.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = targetFor(event.key, active, studies.length - 1)
    if (target === undefined) return
    event.preventDefault()
    select(target)
  }

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
  }

  return (
    <div ref={rootRef}>
      <div className="flex items-center justify-between gap-4">
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Case studies"
          onKeyDown={handleKeyDown}
          className="-mx-1 flex min-w-0 gap-1 overflow-x-auto px-1"
        >
          {studies.map((study, index) => (
            <button
              key={study.slug}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-selected={index === active}
              aria-controls={`${id}-panel-${index}`}
              tabIndex={index === active ? 0 : -1}
              onClick={() => select(index)}
              className={pillTabClass(index === active)}
            >
              {study.name}
            </button>
          ))}
        </div>
        {canRotate ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={stopped ? "Play case studies" : "Pause case studies"}
            onClick={() => setStopped((current) => !current)}
          >
            {stopped ? (
              <Play className="size-4" aria-hidden="true" />
            ) : (
              <Pause className="size-4" aria-hidden="true" />
            )}
          </Button>
        ) : null}
      </div>
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        className="mt-10 grid"
      >
        {studies.map((study, index) => (
          <div
            key={study.slug}
            role="tabpanel"
            id={`${id}-panel-${index}`}
            aria-labelledby={`${id}-tab-${index}`}
            aria-hidden={index !== active}
            inert={index !== active}
            className={cn(
              "col-start-1 row-start-1 transition-[opacity,visibility] duration-500 ease-out motion-reduce:transition-none",
              index === active ? "visible opacity-100" : "invisible opacity-0"
            )}
          >
            <CaseStudyFeature study={study} />
          </div>
        ))}
      </div>
    </div>
  )
}
