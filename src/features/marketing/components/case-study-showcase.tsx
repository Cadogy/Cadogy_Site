"use client"

import { useId, useRef, useState, type KeyboardEvent } from "react"

import { cn } from "@/lib/utils"

import type { CaseStudy } from "../content"
import { CaseStudyFeature } from "./case-study-feature"

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
  const [active, setActive] = useState(0)
  const tabsRef = useRef<HTMLDivElement>(null)

  const select = (index: number) => {
    const next = (index + studies.length) % studies.length
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

  return (
    <div>
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Case studies"
        onKeyDown={handleKeyDown}
        className="-mx-1 flex gap-1 overflow-x-auto px-1"
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
      <div className="mt-10 grid">
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
