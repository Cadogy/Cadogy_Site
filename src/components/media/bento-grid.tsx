import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

export type BentoItem = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly href: string
  readonly image: string
  readonly alt: string
  readonly span: "wide" | "narrow"
}

const SPAN = {
  wide: {
    cell: "md:col-span-2",
    art: "aspect-video md:aspect-auto",
    sizes: "(min-width: 1024px) 60vw, 100vw",
  },
  narrow: {
    cell: "",
    art: "aspect-4/5 md:aspect-auto",
    sizes: "(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw",
  },
} as const

export function BentoGrid({
  label,
  items,
}: {
  label: string
  items: readonly BentoItem[]
}) {
  return (
    <ul aria-label={label} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <li
          key={item.id}
          className={cn(
            "group relative isolate flex transform-gpu flex-col overflow-hidden rounded-media border bg-card transition-colors hover:border-input",
            SPAN[item.span].cell
          )}
        >
          <div className="flex flex-1 flex-col px-6 pt-6 sm:px-8 sm:pt-8">
            <div
              className={cn(
                "relative isolate transform-gpu overflow-hidden rounded-t-panel border-x border-t md:min-h-80 md:flex-1",
                SPAN[item.span].art
              )}
            >
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes={SPAN[item.span].sizes}
                quality={85}
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
              />
            </div>
          </div>
          <div className="mt-auto border-t p-6 sm:px-8">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-h3">
                <Link href={item.href} className="after:absolute after:inset-0">
                  {item.title}
                </Link>
              </h3>
            </div>
            <p className="mt-2 max-w-md text-pretty text-muted-foreground">
              {item.description}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
