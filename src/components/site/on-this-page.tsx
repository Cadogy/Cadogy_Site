"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

type Item = { readonly id: string; readonly label: string }

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const isBoldTitle = (element: Element) =>
  element.tagName !== "P" ||
  (element.children.length === 1 &&
    element.firstElementChild?.tagName === "STRONG" &&
    element.textContent?.trim() ===
      element.firstElementChild.textContent?.trim())

const headingsIn = (selector: string): Item[] => {
  const candidates = document.querySelectorAll(
    `${selector} h2, ${selector} h3, ${selector} p`
  )
  return Array.from(candidates)
    .filter(isBoldTitle)
    .flatMap((heading, index) => {
      const label = heading.textContent?.trim() ?? ""
      if (!label) return []
      if (!heading.id) heading.id = slugify(label) || `section-${index + 1}`
      return [{ id: heading.id, label }]
    })
}

export function OnThisPage({
  items: fixedItems,
  headingsFrom,
  className,
}: {
  items?: readonly Item[]
  headingsFrom?: string
  className?: string
}) {
  const [items, setItems] = useState<readonly Item[]>(fixedItems ?? [])
  const [visible, setVisible] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    if (!headingsFrom) return
    const frame = requestAnimationFrame(() =>
      setItems(headingsIn(headingsFrom))
    )
    return () => cancelAnimationFrame(frame)
  }, [headingsFrom])

  useEffect(() => {
    if (items.length === 0 || typeof IntersectionObserver === "undefined")
      return
    const observer = new IntersectionObserver(
      (entries) =>
        setVisible((current) => {
          const next = new Set(current)
          for (const entry of entries) {
            if (entry.isIntersecting) next.add(entry.target.id)
            else next.delete(entry.target.id)
          }
          return next
        }),
      { rootMargin: "-15% 0px -60% 0px" }
    )
    for (const item of items) {
      const target = document.getElementById(item.id)
      if (target) observer.observe(target)
    }
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null
  const active = items.find((item) => visible.has(item.id))?.id

  return (
    <nav aria-label="On this page" className={className}>
      <p className="text-meta">On this page</p>
      <ul className="mt-4 grid border-l">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={item.id === active ? "location" : undefined}
              className={cn(
                "-ml-px flex min-h-10 items-center border-l py-1 pl-4 text-sm transition-colors",
                item.id === active
                  ? "border-brand text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
