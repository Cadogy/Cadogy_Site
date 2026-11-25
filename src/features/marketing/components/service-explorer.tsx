"use client"

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

import { services } from "../content"

const STEPS: Partial<Record<string, number>> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
}

const indexFromHash = () =>
  services.findIndex((service) => `#${service.slug}` === window.location.hash)

export function ServiceExplorer() {
  const id = useId()
  const [active, setActive] = useState(0)
  const tabsRef = useRef<HTMLDivElement>(null)
  const service = services[active] ?? services[0]

  useEffect(() => {
    const sync = () => {
      const index = indexFromHash()
      if (index >= 0) setActive(index)
    }
    sync()
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])

  const select = (index: number) => {
    const next = (index + services.length) % services.length
    setActive(next)
    const tab = tabsRef.current?.children[next]
    if (tab instanceof HTMLElement) tab.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = STEPS[event.key]
    if (step === undefined) return
    event.preventDefault()
    select(active + step)
  }

  if (!service) return null

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Services"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:col-span-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
      >
        {services.map((item, index) => (
          <button
            key={item.slug}
            id={item.slug}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-controls={`${id}-panel`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => select(index)}
            className={cn(
              "flex min-h-11 shrink-0 scroll-mt-24 items-center gap-3 rounded-control px-4 text-left text-sm transition-colors lg:min-h-14 lg:text-base",
              index === active
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "hidden h-5 w-0.5 rounded-full lg:block",
                index === active ? "bg-brand" : "bg-border"
              )}
            />
            {item.title}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={service.slug}
        className="lg:col-span-8"
      >
        <div className="relative isolate aspect-video transform-gpu overflow-hidden rounded-media border bg-card">
          <Image
            key={service.capture.image}
            src={service.capture.image}
            alt={service.capture.alt}
            fill
            sizes="(min-width: 1024px) 62vw, 100vw"
            quality={85}
            className="animate-in object-cover object-top duration-200 fade-in motion-reduce:animate-none"
          />
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <p className="text-lead">{service.detail}</p>
          <ul className="rule-list">
            {service.includes.map((item) => (
              <li key={item} className="py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
