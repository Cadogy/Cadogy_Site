"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type KeyboardEvent,
} from "react"
import { Pause, Play } from "lucide-react"

import { cn } from "@/lib/utils"

import type { CaseStudy } from "../content"
import { CaseStudyFeature } from "./case-study-feature"

const ROTATION_MS = 8000
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

const subscribeToMotion = (onChange: () => void) => {
  if (typeof window.matchMedia !== "function") return () => undefined
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia(REDUCED_MOTION).matches

const useReducedMotion = () =>
  useSyncExternalStore(subscribeToMotion, prefersReducedMotion, () => true)

const useInView = (ref: React.RefObject<HTMLElement | null>) => {
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry?.isIntersecting ?? true)
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return inView
}

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
              className={cn(
                "inline-flex h-11 shrink-0 items-center rounded-full px-5 text-sm transition-colors",
                index === active
                  ? "bg-foreground/8 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {study.name}
            </button>
          ))}
        </div>
        {canRotate ? (
          <button
            type="button"
            aria-label={stopped ? "Play case studies" : "Pause case studies"}
            onClick={() => setStopped((current) => !current)}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-input text-foreground transition-colors hover:bg-foreground/8"
          >
            {stopped ? (
              <Play className="size-4" aria-hidden="true" />
            ) : (
              <Pause className="size-4" aria-hidden="true" />
            )}
          </button>
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
