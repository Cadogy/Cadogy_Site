"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export function RollingNumber({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === "undefined") return
    element.dataset.roll = "waiting"
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        element.dataset.roll = "go"
        observer.disconnect()
      },
      { threshold: 0.6 }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <span ref={ref} className={cn("group/roll inline-flex", className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="inline-flex">
        {[...value].map((character, index) =>
          /\d/.test(character) ? (
            <span
              key={index}
              data-slot="digit"
              className="inline-block overflow-hidden"
            >
              <span
                className="inline-block motion-safe:group-data-[roll=go]/roll:animate-[digit-in_700ms_var(--ease-soft)_both] motion-safe:group-data-[roll=waiting]/roll:translate-y-full motion-safe:group-data-[roll=waiting]/roll:opacity-0"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                {character}
              </span>
            </span>
          ) : (
            <span key={index}>{character}</span>
          )
        )}
      </span>
    </span>
  )
}
